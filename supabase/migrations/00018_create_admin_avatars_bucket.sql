-- Create storage bucket for admin avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-avatars',
  'admin-avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
);

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Public read admin-avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated upload admin-avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'admin-avatars');

-- Allow authenticated users to update their own avatar
CREATE POLICY "Authenticated update admin-avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'admin-avatars');

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Authenticated delete admin-avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'admin-avatars');