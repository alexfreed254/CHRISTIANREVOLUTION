-- Member profile fields for the member portal
-- Safe to run multiple times on Supabase / PostgreSQL

ALTER TABLE members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ministry_interests TEXT DEFAULT '[]';
ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_status VARCHAR(50) DEFAULT 'active_member';

COMMENT ON COLUMN members.bio IS 'Short member bio / testimony snippet';
COMMENT ON COLUMN members.profile_photo_url IS 'URL to profile photo';
COMMENT ON COLUMN members.ministry_interests IS 'JSON array of ministry names the member serves in or is interested in';
COMMENT ON COLUMN members.membership_status IS 'visitor, new_convert, new_member, active_member, inactive_member, transferred';
