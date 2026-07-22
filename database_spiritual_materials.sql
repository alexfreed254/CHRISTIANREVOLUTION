-- Daily Spiritual Materials & Discipleship Library
-- Run in Supabase SQL editor after database.sql

CREATE TABLE IF NOT EXISTS spiritual_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  material_type VARCHAR(50) NOT NULL,
  description TEXT,
  content TEXT,
  file_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  language VARCHAR(10) DEFAULT 'en',
  parent_id UUID REFERENCES spiritual_materials(id) ON DELETE SET NULL,
  all_languages BOOLEAN DEFAULT FALSE,
  category VARCHAR(100),
  ministry VARCHAR(100),
  speaker VARCHAR(100),
  bible_reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  publish_at TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  featured BOOLEAN DEFAULT FALSE,
  visibility VARCHAR(20) DEFAULT 'public',
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spiritual_materials_status ON spiritual_materials(status);
CREATE INDEX IF NOT EXISTS idx_spiritual_materials_type ON spiritual_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_spiritual_materials_publish_at ON spiritual_materials(publish_at);
CREATE INDEX IF NOT EXISTS idx_spiritual_materials_language ON spiritual_materials(language);
CREATE INDEX IF NOT EXISTS idx_spiritual_materials_parent ON spiritual_materials(parent_id);

CREATE TABLE IF NOT EXISTS material_saves (
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES spiritual_materials(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (member_id, material_id)
);

CREATE TABLE IF NOT EXISTS material_completions (
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES spiritual_materials(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (member_id, material_id)
);

GRANT SELECT ON spiritual_materials TO anon, authenticated;
GRANT ALL ON spiritual_materials TO service_role;
GRANT ALL ON material_saves TO service_role;
GRANT ALL ON material_completions TO service_role;
