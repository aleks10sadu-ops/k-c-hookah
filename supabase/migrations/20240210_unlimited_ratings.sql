-- Ensure likes and dislikes columns exist
ALTER TABLE mixes 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Function to rate a mix (increment/decrement)
-- vote: 1 for like, -1 for dislike
CREATE OR REPLACE FUNCTION rate_mix(mix_id UUID, vote INTEGER)
RETURNS VOID AS $$
BEGIN
    IF (vote = 1) THEN
        UPDATE mixes SET likes = likes + 1 WHERE id = mix_id;
    ELSIF (vote = -1) THEN
        UPDATE mixes SET dislikes = dislikes + 1 WHERE id = mix_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
