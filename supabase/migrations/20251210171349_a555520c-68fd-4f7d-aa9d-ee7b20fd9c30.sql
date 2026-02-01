-- Create storage bucket for psalm audios
INSERT INTO storage.buckets (id, name, public) VALUES ('psalm-audios', 'psalm-audios', true);

-- Create table for psalm melody audio links
CREATE TABLE public.psalm_melody_audio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psalm_melody_id UUID NOT NULL REFERENCES public.psalm_melodies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- Enable RLS
ALTER TABLE public.psalm_melody_audio_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view psalm melody audio links"
ON public.psalm_melody_audio_links FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert psalm melody audio links"
ON public.psalm_melody_audio_links FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update psalm melody audio links"
ON public.psalm_melody_audio_links FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete psalm melody audio links"
ON public.psalm_melody_audio_links FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Storage policies for psalm-audios bucket
CREATE POLICY "Anyone can view psalm audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'psalm-audios');

CREATE POLICY "Authenticated users can upload psalm audios"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'psalm-audios' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete psalm audios"
ON storage.objects FOR DELETE
USING (bucket_id = 'psalm-audios' AND auth.uid() IS NOT NULL);