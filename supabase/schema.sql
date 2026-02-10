-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tobacco items table
CREATE TABLE IF NOT EXISTS tobacco_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  available_grams INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mixes table
CREATE TABLE IF NOT EXISTS mixes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_grams INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  issavedtemplate BOOLEAN DEFAULT FALSE
);

-- Mix items table
CREATE TABLE IF NOT EXISTS mix_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mix_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  tobaccoid UUID NOT NULL REFERENCES tobacco_items(id) ON DELETE CASCADE,
  grams INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL
);

-- Hookah sessions table
CREATE TABLE IF NOT EXISTS hookah_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mix_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_mixes_creator_id ON mixes(creator_id);
CREATE INDEX IF NOT EXISTS idx_mix_items_mix_id ON mix_items(mix_id);
CREATE INDEX IF NOT EXISTS idx_mix_items_tobaccoid ON mix_items(tobaccoid);
CREATE INDEX IF NOT EXISTS idx_hookah_sessions_creator_id ON hookah_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_hookah_sessions_created_at ON hookah_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_mixes_created_at ON mixes(created_at);
CREATE INDEX IF NOT EXISTS idx_tobacco_items_category_id ON tobacco_items(category_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tobacco_items
CREATE TRIGGER update_tobacco_items_updated_at
  BEFORE UPDATE ON tobacco_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tobacco_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mix_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hookah_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all data
CREATE POLICY "Allow read access to authenticated users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON tobacco_items
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON mixes
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON mix_items
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON hookah_sessions
  FOR SELECT USING (true);


-- Policy: Allow authenticated users to insert
CREATE POLICY "Allow insert to authenticated users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert to authenticated users" ON categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert to authenticated users" ON tobacco_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert to authenticated users" ON mixes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert to authenticated users" ON mix_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert to authenticated users" ON hookah_sessions
  FOR INSERT WITH CHECK (true);

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow update to authenticated users" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Allow update to authenticated users" ON categories
  FOR UPDATE USING (true);

CREATE POLICY "Allow update to authenticated users" ON tobacco_items
  FOR UPDATE USING (true);

CREATE POLICY "Allow update to authenticated users" ON mixes
  FOR UPDATE USING (true);

-- Policy: Allow authenticated users to delete
CREATE POLICY "Allow delete to authenticated users" ON categories
  FOR DELETE USING (true);

CREATE POLICY "Allow delete to authenticated users" ON tobacco_items
  FOR DELETE USING (true);

CREATE POLICY "Allow delete to authenticated users" ON mixes
  FOR DELETE USING (true);

