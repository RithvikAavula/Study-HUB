-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic-resources', 'academic-resources', true);

-- Create policies for academic resources bucket
CREATE POLICY "Users can view all files in academic-resources" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'academic-resources');

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'academic-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'academic-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'academic-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for resources table
ALTER TABLE public.resources REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.resources;

-- Enable realtime for likes table  
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.likes;

-- Enable realtime for ratings table
ALTER TABLE public.ratings REPLICA IDENTITY FULL; 
ALTER publication supabase_realtime ADD TABLE public.ratings;