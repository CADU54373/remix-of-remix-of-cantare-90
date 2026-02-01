-- Criar bucket para áudios de músicas
INSERT INTO storage.buckets (id, name, public)
VALUES ('music-audios', 'music-audios', true);

-- Políticas de acesso para o bucket de áudios
CREATE POLICY "Anyone can view music audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'music-audios');

CREATE POLICY "Authenticated users can upload music audios"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music-audios' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete music audios"
ON storage.objects FOR DELETE
USING (bucket_id = 'music-audios' AND auth.uid() IS NOT NULL);

-- Criar tabela para links de áudio
CREATE TABLE public.music_audio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  music_file_id UUID NOT NULL REFERENCES public.music_files(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- Habilitar RLS
ALTER TABLE public.music_audio_links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para music_audio_links
CREATE POLICY "Anyone can view music audio links"
ON public.music_audio_links FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert music audio links"
ON public.music_audio_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update music audio links"
ON public.music_audio_links FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete music audio links"
ON public.music_audio_links FOR DELETE USING (auth.uid() IS NOT NULL);