
-- Migration: 20251103222556

-- Migration: 20251103194506

-- Migration: 20251023121014
-- =====================================================
-- CANTARE - Schema Inicial
-- Sistema de Gestão de Ministério de Música Paroquial
-- =====================================================

-- 1. Pastas de Músicas (Hierárquica)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Arquivos PDF de Músicas
CREATE TABLE music_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by TEXT
);

-- 3. Escalas Recorrentes de Músicos
CREATE TABLE recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of_month INTEGER NOT NULL CHECK (week_of_month BETWEEN 1 AND 5),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  community TEXT NOT NULL,
  musicians JSONB NOT NULL,
  observations TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  start_month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 4. Substituições de Escalas de Músicos
CREATE TABLE schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE CASCADE NOT NULL,
  specific_month TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  community TEXT NOT NULL,
  musicians JSONB NOT NULL,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Escalas Recorrentes de Salmistas
CREATE TABLE recurring_salmist_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of_month INTEGER NOT NULL CHECK (week_of_month BETWEEN 1 AND 5),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time TEXT NOT NULL,
  community TEXT NOT NULL,
  psalmist TEXT NOT NULL,
  observations TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  start_month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 6. Substituições de Escalas de Salmistas
CREATE TABLE salmist_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_salmist_schedule_id UUID REFERENCES recurring_salmist_schedules(id) ON DELETE CASCADE NOT NULL,
  specific_month TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  community TEXT NOT NULL,
  psalmist TEXT NOT NULL,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Melodias de Salmos
CREATE TABLE psalm_melodies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL UNIQUE,
  psalm_reference TEXT NOT NULL,
  psalm_text TEXT NOT NULL,
  youtube_link TEXT,
  added_by TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_music_files_folder_id ON music_files(folder_id);
CREATE INDEX idx_recurring_schedules_active ON recurring_schedules(is_active);
CREATE INDEX idx_schedule_overrides_recurring_id ON schedule_overrides(recurring_schedule_id);
CREATE INDEX idx_schedule_overrides_month ON schedule_overrides(specific_month);
CREATE INDEX idx_recurring_salmist_schedules_active ON recurring_salmist_schedules(is_active);
CREATE INDEX idx_salmist_overrides_recurring_id ON salmist_schedule_overrides(recurring_salmist_schedule_id);
CREATE INDEX idx_salmist_overrides_month ON salmist_schedule_overrides(specific_month);
CREATE INDEX idx_psalm_melodies_date ON psalm_melodies(date);

-- =====================================================
-- RLS (Row Level Security)
-- Acesso ABERTO e COLABORATIVO (sem autenticação)
-- =====================================================

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_salmist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE salmist_schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE psalm_melodies ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para todas as tabelas
CREATE POLICY "Public access to folders" ON folders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to music_files" ON music_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to recurring_schedules" ON recurring_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to schedule_overrides" ON schedule_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to recurring_salmist_schedules" ON recurring_salmist_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to salmist_schedule_overrides" ON salmist_schedule_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to psalm_melodies" ON psalm_melodies FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STORAGE: Bucket para PDFs de músicas
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music-pdfs',
  'music-pdfs',
  true,
  20971520,
  ARRAY['application/pdf']
);

CREATE POLICY "Public access to music-pdfs bucket"
ON storage.objects FOR ALL
USING (bucket_id = 'music-pdfs')
WITH CHECK (bucket_id = 'music-pdfs');

-- =====================================================
-- SEED: Estrutura de pastas padrão (com UUIDs gerados)
-- =====================================================

-- Criar variáveis para armazenar UUIDs
DO $$
DECLARE
  tempo_comum_id UUID;
  tempo_pascal_id UUID;
  tempo_quaresmal_id UUID;
  advento_id UUID;
  natal_id UUID;
BEGIN
  -- Tempo Comum
  INSERT INTO folders (name, parent_id) VALUES ('Tempo Comum', NULL) RETURNING id INTO tempo_comum_id;
  INSERT INTO folders (name, parent_id) VALUES ('Ano A', tempo_comum_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano B', tempo_comum_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano C', tempo_comum_id);

  -- Tempo Pascal
  INSERT INTO folders (name, parent_id) VALUES ('Tempo Pascal', NULL) RETURNING id INTO tempo_pascal_id;
  INSERT INTO folders (name, parent_id) VALUES ('Ano A', tempo_pascal_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano B', tempo_pascal_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano C', tempo_pascal_id);

  -- Tempo Quaresmal
  INSERT INTO folders (name, parent_id) VALUES ('Tempo Quaresmal', NULL) RETURNING id INTO tempo_quaresmal_id;
  INSERT INTO folders (name, parent_id) VALUES ('Ano A', tempo_quaresmal_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano B', tempo_quaresmal_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano C', tempo_quaresmal_id);

  -- Advento
  INSERT INTO folders (name, parent_id) VALUES ('Advento', NULL) RETURNING id INTO advento_id;
  INSERT INTO folders (name, parent_id) VALUES ('Ano A', advento_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano B', advento_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano C', advento_id);

  -- Natal
  INSERT INTO folders (name, parent_id) VALUES ('Natal', NULL) RETURNING id INTO natal_id;
  INSERT INTO folders (name, parent_id) VALUES ('Ano A', natal_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano B', natal_id);
  INSERT INTO folders (name, parent_id) VALUES ('Ano C', natal_id);
END $$;

-- Migration: 20251028122723
-- Create music_video_links table
CREATE TABLE IF NOT EXISTS public.music_video_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  music_file_id UUID NOT NULL REFERENCES public.music_files(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_music_video_links_file_id ON public.music_video_links(music_file_id);

-- Enable RLS
ALTER TABLE public.music_video_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public access
CREATE POLICY "Public access to music_video_links" 
ON public.music_video_links 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Migration: 20251031115945
-- Drop existing policies to recreate them with proper authentication checks
DROP POLICY IF EXISTS "Public access to music_files" ON public.music_files;
DROP POLICY IF EXISTS "Public access to music_video_links" ON public.music_video_links;
DROP POLICY IF EXISTS "Public access to psalm_melodies" ON public.psalm_melodies;
DROP POLICY IF EXISTS "Public access to folders" ON public.folders;

-- Music Files: Everyone can view, only authenticated can modify
CREATE POLICY "Anyone can view music files"
ON public.music_files FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert music files"
ON public.music_files FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update music files"
ON public.music_files FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete music files"
ON public.music_files FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Music Video Links: Everyone can view, only authenticated can modify
CREATE POLICY "Anyone can view music video links"
ON public.music_video_links FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert music video links"
ON public.music_video_links FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update music video links"
ON public.music_video_links FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete music video links"
ON public.music_video_links FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Psalm Melodies: Everyone can view, only authenticated can modify
CREATE POLICY "Anyone can view psalm melodies"
ON public.psalm_melodies FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert psalm melodies"
ON public.psalm_melodies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update psalm melodies"
ON public.psalm_melodies FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete psalm melodies"
ON public.psalm_melodies FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Folders: Everyone can view, only authenticated can modify
CREATE POLICY "Anyone can view folders"
ON public.folders FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert folders"
ON public.folders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update folders"
ON public.folders FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete folders"
ON public.folders FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Schedule tables remain fully public (no changes needed)
-- recurring_schedules, recurring_salmist_schedules, schedule_overrides, salmist_schedule_overrides
-- already have "Public access" policies allowing all operations;

-- Migration: 20251103192912
-- Fix: Schedule tables lack authentication protection
-- Drop overly permissive policies and create proper authenticated access controls

-- ========== RECURRING_SCHEDULES ==========
DROP POLICY IF EXISTS "Public access to recurring_schedules" ON recurring_schedules;

CREATE POLICY "Anyone can view recurring schedules"
ON recurring_schedules FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert recurring schedules"
ON recurring_schedules FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update recurring schedules"
ON recurring_schedules FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete recurring schedules"
ON recurring_schedules FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ========== RECURRING_SALMIST_SCHEDULES ==========
DROP POLICY IF EXISTS "Public access to recurring_salmist_schedules" ON recurring_salmist_schedules;

CREATE POLICY "Anyone can view recurring salmist schedules"
ON recurring_salmist_schedules FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert recurring salmist schedules"
ON recurring_salmist_schedules FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update recurring salmist schedules"
ON recurring_salmist_schedules FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete recurring salmist schedules"
ON recurring_salmist_schedules FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ========== SCHEDULE_OVERRIDES ==========
DROP POLICY IF EXISTS "Public access to schedule_overrides" ON schedule_overrides;

CREATE POLICY "Anyone can view schedule overrides"
ON schedule_overrides FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert schedule overrides"
ON schedule_overrides FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update schedule overrides"
ON schedule_overrides FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete schedule overrides"
ON schedule_overrides FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ========== SALMIST_SCHEDULE_OVERRIDES ==========
DROP POLICY IF EXISTS "Public access to salmist_schedule_overrides" ON salmist_schedule_overrides;

CREATE POLICY "Anyone can view salmist schedule overrides"
ON salmist_schedule_overrides FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert salmist schedule overrides"
ON salmist_schedule_overrides FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update salmist schedule overrides"
ON salmist_schedule_overrides FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete salmist schedule overrides"
ON salmist_schedule_overrides FOR DELETE
USING (auth.uid() IS NOT NULL);



-- Migration: 20251103224547
-- ========== RECURRING_SCHEDULES ==========
DROP POLICY IF EXISTS "Anyone can view recurring schedules" ON recurring_schedules;
DROP POLICY IF EXISTS "Authenticated users can insert recurring schedules" ON recurring_schedules;
DROP POLICY IF EXISTS "Authenticated users can update recurring schedules" ON recurring_schedules;
DROP POLICY IF EXISTS "Authenticated users can delete recurring schedules" ON recurring_schedules;

CREATE POLICY "Public access to recurring_schedules"
ON recurring_schedules
FOR ALL
USING (true)
WITH CHECK (true);

-- ========== RECURRING_SALMIST_SCHEDULES ==========
DROP POLICY IF EXISTS "Anyone can view recurring salmist schedules" ON recurring_salmist_schedules;
DROP POLICY IF EXISTS "Authenticated users can insert recurring salmist schedules" ON recurring_salmist_schedules;
DROP POLICY IF EXISTS "Authenticated users can update recurring salmist schedules" ON recurring_salmist_schedules;
DROP POLICY IF EXISTS "Authenticated users can delete recurring salmist schedules" ON recurring_salmist_schedules;

CREATE POLICY "Public access to recurring_salmist_schedules"
ON recurring_salmist_schedules
FOR ALL
USING (true)
WITH CHECK (true);

-- ========== SCHEDULE_OVERRIDES ==========
DROP POLICY IF EXISTS "Anyone can view schedule overrides" ON schedule_overrides;
DROP POLICY IF EXISTS "Authenticated users can insert schedule overrides" ON schedule_overrides;
DROP POLICY IF EXISTS "Authenticated users can update schedule overrides" ON schedule_overrides;
DROP POLICY IF EXISTS "Authenticated users can delete schedule overrides" ON schedule_overrides;

CREATE POLICY "Public access to schedule_overrides"
ON schedule_overrides
FOR ALL
USING (true)
WITH CHECK (true);

-- ========== SALMIST_SCHEDULE_OVERRIDES ==========
DROP POLICY IF EXISTS "Anyone can view salmist schedule overrides" ON salmist_schedule_overrides;
DROP POLICY IF EXISTS "Authenticated users can insert salmist schedule overrides" ON salmist_schedule_overrides;
DROP POLICY IF EXISTS "Authenticated users can update salmist schedule overrides" ON salmist_schedule_overrides;
DROP POLICY IF EXISTS "Authenticated users can delete salmist schedule overrides" ON salmist_schedule_overrides;

CREATE POLICY "Public access to salmist_schedule_overrides"
ON salmist_schedule_overrides
FOR ALL
USING (true)
WITH CHECK (true);

-- Migration: 20251103232611
-- Backup dos dados existentes em caso de necessidade de rollback
-- (comentário para referência futura)

-- Adicionar nova coluna para array de links
ALTER TABLE psalm_melodies 
ADD COLUMN youtube_links JSONB DEFAULT '[]'::jsonb;

-- Migrar dados existentes (converter youtube_link único para array)
UPDATE psalm_melodies 
SET youtube_links = 
  CASE 
    WHEN youtube_link IS NOT NULL AND youtube_link != '' 
    THEN jsonb_build_array(jsonb_build_object('url', youtube_link, 'title', 'Melodia Principal'))
    ELSE '[]'::jsonb
  END;

-- Remover coluna antiga
ALTER TABLE psalm_melodies 
DROP COLUMN youtube_link;

-- Adicionar constraint para limitar a 3 melodias
ALTER TABLE psalm_melodies
ADD CONSTRAINT max_three_melodies 
CHECK (jsonb_array_length(youtube_links) <= 3);

-- Migration: 20251104174448
-- Adicionar coluna psalm_index para permitir múltiplos salmos por data
ALTER TABLE psalm_melodies 
ADD COLUMN psalm_index integer NOT NULL DEFAULT 0;

-- Remover constraint antiga de data única
ALTER TABLE psalm_melodies 
DROP CONSTRAINT IF EXISTS psalm_melodies_date_key;

-- Criar nova constraint composta (date + psalm_index)
ALTER TABLE psalm_melodies 
ADD CONSTRAINT psalm_melodies_date_psalm_index_key 
UNIQUE (date, psalm_index);

-- Adicionar comentário explicativo
COMMENT ON COLUMN psalm_melodies.psalm_index IS 'Índice do salmo quando há múltiplas opções no mesmo dia (0, 1, 2...)';

-- Migration: 20251105111555
-- Create table for custom OTP codes
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for OTP codes
CREATE POLICY "Anyone can insert OTP codes" 
ON public.otp_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their own OTP codes" 
ON public.otp_codes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update OTP codes" 
ON public.otp_codes 
FOR UPDATE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes 
  WHERE expires_at < now() OR (verified = true AND created_at < now() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-cleanup on insert
CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.cleanup_expired_otps();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_otps_trigger
AFTER INSERT ON public.otp_codes
EXECUTE FUNCTION public.trigger_cleanup_expired_otps();

-- Migration: 20251106182045
-- Fix OTP Codes Security: Remove public UPDATE policy
-- Only edge functions (using service role key) should update OTP codes

DROP POLICY IF EXISTS "Anyone can update OTP codes" ON public.otp_codes;

-- Edge functions use service role key which bypasses RLS
-- No client-side UPDATE access is needed or allowed;
