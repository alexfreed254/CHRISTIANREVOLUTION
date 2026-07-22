"""PayPal Checkout + Safaricom Daraja (M-Pesa STK Push) helpers."""

from __future__ import annotations

import base64
import os
import secrets
from datetime import datetime
from typing import Any
from urllib.parse import quote

import httpx

# In-memory fallback when payment_settings table is missing
_SETTINGS_CACHE: dict[str, Any] = {
    "paypal_email": os.environ.get("PAYPAL_EMAIL") or "",
    "paypal_client_id": os.environ.get("PAYPAL_CLIENT_ID") or "",
    "mpesa_till_number": os.environ.get("MPESA_TILL_NUMBER") or "",
    "mpesa_shortcode": os.environ.get("MPESA_SHORTCODE") or "",
    "mpesa_passkey": os.environ.get("MPESA_PASSKEY") or "",
    "mpesa_consumer_key": os.environ.get("MPESA_CONSUMER_KEY") or "",
    "mpesa_consumer_secret": os.environ.get("MPESA_CONSUMER_SECRET") or "",
    "mpesa_callback_url": os.environ.get("MPESA_CALLBACK_URL") or "",
    "stripe_publishable_key": os.environ.get("STRIPE_PUBLISHABLE_KEY") or "",
    "stripe_account_id": os.environ.get("STRIPE_ACCOUNT_ID") or "",
    "stripe_display_name": os.environ.get("STRIPE_DISPLAY_NAME") or "Christ Revolution Movement",
    "stripe_enabled": os.environ.get("STRIPE_ENABLED", "").lower() in ("1", "true", "yes"),
}


def _env_overlay(row: dict | None) -> dict:
    """Merge DB row with env overrides (env wins when set)."""
    base = dict(_SETTINGS_CACHE)
    if row:
        for k, v in row.items():
            if v is not None and str(v).strip() != "":
                base[k] = v
    for key, env_key in [
        ("paypal_email", "PAYPAL_EMAIL"),
        ("paypal_client_id", "PAYPAL_CLIENT_ID"),
        ("mpesa_till_number", "MPESA_TILL_NUMBER"),
        ("mpesa_shortcode", "MPESA_SHORTCODE"),
        ("mpesa_passkey", "MPESA_PASSKEY"),
        ("mpesa_consumer_key", "MPESA_CONSUMER_KEY"),
        ("mpesa_consumer_secret", "MPESA_CONSUMER_SECRET"),
        ("mpesa_callback_url", "MPESA_CALLBACK_URL"),
        ("stripe_publishable_key", "STRIPE_PUBLISHABLE_KEY"),
        ("stripe_account_id", "STRIPE_ACCOUNT_ID"),
        ("stripe_display_name", "STRIPE_DISPLAY_NAME"),
    ]:
        env_val = (os.environ.get(env_key) or "").strip()
        if env_val:
            base[key] = env_val
    if os.environ.get("STRIPE_ENABLED", "").lower() in ("1", "true", "yes"):
        base["stripe_enabled"] = True
    return base


def public_settings(settings: dict) -> dict:
    """Safe fields for the donation page (no secrets)."""
    return {
        "paypal_email": (settings.get("paypal_email") or "").strip() or None,
        "paypal_client_id": (settings.get("paypal_client_id") or "").strip() or None,
        "paypal_configured": bool((settings.get("paypal_email") or "").strip()
                                  or (settings.get("paypal_client_id") or "").strip()
                                  or (os.environ.get("PAYPAL_CLIENT_SECRET") or "").strip()),
        "mpesa_till_number": (settings.get("mpesa_till_number") or "").strip() or None,
        "mpesa_shortcode": (settings.get("mpesa_shortcode") or "").strip() or None,
        "mpesa_stk_configured": bool(
            (settings.get("mpesa_consumer_key") or "").strip()
            and (settings.get("mpesa_consumer_secret") or "").strip()
            and (settings.get("mpesa_passkey") or "").strip()
            and ((settings.get("mpesa_shortcode") or settings.get("mpesa_till_number") or "").strip())
        ),
        "mpesa_manual_available": bool((settings.get("mpesa_till_number") or "").strip()),
        "paypal_mode": (os.environ.get("PAYPAL_MODE") or "sandbox").lower(),
        "mpesa_env": (os.environ.get("MPESA_ENV") or "sandbox").lower(),
        "stripe_publishable_key": (settings.get("stripe_publishable_key") or "").strip() or None,
        "stripe_display_name": (settings.get("stripe_display_name") or "Christ Revolution Movement").strip(),
        "stripe_configured": stripe_is_configured(settings),
    }


def stripe_secret_key() -> str:
    return (os.environ.get("STRIPE_SECRET_KEY") or "").strip()


def stripe_webhook_secret() -> str:
    return (os.environ.get("STRIPE_WEBHOOK_SECRET") or "").strip()


def stripe_is_configured(settings: dict) -> bool:
    if not stripe_secret_key():
        return False
    enabled = settings.get("stripe_enabled")
    if enabled is False or enabled == 0 or str(enabled).lower() in ("false", "0", "no"):
        return False
    if enabled is True or enabled == 1 or str(enabled).lower() in ("true", "1", "yes"):
        return True
    return bool(
        (settings.get("stripe_publishable_key") or "").strip()
        or (settings.get("stripe_account_id") or "").strip()
        or os.environ.get("STRIPE_ENABLED", "").lower() in ("1", "true", "yes")
    )


def load_settings(*, supabase, db_ready, try_supabase) -> dict:
    if db_ready and supabase is not None:
        result = try_supabase(
            lambda: supabase.table("payment_settings").select("*").limit(1).execute(),
            None,
        )
        if result and result.data:
            merged = _env_overlay(result.data[0])
            _SETTINGS_CACHE.update({k: merged.get(k) for k in _SETTINGS_CACHE})
            return merged
    return _env_overlay(None)


def save_settings(
    *,
    supabase,
    db_ready,
    db_execute,
    try_supabase,
    updates: dict,
    updated_by: str | None = None,
) -> dict:
    """Upsert payment settings. Empty string clears paypal_email / till fields.
    Omitted secret keys are left unchanged.
    """
    allowed = {
        "paypal_email",
        "paypal_client_id",
        "mpesa_till_number",
        "mpesa_shortcode",
        "mpesa_passkey",
        "mpesa_consumer_key",
        "mpesa_consumer_secret",
        "mpesa_callback_url",
        "stripe_publishable_key",
        "stripe_account_id",
        "stripe_display_name",
        "stripe_enabled",
    }
    payload = {k: updates[k] for k in allowed if k in updates}
    # Normalize empties to null for clearable display fields
    clearable = (
        "paypal_email", "paypal_client_id", "mpesa_till_number", "mpesa_shortcode",
        "mpesa_callback_url", "stripe_publishable_key", "stripe_account_id", "stripe_display_name",
    )
    for key in clearable:
        if key in payload and isinstance(payload[key], str) and not payload[key].strip():
            payload[key] = None
        elif key in payload and isinstance(payload[key], str):
            payload[key] = payload[key].strip()

    # Secrets: only update when a non-empty value is provided
    for key in ("mpesa_passkey", "mpesa_consumer_key", "mpesa_consumer_secret"):
        if key in payload:
            if not payload[key] or (isinstance(payload[key], str) and not str(payload[key]).strip()):
                payload.pop(key)
            else:
                payload[key] = str(payload[key]).strip()

    payload["updated_at"] = datetime.utcnow().isoformat()
    if updated_by:
        payload["updated_by"] = updated_by

    # Update memory cache for provided keys
    for k, v in payload.items():
        if k == "stripe_enabled":
            _SETTINGS_CACHE["stripe_enabled"] = (
                bool(v) if not isinstance(v, str) else str(v).lower() in ("true", "1", "yes")
            )
        elif k in _SETTINGS_CACHE:
            _SETTINGS_CACHE[k] = v or ""

    if not db_ready or supabase is None:
        return load_settings(supabase=supabase, db_ready=db_ready, try_supabase=try_supabase)

    existing = try_supabase(
        lambda: supabase.table("payment_settings").select("id").limit(1).execute(),
        None,
    )
    try:
        if existing and existing.data:
            row_id = existing.data[0]["id"]
            db_execute(
                lambda client: client.table("payment_settings").update(payload).eq("id", row_id).execute()
            )
        else:
            db_execute(lambda client: client.table("payment_settings").insert(payload).execute())
    except Exception as e:
        print(f"payment_settings save failed (using memory): {e}")

    return load_settings(supabase=supabase, db_ready=db_ready, try_supabase=try_supabase)


def admin_settings_view(settings: dict) -> dict:
    """Full settings for superadmin (mask secrets)."""
    def mask(val: str | None) -> str | None:
        if not val:
            return None
        s = str(val)
        if len(s) <= 6:
            return "••••••"
        return s[:3] + "••••" + s[-2:]

    return {
        "paypal_email": settings.get("paypal_email") or "",
        "paypal_client_id": settings.get("paypal_client_id") or "",
        "mpesa_till_number": settings.get("mpesa_till_number") or "",
        "mpesa_shortcode": settings.get("mpesa_shortcode") or "",
        "mpesa_callback_url": settings.get("mpesa_callback_url") or "",
        "mpesa_passkey_set": bool(settings.get("mpesa_passkey")),
        "mpesa_consumer_key_set": bool(settings.get("mpesa_consumer_key")),
        "mpesa_consumer_secret_set": bool(settings.get("mpesa_consumer_secret")),
        "mpesa_passkey_masked": mask(settings.get("mpesa_passkey")),
        "mpesa_consumer_key_masked": mask(settings.get("mpesa_consumer_key")),
        "stripe_publishable_key": settings.get("stripe_publishable_key") or "",
        "stripe_account_id": settings.get("stripe_account_id") or "",
        "stripe_display_name": settings.get("stripe_display_name") or "Christ Revolution Movement",
        "stripe_enabled": bool(settings.get("stripe_enabled")),
        "public": public_settings(settings),
    }


# ─── PayPal ───────────────────────────────────────────────────────────────────

def paypal_api_base() -> str:
    mode = (os.environ.get("PAYPAL_MODE") or "sandbox").lower()
    if mode == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


def paypal_web_base() -> str:
    mode = (os.environ.get("PAYPAL_MODE") or "sandbox").lower()
    if mode == "live":
        return "https://www.paypal.com"
    return "https://www.sandbox.paypal.com"


def paypal_client_secret() -> str:
    return (os.environ.get("PAYPAL_CLIENT_SECRET") or "").strip()


def get_paypal_access_token(client_id: str, client_secret: str) -> str | None:
    if not client_id or not client_secret:
        return None
    auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    try:
        with httpx.Client(timeout=30) as client:
            res = client.post(
                f"{paypal_api_base()}/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {auth}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={"grant_type": "client_credentials"},
            )
            if res.status_code >= 400:
                print(f"PayPal token error: {res.status_code} {res.text}")
                return None
            return res.json().get("access_token")
    except Exception as e:
        print(f"PayPal token exception: {e}")
        return None


def create_paypal_order(
    *,
    settings: dict,
    amount: float,
    currency: str,
    category: str,
    receipt_id: str,
    return_url: str,
    cancel_url: str,
    is_recurring: bool = False,
) -> dict:
    """
    Create a PayPal Checkout order when API credentials exist.
    Falls back to a hosted PayPal donation redirect using business email.
    """
    currency = (currency or "USD").upper()
    if currency not in ("USD", "EUR", "GBP", "CAD", "AUD"):
        # PayPal donate classic works best with major currencies; KES donors use M-Pesa
        currency = "USD"

    client_id = (settings.get("paypal_client_id") or os.environ.get("PAYPAL_CLIENT_ID") or "").strip()
    client_secret = paypal_client_secret()
    business = (settings.get("paypal_email") or "").strip()

    if client_id and client_secret:
        token = get_paypal_access_token(client_id, client_secret)
        if not token:
            return {"ok": False, "error": "Could not authenticate with PayPal. Check credentials."}

        intent = "CAPTURE"
        body: dict[str, Any] = {
            "intent": intent,
            "purchase_units": [{
                "reference_id": receipt_id,
                "description": f"CRM Donation — {category}",
                "custom_id": receipt_id,
                "amount": {
                    "currency_code": currency,
                    "value": f"{amount:.2f}",
                },
            }],
            "application_context": {
                "brand_name": "Christ Revolution Movement",
                "landing_page": "BILLING",
                "user_action": "PAY_NOW",
                "return_url": return_url,
                "cancel_url": cancel_url,
            },
        }
        # Note: true PayPal Subscriptions need a separate Billing Plan; for recurring
        # we flag the donation and use one-time Checkout with a note for now, or
        # create a subscription if PAYPAL_PLAN_ID is set.
        plan_id = (os.environ.get("PAYPAL_PLAN_ID") or "").strip()
        if is_recurring and plan_id:
            # Subscriptions API path
            try:
                with httpx.Client(timeout=30) as client:
                    sub_res = client.post(
                        f"{paypal_api_base()}/v1/billing/subscriptions",
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Content-Type": "application/json",
                            "Prefer": "return=representation",
                        },
                        json={
                            "plan_id": plan_id,
                            "custom_id": receipt_id,
                            "application_context": {
                                "brand_name": "Christ Revolution Movement",
                                "return_url": return_url,
                                "cancel_url": cancel_url,
                            },
                        },
                    )
                    if sub_res.status_code < 400:
                        data = sub_res.json()
                        approve = next(
                            (l["href"] for l in data.get("links", []) if l.get("rel") == "approve"),
                            None,
                        )
                        return {
                            "ok": True,
                            "mode": "subscription",
                            "order_id": data.get("id"),
                            "approve_url": approve,
                            "raw": data,
                        }
            except Exception as e:
                print(f"PayPal subscription error: {e}")

        try:
            with httpx.Client(timeout=30) as client:
                res = client.post(
                    f"{paypal_api_base()}/v2/checkout/orders",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
                if res.status_code >= 400:
                    print(f"PayPal order error: {res.text}")
                    return {"ok": False, "error": "PayPal could not create the payment order."}
                data = res.json()
                approve = next(
                    (l["href"] for l in data.get("links", []) if l.get("rel") == "approve"),
                    None,
                )
                return {
                    "ok": True,
                    "mode": "order",
                    "order_id": data.get("id"),
                    "approve_url": approve,
                    "raw": data,
                }
        except Exception as e:
            print(f"PayPal order exception: {e}")
            return {"ok": False, "error": str(e)}

    if business:
        # Hosted donation / PayPal.Me-style redirect (no API secret required)
        web = paypal_web_base()
        params = (
            f"business={quote(business)}"
            f"&item_name={quote(f'CRM {category} donation')}"
            f"&currency_code={quote(currency)}"
            f"&amount={amount:.2f}"
            f"&custom={quote(receipt_id)}"
            f"&return={quote(return_url)}"
            f"&cancel_return={quote(cancel_url)}"
            f"&rm=2"
        )
        if is_recurring:
            # PayPal subscriptions button (a3=amount, p3=1, t3=M monthly)
            url = (
                f"{web}/cgi-bin/webscr?cmd=_xclick-subscriptions"
                f"&{params}&a3={amount:.2f}&p3=1&t3=M&src=1&sra=1"
            )
        else:
            url = f"{web}/donate/?{params}"
        return {
            "ok": True,
            "mode": "hosted",
            "order_id": None,
            "approve_url": url,
        }

    return {
        "ok": False,
        "error": "PayPal is not configured. Superadmin must add a PayPal email or API credentials.",
    }


def capture_paypal_order(*, settings: dict, order_id: str) -> dict:
    client_id = (settings.get("paypal_client_id") or os.environ.get("PAYPAL_CLIENT_ID") or "").strip()
    client_secret = paypal_client_secret()
    if not client_id or not client_secret or not order_id:
        return {"ok": False, "error": "Missing PayPal credentials or order id"}

    token = get_paypal_access_token(client_id, client_secret)
    if not token:
        return {"ok": False, "error": "PayPal auth failed"}

    try:
        with httpx.Client(timeout=30) as client:
            res = client.post(
                f"{paypal_api_base()}/v2/checkout/orders/{order_id}/capture",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            data = res.json() if res.content else {}
            if res.status_code >= 400:
                return {"ok": False, "error": data.get("message") or res.text, "raw": data}
            status = data.get("status")
            capture_id = None
            try:
                capture_id = (
                    data["purchase_units"][0]["payments"]["captures"][0]["id"]
                )
            except Exception:
                capture_id = data.get("id")
            return {
                "ok": status in ("COMPLETED", "APPROVED") or True,
                "status": status,
                "transaction_id": capture_id,
                "raw": data,
            }
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ─── M-Pesa Daraja ────────────────────────────────────────────────────────────

def mpesa_base_url() -> str:
    env = (os.environ.get("MPESA_ENV") or "sandbox").lower()
    if env == "production" or env == "live":
        return "https://api.safaricom.co.ke"
    return "https://sandbox.safaricom.co.ke"


def normalize_msisdn(phone: str) -> str | None:
    """Normalize to 2547XXXXXXXX."""
    if not phone:
        return None
    digits = "".join(c for c in str(phone) if c.isdigit())
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    elif digits.startswith("7") and len(digits) == 9:
        digits = "254" + digits
    elif digits.startswith("254") and len(digits) == 12:
        pass
    else:
        return None
    return digits


def get_mpesa_token(settings: dict) -> str | None:
    key = (settings.get("mpesa_consumer_key") or "").strip()
    secret = (settings.get("mpesa_consumer_secret") or "").strip()
    if not key or not secret:
        return None
    auth = base64.b64encode(f"{key}:{secret}".encode()).decode()
    try:
        with httpx.Client(timeout=30) as client:
            res = client.get(
                f"{mpesa_base_url()}/oauth/v1/generate?grant_type=client_credentials",
                headers={"Authorization": f"Basic {auth}"},
            )
            if res.status_code >= 400:
                print(f"M-Pesa token error: {res.status_code} {res.text}")
                return None
            return res.json().get("access_token")
    except Exception as e:
        print(f"M-Pesa token exception: {e}")
        return None


def stk_password(shortcode: str, passkey: str, timestamp: str) -> str:
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode()).decode()


def initiate_stk_push(
    *,
    settings: dict,
    amount: float,
    phone: str,
    receipt_id: str,
    account_reference: str | None = None,
    callback_url: str | None = None,
) -> dict:
    """Send Lipa Na M-Pesa Online (STK Push) request."""
    msisdn = normalize_msisdn(phone)
    if not msisdn:
        return {"ok": False, "error": "Enter a valid Kenyan phone number (e.g. 07XX XXX XXX)"}

    shortcode = (
        (settings.get("mpesa_shortcode") or "").strip()
        or (settings.get("mpesa_till_number") or "").strip()
    )
    passkey = (settings.get("mpesa_passkey") or "").strip()
    if not shortcode or not passkey:
        return {
            "ok": False,
            "error": "M-Pesa STK is not fully configured. Superadmin must set shortcode and passkey.",
            "fallback": "manual",
        }

    token = get_mpesa_token(settings)
    if not token:
        return {"ok": False, "error": "Could not authenticate with Safaricom Daraja API."}

    # Amount must be integer KES for STK
    amount_kes = int(round(float(amount)))
    if amount_kes < 1:
        return {"ok": False, "error": "Amount must be at least KES 1"}

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = stk_password(shortcode, passkey, timestamp)
    cb = (callback_url or settings.get("mpesa_callback_url") or "").strip()
    if not cb:
        return {"ok": False, "error": "M-Pesa callback URL is not configured."}

    # TransactionType: CustomerBuyGoodsOnline for Till, CustomerPayBillOnline for Paybill
    till = (settings.get("mpesa_till_number") or "").strip()
    tx_type = "CustomerBuyGoodsOnline" if till and till == shortcode else "CustomerPayBillOnline"
    if till and not (settings.get("mpesa_shortcode") or "").strip():
        tx_type = "CustomerBuyGoodsOnline"

    body = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": tx_type,
        "Amount": amount_kes,
        "PartyA": msisdn,
        "PartyB": shortcode,
        "PhoneNumber": msisdn,
        "CallBackURL": cb,
        "AccountReference": (account_reference or receipt_id)[:12],
        "TransactionDesc": f"CRM {receipt_id}"[:13],
    }

    try:
        with httpx.Client(timeout=45) as client:
            res = client.post(
                f"{mpesa_base_url()}/mpesa/stkpush/v1/processrequest",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            data = res.json() if res.content else {}
            if res.status_code >= 400 or str(data.get("ResponseCode", "1")) != "0":
                msg = data.get("errorMessage") or data.get("ResponseDescription") or res.text
                print(f"STK push failed: {data}")
                return {"ok": False, "error": msg or "STK Push failed", "raw": data}
            return {
                "ok": True,
                "checkout_request_id": data.get("CheckoutRequestID"),
                "merchant_request_id": data.get("MerchantRequestID"),
                "customer_message": data.get("CustomerMessage"),
                "raw": data,
            }
    except Exception as e:
        print(f"STK exception: {e}")
        return {"ok": False, "error": str(e)}


def parse_stk_callback(body: dict) -> dict:
    """Extract result from Daraja STK callback payload."""
    try:
        result = body.get("Body", {}).get("stkCallback", {})
        checkout_id = result.get("CheckoutRequestID")
        result_code = result.get("ResultCode")
        result_desc = result.get("ResultDesc")
        meta = {}
        items = (result.get("CallbackMetadata") or {}).get("Item") or []
        for item in items:
            name = item.get("Name")
            if name:
                meta[name] = item.get("Value")
        return {
            "checkout_request_id": checkout_id,
            "success": int(result_code or 1) == 0,
            "result_code": result_code,
            "result_desc": result_desc,
            "mpesa_receipt": meta.get("MpesaReceiptNumber"),
            "amount": meta.get("Amount"),
            "phone": meta.get("PhoneNumber"),
            "transaction_date": meta.get("TransactionDate"),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def new_receipt_id() -> str:
    return f"CRM-{secrets.token_hex(5).upper()}"


# ─── Stripe Checkout ──────────────────────────────────────────────────────────

def _stripe_minor_units(amount: float, currency: str) -> int:
    currency = (currency or "USD").upper()
    zero_decimal = {"JPY", "KRW", "VND"}
    if currency in zero_decimal:
        return int(round(amount))
    return int(round(float(amount) * 100))


def create_stripe_checkout(
    *,
    settings: dict,
    amount: float,
    currency: str,
    category: str,
    receipt_id: str,
    success_url: str,
    cancel_url: str,
    donor_email: str | None = None,
    is_recurring: bool = False,
) -> dict:
    """Create Stripe Checkout Session. Funds go to connected account when configured."""
    secret = stripe_secret_key()
    if not secret or not stripe_is_configured(settings):
        return {
            "ok": False,
            "error": "Stripe is not configured. Superadmin must enable Stripe and set STRIPE_SECRET_KEY on the server.",
        }

    try:
        import stripe
    except ImportError:
        return {"ok": False, "error": "Stripe library not installed"}

    currency = (currency or "USD").upper()
    minor = _stripe_minor_units(amount, currency)
    if minor < 50 and currency == "USD":
        return {"ok": False, "error": "Minimum Stripe donation is $0.50"}

    stripe.api_key = secret
    church_name = (settings.get("stripe_display_name") or "Christ Revolution Movement").strip()
    connected = (settings.get("stripe_account_id") or "").strip()

    line_item = {
        "price_data": {
            "currency": currency.lower(),
            "product_data": {
                "name": f"{church_name} — {category.replace('_', ' ').title()}",
                "description": f"Donation receipt {receipt_id}",
            },
            "unit_amount": minor,
        },
        "quantity": 1,
    }

    if is_recurring:
        line_item["price_data"]["recurring"] = {"interval": "month"}

    session_params: dict[str, Any] = {
        "mode": "subscription" if is_recurring else "payment",
        "line_items": [line_item],
        "success_url": success_url,
        "cancel_url": cancel_url,
        "client_reference_id": receipt_id,
        "metadata": {"receipt_id": receipt_id, "category": category},
    }
    if donor_email:
        session_params["customer_email"] = donor_email

    try:
        if connected:
            session = stripe.checkout.Session.create(**session_params, stripe_account=connected)
        else:
            session = stripe.checkout.Session.create(**session_params)
        return {
            "ok": True,
            "session_id": session.id,
            "checkout_url": session.url,
            "mode": "subscription" if is_recurring else "payment",
        }
    except Exception as e:
        print(f"Stripe checkout error: {e}")
        return {"ok": False, "error": str(e)}


def verify_stripe_session(session_id: str, *, settings: dict | None = None) -> dict:
    secret = stripe_secret_key()
    if not secret or not session_id:
        return {"ok": False, "error": "Missing Stripe configuration or session id"}
    try:
        import stripe
        stripe.api_key = secret
        connected = ""
        if settings:
            connected = (settings.get("stripe_account_id") or "").strip()
        if connected:
            session = stripe.checkout.Session.retrieve(session_id, stripe_account=connected)
        else:
            session = stripe.checkout.Session.retrieve(session_id)
        paid = session.payment_status == "paid" or session.status == "complete"
        receipt_id = (session.client_reference_id or session.metadata.get("receipt_id") or "").strip()
        txn = session.payment_intent or session.subscription or session.id
        return {
            "ok": paid,
            "receipt_id": receipt_id,
            "transaction_id": str(txn) if txn else session_id,
            "status": session.payment_status or session.status,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


def parse_stripe_webhook(payload: bytes, sig_header: str) -> dict:
    secret = stripe_webhook_secret()
    if not secret:
        return {"ok": False, "error": "Webhook secret not configured"}
    try:
        import stripe
        event = stripe.Webhook.construct_event(payload, sig_header, secret)
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            return {
                "ok": True,
                "receipt_id": session.get("client_reference_id") or (session.get("metadata") or {}).get("receipt_id"),
                "transaction_id": session.get("payment_intent") or session.get("subscription") or session.get("id"),
            }
        return {"ok": False, "ignored": True, "type": event["type"]}
    except Exception as e:
        return {"ok": False, "error": str(e)}
