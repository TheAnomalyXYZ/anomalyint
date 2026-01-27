-- Create brand_profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_description TEXT,
  website TEXT,
  industry TEXT,
  target_audience TEXT,
  brand_voice TEXT,
  key_values TEXT[] DEFAULT '{}',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  social_links JSONB DEFAULT '{"twitter": "", "linkedin": "", "facebook": "", "instagram": ""}',
  meta_content TEXT[] DEFAULT '{}',
  google_drive_folder_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_profiles_name ON brand_profiles(name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_brand_profiles_created_at ON brand_profiles(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you can adjust this based on your needs)
CREATE POLICY "Enable read access for all users" ON brand_profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON brand_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON brand_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON brand_profiles
  FOR DELETE USING (true);
