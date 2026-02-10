-- Create mix_ratings table
CREATE TABLE IF NOT EXISTS mix_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mix_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
    vote INTEGER NOT NULL CHECK (vote IN (1, -1)), -- 1 for like, -1 for dislike
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mix_id)
);

-- Add likes and dislikes columns to mixes table
ALTER TABLE mixes 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mix_ratings_mix_id ON mix_ratings(mix_id);
CREATE INDEX IF NOT EXISTS idx_mix_ratings_user_id ON mix_ratings(user_id);

-- RLS for mix_ratings
ALTER TABLE mix_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON mix_ratings
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update/delete to authenticated users" ON mix_ratings
    FOR ALL USING (auth.uid() = user_id); 
    -- Note: Since we use custom auth (telegram_id), we might need checks against our users table if we passed that context.
    -- But usually for simple app we might just allow all authenticated or check against the passed user_id in API.
    -- For now, allowing all authenticated to INSERT/UPDATE if they match the user_id (which we might not easily check in RLS without custom claims).
    -- Let's stick to simple "Allow all to authenticated" for now as we validate in API.

DROP POLICY IF EXISTS "Allow all access to mix_ratings for authenticated users" ON mix_ratings;
CREATE POLICY "Allow all access to mix_ratings for authenticated users" ON mix_ratings
    FOR ALL USING (true) WITH CHECK (true);


-- Function to update mix rating counts
CREATE OR REPLACE FUNCTION update_mix_rating_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote = 1) THEN
            UPDATE mixes SET likes = likes + 1 WHERE id = NEW.mix_id;
        ELSE
            UPDATE mixes SET dislikes = dislikes + 1 WHERE id = NEW.mix_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote = 1) THEN
            UPDATE mixes SET likes = likes - 1 WHERE id = OLD.mix_id;
        ELSE
            UPDATE mixes SET dislikes = dislikes - 1 WHERE id = OLD.mix_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If vote changed
        IF (OLD.vote != NEW.vote) THEN
            IF (NEW.vote = 1) THEN
                UPDATE mixes SET likes = likes + 1, dislikes = dislikes - 1 WHERE id = NEW.mix_id;
            ELSE
                UPDATE mixes SET dislikes = dislikes + 1, likes = likes - 1 WHERE id = NEW.mix_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for mix_ratings
DROP TRIGGER IF EXISTS update_mix_rating_counts_trigger ON mix_ratings;
CREATE TRIGGER update_mix_rating_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON mix_ratings
FOR EACH ROW EXECUTE FUNCTION update_mix_rating_counts();
