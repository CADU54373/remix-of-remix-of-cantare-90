-- Create slide_folders table
CREATE TABLE public.slide_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.slide_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Enable RLS for slide_folders
ALTER TABLE public.slide_folders ENABLE ROW LEVEL SECURITY;

-- Policies for slide_folders
CREATE POLICY "Anyone can view slide folders"
  ON public.slide_folders FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create slide folders"
  ON public.slide_folders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update slide folders"
  ON public.slide_folders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete slide folders"
  ON public.slide_folders FOR DELETE
  TO authenticated
  USING (true);

-- Create slide_files table
CREATE TABLE public.slide_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.slide_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID
);

-- Enable RLS for slide_files
ALTER TABLE public.slide_files ENABLE ROW LEVEL SECURITY;

-- Policies for slide_files
CREATE POLICY "Anyone can view slide files"
  ON public.slide_files FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create slide files"
  ON public.slide_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update slide files"
  ON public.slide_files FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete slide files"
  ON public.slide_files FOR DELETE
  TO authenticated
  USING (true);

-- Create slides storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('slides', 'slides', true);

-- Storage policies for slides bucket
CREATE POLICY "Anyone can view slides"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'slides');

CREATE POLICY "Authenticated users can upload slides"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'slides');

CREATE POLICY "Authenticated users can update slides"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'slides');

CREATE POLICY "Authenticated users can delete slides"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'slides');