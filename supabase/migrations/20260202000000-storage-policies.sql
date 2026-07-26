-- Storage policies for academic-resources bucket
-- Allows authenticated users to upload/update/delete their own avatars
-- and read all files publicly

-- Public read access for all files in the bucket
CREATE POLICY "Public read access for academic-resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'academic-resources');

-- Authenticated users can upload files (resources + avatars)
CREATE POLICY "Authenticated users can upload to academic-resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'academic-resources');

-- Users can update their own files
CREATE POLICY "Users can update their own files in academic-resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'academic-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files in academic-resources"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'academic-resources' AND auth.uid()::text = (storage.foldername(name))[1]);
