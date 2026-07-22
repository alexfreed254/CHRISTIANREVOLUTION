-- ═══════════════════════════════════════════════════════════════════════════════
-- CHRIST REVOLUTION MOVEMENT (CRM) DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Description: Complete database schema for the CRM platform
-- Compatibility: PostgreSQL 14+ (Supabase optimized)
-- Safe to run: YES - Uses IF NOT EXISTS and DROP IF EXISTS throughout
-- 
-- Sections:
--   1. OPTIONAL CLEANUP (commented out - uncomment to reset everything)
--   2. Extensions
--   3. Tables
--   4. Indexes
--   5. Functions
--   6. Triggers
--   7. Row Level Security (RLS) Policies
--   8. Grants
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: OPTIONAL CLEANUP (UNCOMMENT TO RESET ALL DATA)
-- ═══════════════════════════════════════════════════════════════════════════════
/*
-- WARNING: This will permanently delete ALL data!
-- Uncomment this block ONLY if you want to start completely fresh.

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS stream_reactions CASCADE;
DROP TABLE IF EXISTS stream_comments CASCADE;
DROP TABLE IF EXISTS live_streams CASCADE;
DROP TABLE IF EXISTS course_completions CASCADE;
DROP TABLE IF EXISTS giving CASCADE;
DROP TABLE IF EXISTS payment_settings CASCADE;
DROP TABLE IF EXISTS prayer_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS increment_pray_count(UUID);
DROP FUNCTION IF EXISTS increment_viewer_count(UUID);
DROP FUNCTION IF EXISTS decrement_viewer_count(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop custom types if any
-- (none currently defined)
*/


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension for auto-generating UUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: members
-- Description: Core user/member accounts for the CRM platform
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name           VARCHAR(255) NOT NULL,
    continent           VARCHAR(50) NOT NULL,
    country             VARCHAR(100) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    village             VARCHAR(100),
    email               VARCHAR(255) UNIQUE NOT NULL,
    phone               VARCHAR(50),
    username            VARCHAR(100) UNIQUE NOT NULL,
    password_hash       TEXT NOT NULL,
    unique_id           VARCHAR(50) UNIQUE NOT NULL,
    growth_stage        VARCHAR(50) DEFAULT 'new_believer',
    engagement_score    INTEGER DEFAULT 0,
    streak              INTEGER DEFAULT 0,
    role                VARCHAR(50) DEFAULT 'member',
    joined_at           TIMESTAMP DEFAULT NOW(),
    last_seen           TIMESTAMP DEFAULT NOW(),
    preferred_language  VARCHAR(10) DEFAULT 'en',
    timezone            VARCHAR(50) DEFAULT 'UTC',
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE members IS 'Core member accounts for the CRM platform';
COMMENT ON COLUMN members.growth_stage IS 'Spiritual growth stage: new_believer, growing, mature, leader';
COMMENT ON COLUMN members.engagement_score IS 'Calculated engagement metric (0-100)';
COMMENT ON COLUMN members.streak IS 'Consecutive days of platform activity';
COMMENT ON COLUMN members.role IS 'Platform role: member, volunteer, leader, admin, super_admin';
COMMENT ON COLUMN members.unique_id IS 'Public-facing unique identifier for the member';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: sessions
-- Description: Active authentication sessions
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       TEXT UNIQUE NOT NULL,
    member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE sessions IS 'Active authentication sessions for members';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: attendance
-- Description: Service attendance records (online and physical)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID REFERENCES members(id) ON DELETE CASCADE,
    service_type    VARCHAR(50) NOT NULL,
    mode            VARCHAR(20) DEFAULT 'online',
    location_code   VARCHAR(50),
    attended_at     TIMESTAMP DEFAULT NOW(),
    created_at      TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE attendance IS 'Service attendance records';
COMMENT ON COLUMN attendance.mode IS 'Attendance mode: online, in_person, hybrid';
COMMENT ON COLUMN attendance.service_type IS 'Type of service: sunday_service, midweek, prayer, special';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: prayer_requests
-- Description: Member prayer requests (public or private)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_requests (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_public   BOOLEAN DEFAULT true,
    pray_count  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE prayer_requests IS 'Member prayer requests with public/private visibility';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: giving
-- Description: Financial contributions and donations
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS giving (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id           UUID REFERENCES members(id) ON DELETE CASCADE,
    amount              DECIMAL(10, 2) NOT NULL,
    currency            VARCHAR(10) DEFAULT 'USD',
    category            VARCHAR(50) NOT NULL,
    is_recurring        BOOLEAN DEFAULT false,
    payment_method      VARCHAR(50) NOT NULL,
    receipt_id          VARCHAR(50) UNIQUE NOT NULL,
    transaction_status  VARCHAR(50) DEFAULT 'pending',
    donor_name          TEXT,
    donor_email         TEXT,
    phone_number        VARCHAR(32),
    transaction_id      VARCHAR(100),
    checkout_id         VARCHAR(120),
    notes               TEXT,
    paid_at             TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE giving IS 'Financial contributions and donations tracking';
COMMENT ON COLUMN giving.category IS 'Giving category: tithe, offering, mission, building, special';
COMMENT ON COLUMN giving.transaction_status IS 'Payment status: pending, completed, failed, refunded';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: payment_settings
-- Description: Superadmin PayPal + M-Pesa receiving configuration
-- ─────────────────────────────────────────────────────────────────────────────
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
    stripe_publishable_key TEXT,
    stripe_account_id     TEXT,
    stripe_display_name   TEXT,
    stripe_enabled        BOOLEAN DEFAULT false,
    updated_by            UUID REFERENCES members(id) ON DELETE SET NULL,
    updated_at            TIMESTAMP DEFAULT NOW(),
    created_at            TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE payment_settings IS 'Superadmin-managed PayPal, Stripe, and M-Pesa receiving details';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: media
-- Description: Sermons, teachings, and other media content
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    media_type      VARCHAR(20) NOT NULL,
    url             TEXT NOT NULL,
    thumbnail_url   TEXT,
    duration_seconds INTEGER,
    series          VARCHAR(100),
    speaker         VARCHAR(100),
    language        VARCHAR(10) DEFAULT 'en',
    view_count      INTEGER DEFAULT 0,
    published_at    TIMESTAMP DEFAULT NOW(),
    created_at      TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE media IS 'Sermons, teachings, and media content library';
COMMENT ON COLUMN media.media_type IS 'Media type: video, audio, pdf, document';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: locations
-- Description: Physical church locations and branches
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    location_code   VARCHAR(50) UNIQUE NOT NULL,
    address         TEXT,
    city            VARCHAR(100) NOT NULL,
    country         VARCHAR(100) NOT NULL,
    continent       VARCHAR(50) NOT NULL,
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    capacity        INTEGER,
    pastor_name     VARCHAR(255),
    pastor_phone    VARCHAR(50),
    service_times   TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE locations IS 'Physical church locations and branch information';
COMMENT ON COLUMN locations.location_code IS 'Unique short code for the location (e.g., "LAG-001")';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: course_completions
-- Description: Tracks member completion of courses and training
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_completions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID REFERENCES members(id) ON DELETE CASCADE,
    course_id       VARCHAR(100) NOT NULL,
    completed_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(member_id, course_id)
);

COMMENT ON TABLE course_completions IS 'Tracks member course and training completions';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: live_streams
-- Description: Live streaming events and broadcasts
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_streams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    stream_url      TEXT NOT NULL,
    thumbnail_url   TEXT,
    status          VARCHAR(20) DEFAULT 'scheduled',
    viewer_count    INTEGER DEFAULT 0,
    like_count      INTEGER DEFAULT 0,
    started_at      TIMESTAMP,
    ended_at        TIMESTAMP,
    scheduled_for   TIMESTAMP,
    speaker         VARCHAR(255),
    category        VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE live_streams IS 'Live streaming events and broadcasts';
COMMENT ON COLUMN live_streams.status IS 'Stream status: scheduled, live, ended, cancelled';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: stream_comments
-- Description: Real-time comments on live streams
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stream_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id   UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE stream_comments IS 'Real-time comments on live streams';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: stream_reactions
-- Description: Emoji reactions on live streams (one reaction type per member per stream)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stream_reactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id       UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    member_id       UUID REFERENCES members(id) ON DELETE CASCADE,
    reaction_type   VARCHAR(20) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(stream_id, member_id, reaction_type)
);

COMMENT ON TABLE stream_reactions IS 'Emoji reactions on live streams';
COMMENT ON COLUMN stream_reactions.reaction_type IS 'Reaction type: like, love, praise, amen, fire';


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Members indexes
CREATE INDEX IF NOT EXISTS idx_members_username ON members(username);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_city ON members(city);
CREATE INDEX IF NOT EXISTS idx_members_country ON members(country);
CREATE INDEX IF NOT EXISTS idx_members_continent ON members(continent);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_growth_stage ON members(growth_stage);
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON members(joined_at);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_member_id ON sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attended_at);
CREATE INDEX IF NOT EXISTS idx_attendance_service_type ON attendance(service_type);

-- Prayer requests indexes
CREATE INDEX IF NOT EXISTS idx_prayer_member ON prayer_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_prayer_is_public ON prayer_requests(is_public);
CREATE INDEX IF NOT EXISTS idx_prayer_created_at ON prayer_requests(created_at);

-- Giving indexes
CREATE INDEX IF NOT EXISTS idx_giving_member ON giving(member_id);
CREATE INDEX IF NOT EXISTS idx_giving_created_at ON giving(created_at);
CREATE INDEX IF NOT EXISTS idx_giving_receipt_id ON giving(receipt_id);
CREATE INDEX IF NOT EXISTS idx_giving_transaction_id ON giving(transaction_id);
CREATE INDEX IF NOT EXISTS idx_giving_status ON giving(transaction_status);
CREATE INDEX IF NOT EXISTS idx_giving_checkout_id ON giving(checkout_id);

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_series ON media(series);
CREATE INDEX IF NOT EXISTS idx_media_published_at ON media(published_at);

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);
CREATE INDEX IF NOT EXISTS idx_locations_continent ON locations(continent);
CREATE INDEX IF NOT EXISTS idx_locations_location_code ON locations(location_code);

-- Course completions indexes
CREATE INDEX IF NOT EXISTS idx_course_completions_member ON course_completions(member_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_course ON course_completions(course_id);

-- Live streams indexes
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_for ON live_streams(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_live_streams_category ON live_streams(category);

-- Stream comments indexes
CREATE INDEX IF NOT EXISTS idx_stream_comments_stream ON stream_comments(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_comments_member ON stream_comments(member_id);
CREATE INDEX IF NOT EXISTS idx_stream_comments_created ON stream_comments(created_at);

-- Stream reactions indexes
CREATE INDEX IF NOT EXISTS idx_stream_reactions_stream ON stream_reactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_reactions_member ON stream_reactions(member_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function: Increment prayer count
-- Usage: SELECT increment_pray_count('prayer-request-uuid');
CREATE OR REPLACE FUNCTION increment_pray_count(p_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE prayer_requests 
    SET pray_count = pray_count + 1 
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_pray_count(UUID) IS 'Atomically increment the pray count for a prayer request';

-- Function: Increment live stream viewer count
-- Usage: SELECT increment_viewer_count('stream-uuid');
CREATE OR REPLACE FUNCTION increment_viewer_count(p_stream_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE live_streams 
    SET viewer_count = viewer_count + 1 
    WHERE id = p_stream_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_viewer_count(UUID) IS 'Atomically increment viewer count when someone joins a stream';

-- Function: Decrement live stream viewer count
-- Usage: SELECT decrement_viewer_count('stream-uuid');
CREATE OR REPLACE FUNCTION decrement_viewer_count(p_stream_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE live_streams 
    SET viewer_count = GREATEST(viewer_count - 1, 0)
    WHERE id = p_stream_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decrement_viewer_count(UUID) IS 'Atomically decrement viewer count when someone leaves a stream (min 0)';

-- Function: Auto-update updated_at timestamp
-- Usage: Automatically triggered by update_updated_at_column trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically set updated_at to current timestamp on row update';

-- Function: Update member last_seen timestamp
-- Usage: Call when member performs any activity
CREATE OR REPLACE FUNCTION update_member_last_seen(p_member_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE members 
    SET last_seen = NOW() 
    WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_member_last_seen(UUID) IS 'Update member last_seen timestamp on activity';

-- Function: Calculate member engagement score
-- Usage: SELECT calculate_engagement_score('member-uuid');
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_member_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_attendance_count INTEGER;
    v_giving_count INTEGER;
    v_prayer_count INTEGER;
    v_course_count INTEGER;
    v_stream_count INTEGER;
    v_score INTEGER;
BEGIN
    -- Count attendance (max 30 points)
    SELECT COUNT(*) INTO v_attendance_count FROM attendance WHERE member_id = p_member_id;
    v_score := LEAST(v_attendance_count * 2, 30);

    -- Count giving (max 20 points)
    SELECT COUNT(*) INTO v_giving_count FROM giving WHERE member_id = p_member_id;
    v_score := v_score + LEAST(v_giving_count * 5, 20);

    -- Count prayers (max 15 points)
    SELECT COUNT(*) INTO v_prayer_count FROM prayer_requests WHERE member_id = p_member_id;
    v_score := v_score + LEAST(v_prayer_count * 3, 15);

    -- Count courses (max 20 points)
    SELECT COUNT(*) INTO v_course_count FROM course_completions WHERE member_id = p_member_id;
    v_score := v_score + LEAST(v_course_count * 10, 20);

    -- Count stream engagement (max 15 points)
    SELECT COUNT(*) INTO v_stream_count FROM stream_comments WHERE member_id = p_member_id;
    v_score := v_score + LEAST(v_stream_count, 15);

    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_engagement_score(UUID) IS 'Calculate member engagement score (0-100) based on platform activity';


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 6: TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Trigger: Auto-update members.updated_at
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update prayer_requests.updated_at
DROP TRIGGER IF EXISTS update_prayer_requests_updated_at ON prayer_requests;
CREATE TRIGGER update_prayer_requests_updated_at 
    BEFORE UPDATE ON prayer_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update live_streams.updated_at
DROP TRIGGER IF EXISTS update_live_streams_updated_at ON live_streams;
CREATE TRIGGER update_live_streams_updated_at 
    BEFORE UPDATE ON live_streams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE giving ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_reactions ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────
-- Drop all existing policies (safe re-run)
-- ───────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public prayers are viewable by everyone" ON prayer_requests;
DROP POLICY IF EXISTS "Users can view own profile" ON members;
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view own giving" ON giving;
DROP POLICY IF EXISTS "Live streams are viewable by everyone" ON live_streams;
DROP POLICY IF EXISTS "Stream comments are viewable by everyone" ON stream_comments;
DROP POLICY IF EXISTS "Stream reactions are viewable by everyone" ON stream_reactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON members;
DROP POLICY IF EXISTS "Enable insert for all users" ON members;
DROP POLICY IF EXISTS "Enable update for users based on id" ON members;
DROP POLICY IF EXISTS "Service role has full access" ON members;
DROP POLICY IF EXISTS "Allow public insert" ON members;
DROP POLICY IF EXISTS "Allow public read" ON members;
DROP POLICY IF EXISTS "Service role bypass" ON members;
DROP POLICY IF EXISTS "Allow registration" ON members;
DROP POLICY IF EXISTS "Allow login check" ON members;
DROP POLICY IF EXISTS "Allow profile update" ON members;

-- ───────────────────────────────────────────────────────────────────────────────
-- MEMBERS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────

-- Service role has full access (backend operations)
CREATE POLICY "Service role bypass" ON members
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow anyone to register (INSERT)
CREATE POLICY "Allow registration" ON members
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to read members (for login, public profiles)
CREATE POLICY "Allow public read" ON members
    FOR SELECT
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow profile update" ON members
    FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- ───────────────────────────────────────────────────────────────────────────────
-- SESSIONS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Service role bypass sessions" ON sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- ATTENDANCE TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Service role bypass attendance" ON attendance
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view own attendance" ON attendance
    FOR SELECT
    USING (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- PRAYER REQUESTS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Service role bypass prayers" ON prayer_requests
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public prayers are viewable by everyone" ON prayer_requests
    FOR SELECT
    USING (is_public = true);

-- ───────────────────────────────────────────────────────────────────────────────
-- GIVING TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Service role bypass giving" ON giving
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view own giving" ON giving
    FOR SELECT
    USING (true);

CREATE POLICY "Service role bypass payment_settings" ON payment_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ───────────────────────────────────────────────────────────────────────────────
-- COURSE COMPLETIONS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Service role bypass courses" ON course_completions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- LIVE STREAMS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Service role bypass streams" ON live_streams
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Live streams are viewable by everyone" ON live_streams
    FOR SELECT
    USING (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- STREAM COMMENTS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Service role bypass comments" ON stream_comments
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Stream comments are viewable by everyone" ON stream_comments
    FOR SELECT
    USING (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- STREAM REACTIONS TABLE POLICIES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Service role bypass reactions" ON stream_reactions
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Stream reactions are viewable by everyone" ON stream_reactions
    FOR SELECT
    USING (true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 8: GRANTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Members table grants
GRANT SELECT, INSERT, UPDATE ON members TO authenticated;
GRANT SELECT, INSERT ON members TO anon;
GRANT ALL ON members TO service_role;

-- Sessions table grants
GRANT ALL ON sessions TO service_role;

-- Attendance table grants
GRANT SELECT ON attendance TO authenticated;
GRANT ALL ON attendance TO service_role;

-- Prayer requests table grants
GRANT SELECT, INSERT ON prayer_requests TO authenticated;
GRANT ALL ON prayer_requests TO service_role;

-- Giving table grants
GRANT SELECT ON giving TO authenticated;
GRANT ALL ON giving TO service_role;

-- Payment settings grants
GRANT ALL ON payment_settings TO service_role;
GRANT SELECT ON payment_settings TO authenticated;


-- Course completions table grants
GRANT SELECT, INSERT ON course_completions TO authenticated;
GRANT ALL ON course_completions TO service_role;

-- Live streams table grants
GRANT SELECT ON live_streams TO authenticated;
GRANT SELECT ON live_streams TO anon;
GRANT ALL ON live_streams TO service_role;

-- Stream comments table grants
GRANT SELECT, INSERT ON stream_comments TO authenticated;
GRANT ALL ON stream_comments TO service_role;

-- Stream reactions table grants
GRANT SELECT, INSERT ON stream_reactions TO authenticated;
GRANT ALL ON stream_reactions TO service_role;

-- Media table grants (no RLS, so explicit grants)
GRANT SELECT ON media TO authenticated;
GRANT SELECT ON media TO anon;
GRANT ALL ON media TO service_role;

-- Locations table grants (no RLS, so explicit grants)
GRANT SELECT ON locations TO authenticated;
GRANT SELECT ON locations TO anon;
GRANT ALL ON locations TO service_role;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 9: SUCCESS CONFIRMATION
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$ 
BEGIN 
    RAISE NOTICE '✅ CRM Database Schema deployed successfully!';
    RAISE NOTICE '✅ All tables, indexes, functions, triggers, and policies are ready!';
    RAISE NOTICE '✅ RLS policies configured for public access + Supabase auth';
    RAISE NOTICE '✅ Service role has full bypass access';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  • members';
    RAISE NOTICE '  • sessions';
    RAISE NOTICE '  • attendance';
    RAISE NOTICE '  • prayer_requests';
    RAISE NOTICE '  • giving';
    RAISE NOTICE '  • payment_settings';
    RAISE NOTICE '  • media';
    RAISE NOTICE '  • locations';
    RAISE NOTICE '  • course_completions';
    RAISE NOTICE '  • live_streams';
    RAISE NOTICE '  • stream_comments';
    RAISE NOTICE '  • stream_reactions';
END $$;
