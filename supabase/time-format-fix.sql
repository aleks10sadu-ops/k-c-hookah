-- ============================================
-- SQL Script to ensure proper time format in Supabase
-- ============================================
-- 
-- NOTE: PostgreSQL stores timestamps as TIMESTAMP WITH TIME ZONE internally.
-- The AM/PM format you see in Supabase Dashboard is just a display format
-- and doesn't affect how data is stored or retrieved by your application.
--
-- This script:
-- 1. Verifies that all timestamp columns use TIMESTAMP WITH TIME ZONE
-- 2. Sets the timezone to Europe/Moscow for the session
-- 3. Creates helper functions for consistent time formatting
-- ============================================

-- Set timezone for this session (affects how timestamps are displayed in SQL queries)
SET timezone = 'Europe/Moscow';

-- Verify that all timestamp columns are using TIMESTAMP WITH TIME ZONE
-- Run this query to check:
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name IN ('created_at', 'updated_at')
    AND data_type LIKE '%timestamp%'
ORDER BY table_name, column_name;

-- ============================================
-- Helper function to format time in 24-hour format (Moscow timezone)
-- ============================================
CREATE OR REPLACE FUNCTION format_moscow_time(timestamp_value TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
    RETURN TO_CHAR(timestamp_value AT TIME ZONE 'Europe/Moscow', 'HH24:MI');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Helper function to format date and time in Russian format (Moscow timezone)
-- ============================================
CREATE OR REPLACE FUNCTION format_moscow_datetime(timestamp_value TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
    RETURN TO_CHAR(timestamp_value AT TIME ZONE 'Europe/Moscow', 'DD.MM.YYYY HH24:MI');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Example: View to see mixes with formatted Moscow time
-- ============================================
CREATE OR REPLACE VIEW mixes_with_moscow_time AS
SELECT 
    id,
    name,
    creator_id,
    total_grams,
    created_at,
    format_moscow_time(created_at) AS moscow_time_24h,
    format_moscow_datetime(created_at) AS moscow_datetime,
    issavedtemplate
FROM mixes
ORDER BY created_at DESC;

-- ============================================
-- Example: View to see all timestamps with Moscow time formatting
-- ============================================
CREATE OR REPLACE VIEW all_timestamps_moscow AS
SELECT 
    'users' AS table_name,
    id::TEXT AS id,
    created_at,
    format_moscow_time(created_at) AS moscow_time_24h,
    format_moscow_datetime(created_at) AS moscow_datetime
FROM users
UNION ALL
SELECT 
    'tobacco_items' AS table_name,
    id::TEXT AS id,
    created_at,
    format_moscow_time(created_at) AS moscow_time_24h,
    format_moscow_datetime(created_at) AS moscow_datetime
FROM tobacco_items
UNION ALL
SELECT 
    'mixes' AS table_name,
    id::TEXT AS id,
    created_at,
    format_moscow_time(created_at) AS moscow_time_24h,
    format_moscow_datetime(created_at) AS moscow_datetime
FROM mixes
UNION ALL
SELECT 
    'hookah_sessions' AS table_name,
    id::TEXT AS id,
    created_at,
    format_moscow_time(created_at) AS moscow_time_24h,
    format_moscow_datetime(created_at) AS moscow_datetime
FROM hookah_sessions
ORDER BY created_at DESC;

-- ============================================
-- Grant permissions for views
-- ============================================
GRANT SELECT ON mixes_with_moscow_time TO authenticated;
GRANT SELECT ON all_timestamps_moscow TO authenticated;

-- ============================================
-- IMPORTANT: Realtime is NOT supported for views
-- ============================================
-- Supabase Realtime only works with actual tables, not views.
-- If you try to enable realtime for these views, you'll get an error.
-- The views are for read-only queries only.
-- For realtime updates, use the original tables (mixes, users, etc.)
-- ============================================

-- ============================================
-- Usage examples:
-- ============================================
-- 
-- 1. View all mixes with Moscow time:
--    SELECT * FROM mixes_with_moscow_time;
--
-- 2. View all timestamps with Moscow formatting:
--    SELECT * FROM all_timestamps_moscow;
--
-- 3. Format a specific timestamp:
--    SELECT format_moscow_time(created_at) FROM mixes WHERE id = 'your-id';
--
-- 4. Check current timezone setting:
--    SHOW timezone;
--
-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 
-- 1. The AM/PM format in Supabase Dashboard is just a display preference
--    and doesn't affect your application. Your app already formats time correctly.
--
-- 2. All timestamp columns already use TIMESTAMP WITH TIME ZONE, which is correct.
--
-- 3. To change the display format in Supabase Dashboard:
--    - Go to Settings > Preferences
--    - Look for date/time format settings
--    - Or use the SQL Editor with the views above
--
-- 4. Your application code already handles time formatting correctly using
--    formatMoscowTime() function, so no changes are needed in the app.
-- ============================================

