"""Donation / payment API routes (PayPal + M-Pesa)."""

from __future__ import annotations

from datetime import datetime
from functools import wraps
from typing import Callable

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request


def register_payment_routes(
    app,
    *,
    socketio,
    supabase,
    db_ready,
    db_execute,
    try_supabase,
    broadcast_stats=None,
    payments_mod=None,
):
    payments = payments_mod

    def _notify():
        if callable(broadcast_stats):
            try:
                broadcast_stats()
            except Exception as e:
                print(f"stats broadcast after payment: {e}")

    def _get_member(member_id: str):
        if not db_ready() or not member_id:
            return None
        try:
            result = db_execute(
                lambda client: client.table("members").select("*").eq("id", member_id).single().execute()
            )
            return result.data
        except Exception:
            return None

    def optional_jwt(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request(optional=True)
            except Exception:
                pass
            return fn(*args, **kwargs)
        return wrapper

    def super_admin_required(fn: Callable):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            member = _get_member(get_jwt_identity())
            if not member or (member.get("role") or "") != "super_admin":
                return jsonify({"error": "Only the superadmin can manage payment settings"}), 403
            request.admin_member = member
            return fn(*args, **kwargs)
        return wrapper

    def mark_paid(receipt_id: str = None, checkout_id: str = None, transaction_id: str = None, notes: str = None):
        updates = {
            "transaction_status": "completed",
            "paid_at": datetime.utcnow().isoformat(),
        }
        if transaction_id:
            updates["transaction_id"] = transaction_id
        if notes:
            updates["notes"] = notes
        if not db_ready():
            return None
        try:
            q = supabase.table("giving")
            if checkout_id:
                result = db_execute(
                    lambda client: client.table("giving")
                    .update(updates)
                    .eq("checkout_id", checkout_id)
                    .execute()
                )
            elif receipt_id:
                result = db_execute(
                    lambda client: client.table("giving")
                    .update(updates)
                    .eq("receipt_id", receipt_id)
                    .execute()
                )
            else:
                return None
            _notify()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"mark_paid failed: {e}")
            return None

    # ── Public config ──────────────────────────────────────────────────────
    @app.route("/api/payments/config", methods=["GET"])
    def payment_config():
        settings = payments.load_settings(
            supabase=supabase, db_ready=db_ready(), try_supabase=try_supabase
        )
        return jsonify(payments.public_settings(settings)), 200

    # ── Superadmin settings ────────────────────────────────────────────────
    @app.route("/api/admin/payment-settings", methods=["GET"])
    @super_admin_required
    def get_payment_settings():
        settings = payments.load_settings(
            supabase=supabase, db_ready=db_ready(), try_supabase=try_supabase
        )
        return jsonify(payments.admin_settings_view(settings)), 200

    @app.route("/api/admin/payment-settings", methods=["PUT", "PATCH"])
    @super_admin_required
    def update_payment_settings():
        data = request.get_json(silent=True) or {}
        # Allow clearing PayPal email / till with empty string or null
        settings = payments.save_settings(
            supabase=supabase,
            db_ready=db_ready(),
            db_execute=db_execute,
            try_supabase=try_supabase,
            updates=data,
            updated_by=get_jwt_identity(),
        )
        return jsonify({
            "message": "Payment settings updated",
            "settings": payments.admin_settings_view(settings),
        }), 200

    # ── Initiate donation ──────────────────────────────────────────────────
    @app.route("/api/give", methods=["POST"])
    @optional_jwt
    def process_giving():
        if not db_ready():
            return jsonify({"error": "Database not connected"}), 503

        data = request.get_json(silent=True) or {}
        try:
            amount = float(data.get("amount", 0))
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid amount"}), 400
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400

        method = (data.get("payment_method") or "").lower().strip()
        if method in ("card", "paypal", "paypal_card"):
            method = "paypal"
        if method not in ("paypal", "mpesa"):
            return jsonify({"error": "Choose PayPal or M-Pesa"}), 400

        currency = (data.get("currency") or ("KES" if method == "mpesa" else "USD")).upper()
        category = data.get("category") or data.get("type") or "tithe"
        is_recurring = bool(data.get("is_recurring"))
        if data.get("frequency") and data.get("frequency") != "one-time":
            is_recurring = True

        member_id = None
        try:
            member_id = get_jwt_identity()
        except Exception:
            member_id = None

        member = _get_member(member_id) if member_id else None
        donor_name = (data.get("donor_name") or (member or {}).get("full_name") or "").strip()
        donor_email = (data.get("donor_email") or (member or {}).get("email") or "").strip()
        phone = (data.get("phone_number") or data.get("phone") or "").strip()

        if method == "mpesa" and not phone:
            return jsonify({"error": "Phone number is required for M-Pesa"}), 400

        settings = payments.load_settings(
            supabase=supabase, db_ready=db_ready(), try_supabase=try_supabase
        )
        receipt_id = payments.new_receipt_id()

        record = {
            "member_id": member_id,
            "amount": amount,
            "currency": currency,
            "category": category,
            "is_recurring": is_recurring,
            "payment_method": method,
            "receipt_id": receipt_id,
            "transaction_status": "pending",
            "donor_name": donor_name or None,
            "donor_email": donor_email or None,
            "phone_number": phone or None,
        }

        # Drop optional columns if schema not migrated yet — retry minimal insert
        try:
            result = db_execute(lambda client: client.table("giving").insert(record).execute())
        except Exception as e:
            print(f"Giving insert with extras failed, retrying minimal: {e}")
            minimal = {
                "member_id": member_id,
                "amount": amount,
                "currency": currency,
                "category": category,
                "is_recurring": is_recurring,
                "payment_method": method,
                "receipt_id": receipt_id,
                "transaction_status": "pending",
            }
            result = db_execute(lambda client: client.table("giving").insert(minimal).execute())

        if not result.data:
            return jsonify({"error": "Failed to create donation record"}), 500

        donation = result.data[0]
        base = request.host_url.rstrip("/")
        return_url = f"{base}/give?paypal=success&receipt={receipt_id}"
        cancel_url = f"{base}/give?paypal=cancel&receipt={receipt_id}"

        if method == "paypal":
            paypal = payments.create_paypal_order(
                settings=settings,
                amount=amount,
                currency=currency if currency != "KES" else "USD",
                category=category,
                receipt_id=receipt_id,
                return_url=return_url,
                cancel_url=cancel_url,
                is_recurring=is_recurring,
            )
            if not paypal.get("ok"):
                return jsonify({"error": paypal.get("error") or "PayPal unavailable", "receipt_id": receipt_id}), 400

            order_id = paypal.get("order_id")
            if order_id:
                try:
                    db_execute(
                        lambda client: client.table("giving")
                        .update({"checkout_id": order_id, "transaction_id": order_id})
                        .eq("receipt_id", receipt_id)
                        .execute()
                    )
                except Exception as e:
                    print(f"checkout_id update: {e}")

            _notify()
            return jsonify({
                "status": "redirect",
                "payment_method": "paypal",
                "receipt_id": receipt_id,
                "approve_url": paypal.get("approve_url"),
                "order_id": order_id,
                "mode": paypal.get("mode"),
                "donation": donation,
                "message": "Redirecting to PayPal Checkout…",
            }), 200

        # M-Pesa
        pub = payments.public_settings(settings)
        if pub.get("mpesa_stk_configured"):
            cb = (settings.get("mpesa_callback_url") or "").strip() or f"{base}/api/payments/mpesa/callback"
            stk = payments.initiate_stk_push(
                settings=settings,
                amount=amount,
                phone=phone,
                receipt_id=receipt_id,
                callback_url=cb,
            )
            if stk.get("ok"):
                checkout_id = stk.get("checkout_request_id")
                try:
                    db_execute(
                        lambda client: client.table("giving")
                        .update({"checkout_id": checkout_id})
                        .eq("receipt_id", receipt_id)
                        .execute()
                    )
                except Exception as e:
                    print(f"stk checkout update: {e}")
                _notify()
                return jsonify({
                    "status": "stk_sent",
                    "payment_method": "mpesa",
                    "receipt_id": receipt_id,
                    "checkout_request_id": checkout_id,
                    "message": stk.get("customer_message")
                    or "Check your phone and enter your M-Pesa PIN to complete the donation.",
                    "donation": donation,
                }), 200
            # Fall through to manual if STK fails and till exists
            if not pub.get("mpesa_manual_available"):
                return jsonify({"error": stk.get("error") or "M-Pesa STK failed", "receipt_id": receipt_id}), 400

        if not pub.get("mpesa_manual_available"):
            return jsonify({
                "error": "M-Pesa is not configured. Superadmin must add a Till / M-Pesa number.",
                "receipt_id": receipt_id,
            }), 400

        _notify()
        return jsonify({
            "status": "manual_mpesa",
            "payment_method": "mpesa",
            "receipt_id": receipt_id,
            "till_number": pub.get("mpesa_till_number"),
            "amount": amount,
            "currency": "KES",
            "message": "Pay via Lipa na M-Pesa (Buy Goods), then submit your M-Pesa transaction code.",
            "donation": donation,
        }), 200

    @app.route("/api/payments/paypal/capture", methods=["POST"])
    def paypal_capture():
        data = request.get_json(silent=True) or {}
        order_id = (data.get("order_id") or "").strip()
        receipt_id = (data.get("receipt_id") or "").strip()
        settings = payments.load_settings(
            supabase=supabase, db_ready=db_ready(), try_supabase=try_supabase
        )

        if order_id and payments.paypal_client_secret():
            captured = payments.capture_paypal_order(settings=settings, order_id=order_id)
            if not captured.get("ok"):
                return jsonify({"error": captured.get("error") or "Capture failed"}), 400
            row = mark_paid(
                receipt_id=receipt_id,
                checkout_id=order_id,
                transaction_id=captured.get("transaction_id") or order_id,
                notes="PayPal capture completed",
            )
            return jsonify({"status": "completed", "donation": row, "receipt_id": receipt_id}), 200

        # Hosted PayPal return — mark completed when donor returns with receipt
        if receipt_id:
            row = mark_paid(receipt_id=receipt_id, notes="PayPal hosted checkout return")
            if row:
                return jsonify({"status": "completed", "donation": row, "receipt_id": receipt_id}), 200
            # Update by receipt even if mark failed columns
            try:
                result = db_execute(
                    lambda client: client.table("giving")
                    .update({
                        "transaction_status": "completed",
                        "paid_at": datetime.utcnow().isoformat(),
                    })
                    .eq("receipt_id", receipt_id)
                    .execute()
                )
                _notify()
                return jsonify({
                    "status": "completed",
                    "donation": result.data[0] if result.data else None,
                    "receipt_id": receipt_id,
                }), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        return jsonify({"error": "Missing order_id or receipt_id"}), 400

    @app.route("/api/payments/mpesa/callback", methods=["POST"])
    def mpesa_callback():
        body = request.get_json(silent=True) or {}
        parsed = payments.parse_stk_callback(body)
        print(f"M-Pesa callback: {parsed}")
        if parsed.get("success") and parsed.get("checkout_request_id"):
            mark_paid(
                checkout_id=parsed["checkout_request_id"],
                transaction_id=parsed.get("mpesa_receipt"),
                notes=parsed.get("result_desc"),
            )
        elif parsed.get("checkout_request_id"):
            try:
                db_execute(
                    lambda client: client.table("giving")
                    .update({
                        "transaction_status": "failed",
                        "notes": parsed.get("result_desc") or "STK cancelled/failed",
                    })
                    .eq("checkout_id", parsed["checkout_request_id"])
                    .execute()
                )
            except Exception as e:
                print(f"mpesa fail update: {e}")
        return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200

    @app.route("/api/payments/mpesa/status/<receipt_id>", methods=["GET"])
    def mpesa_status(receipt_id):
        if not db_ready():
            return jsonify({"error": "Database not connected"}), 503
        result = try_supabase(
            lambda: supabase.table("giving").select("*").eq("receipt_id", receipt_id).limit(1).execute(),
            None,
        )
        if not result or not result.data:
            return jsonify({"error": "Donation not found"}), 404
        row = result.data[0]
        return jsonify({
            "receipt_id": receipt_id,
            "status": row.get("transaction_status"),
            "transaction_id": row.get("transaction_id"),
            "paid_at": row.get("paid_at"),
            "amount": row.get("amount"),
            "currency": row.get("currency"),
        }), 200

    @app.route("/api/payments/mpesa/confirm-code", methods=["POST"])
    @optional_jwt
    def mpesa_confirm_code():
        """Manual Till flow: donor submits M-Pesa transaction code after paying."""
        data = request.get_json(silent=True) or {}
        receipt_id = (data.get("receipt_id") or "").strip()
        code = (data.get("transaction_code") or data.get("mpesa_code") or "").strip().upper()
        if not receipt_id or not code or len(code) < 8:
            return jsonify({"error": "Enter a valid M-Pesa transaction code"}), 400

        row = mark_paid(
            receipt_id=receipt_id,
            transaction_id=code,
            notes="Manual Till confirmation — verify in M-Pesa statement",
        )
        if not row:
            try:
                result = db_execute(
                    lambda client: client.table("giving")
                    .update({
                        "transaction_status": "completed",
                        "transaction_id": code,
                        "paid_at": datetime.utcnow().isoformat(),
                    })
                    .eq("receipt_id", receipt_id)
                    .execute()
                )
                row = result.data[0] if result.data else None
                _notify()
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        return jsonify({
            "status": "completed",
            "message": "Thank you! Your donation has been recorded.",
            "donation": row,
            "receipt_id": receipt_id,
        }), 200
