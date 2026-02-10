-- Create storage bucket for tobacco images
-- Note: If this fails, create the bucket manually in Supabase Dashboard:
-- Storage -> New bucket -> Name: "tobacco-images", Public: true
INSERT INTO storage.buckets (id, name, public)
VALUES ('tobacco-images', 'tobacco-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies will be created automatically or can be set via Dashboard
-- If you need to create policies manually, use the Supabase Dashboard:
-- Storage -> tobacco-images -> Policies -> New Policy

