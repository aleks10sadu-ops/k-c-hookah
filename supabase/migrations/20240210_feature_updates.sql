-- Create tobacco_logs table
CREATE TABLE IF NOT EXISTS tobacco_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tobacco_id UUID NOT NULL REFERENCES tobacco_items(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for add/restock, negative for use
    action_type TEXT NOT NULL CHECK (action_type IN ('add', 'restock', 'use')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add rating and parent_template_id to mixes
ALTER TABLE mixes 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating IN (1, -1)), -- 1 for like, -1 for dislike, null for no rating
ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES mixes(id) ON DELETE SET NULL;

-- Index for logs
CREATE INDEX IF NOT EXISTS idx_tobacco_logs_tobacco_id ON tobacco_logs(tobacco_id);
CREATE INDEX IF NOT EXISTS idx_tobacco_logs_created_at ON tobacco_logs(created_at);

-- RLS for logs
ALTER TABLE tobacco_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON tobacco_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow insert to authenticated users" ON tobacco_logs
    FOR INSERT WITH CHECK (true);
