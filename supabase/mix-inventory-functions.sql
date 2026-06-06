-- Atomic inventory helpers for hookah mixes.
-- Run this file in Supabase SQL editor after schema.sql.

CREATE OR REPLACE FUNCTION decrement_tobacco_grams(
  tobacco_id UUID,
  grams_to_deduct INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_grams INTEGER;
BEGIN
  SELECT available_grams
  INTO current_grams
  FROM tobacco_items
  WHERE id = tobacco_id
  FOR UPDATE;

  IF current_grams IS NULL THEN
    RAISE EXCEPTION 'Tobacco item not found';
  END IF;

  IF current_grams < grams_to_deduct THEN
    RAISE EXCEPTION 'Not enough tobacco grams';
  END IF;

  UPDATE tobacco_items
  SET
    available_grams = available_grams - grams_to_deduct,
    updated_at = NOW()
  WHERE id = tobacco_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_mix_and_restore_inventory(
  mix_id_to_delete UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM mixes
    WHERE id = mix_id_to_delete
    FOR UPDATE
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE tobacco_items ti
  SET
    available_grams = ti.available_grams + restored.grams,
    updated_at = NOW()
  FROM (
    SELECT tobaccoid, SUM(grams)::INTEGER AS grams
    FROM mix_items
    WHERE mix_id = mix_id_to_delete
    GROUP BY tobaccoid
  ) restored
  WHERE ti.id = restored.tobaccoid;

  DELETE FROM mixes
  WHERE id = mix_id_to_delete;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
