-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to tobacco_items
ALTER TABLE tobacco_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Allow read access to authenticated users" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow insert to authenticated users" ON categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update to authenticated users" ON categories
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete to authenticated users" ON categories
  FOR DELETE USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tobacco_items_category_id ON tobacco_items(category_id);
