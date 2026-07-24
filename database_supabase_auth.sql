-- Link church members to Supabase Authentication (auth.users)
-- Run in Supabase → SQL Editor after database.sql

ALTER TABLE members ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_members_auth_user_id ON members(auth_user_id);

COMMENT ON COLUMN members.auth_user_id IS 'UUID from Supabase Authentication → auth.users.id';

-- Optional: promote an existing Auth user to super_admin by email
-- UPDATE members SET role = 'super_admin' WHERE email = 'admin@yourchurch.org';
