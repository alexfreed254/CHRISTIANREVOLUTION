-- Payment settings + giving columns for PayPal / M-Pesa
-- Run in Supabase SQL editor (after database.sql)

CREATE TABLE IF NOT EXISTS payment_settings (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paypal_email          TEXT,
    paypal_client_id      TEXT,
    mpesa_till_number     VARCHAR(32),
    mpesa_shortcode       VARCHAR(32),
    mpesa_passkey         TEXT,
    mpesa_consumer_key    TEXT,
    mpesa_consumer_secret TEXT,
    mpesa_callback_url    TEXT,
    updated_by            UUID REFERENCES members(id) ON DELETE SET NULL,
    updated_at            TIMESTAMP DEFAULT NOW(),
    created_at            TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE payment_settings IS 'Superadmin-managed PayPal and M-Pesa receiving details';

ALTER TABLE giving ADD COLUMN IF NOT EXISTS donor_name TEXT;
ALTER TABLE giving ADD COLUMN IF NOT EXISTS donor_email TEXT;
ALTER TABLE giving ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32);
ALTER TABLE giving ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE giving ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE giving ADD COLUMN IF NOT EXISTS checkout_id VARCHAR(120);
ALTER TABLE giving ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_giving_transaction_id ON giving(transaction_id);
CREATE INDEX IF NOT EXISTS idx_giving_status ON giving(transaction_status);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role bypass payment_settings" ON payment_settings;
CREATE POLICY "Service role bypass payment_settings" ON payment_settings
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON payment_settings TO service_role;
GRANT SELECT ON payment_settings TO authenticated;

-- Stripe columns (safe re-run)
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT;
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS stripe_display_name TEXT;
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT false;
