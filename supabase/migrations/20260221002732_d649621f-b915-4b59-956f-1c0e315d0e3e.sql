-- Allow anonymous users to read folders by parish_id (for visitors)
CREATE POLICY "Anyone can view folders by parish_id"
ON public.folders FOR SELECT
USING (true);

-- Drop old policy
DROP POLICY IF EXISTS "Users can view folders of their parish" ON public.folders;

-- Allow anonymous users to read music_files by parish_id (for visitors)
CREATE POLICY "Anyone can view music files by parish_id"
ON public.music_files FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view music files of their parish" ON public.music_files;

-- Allow anonymous users to read music_video_links
CREATE POLICY "Anyone can view music video links"
ON public.music_video_links FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view video links of their parish" ON public.music_video_links;

-- Allow anonymous users to read music_audio_links
CREATE POLICY "Anyone can view music audio links"
ON public.music_audio_links FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view audio links of their parish" ON public.music_audio_links;

-- Allow anonymous users to read recurring_schedules
CREATE POLICY "Anyone can view recurring schedules"
ON public.recurring_schedules FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view schedules of their parish" ON public.recurring_schedules;

-- Allow anonymous users to read recurring_salmist_schedules
CREATE POLICY "Anyone can view salmist schedules"
ON public.recurring_salmist_schedules FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view salmist schedules of their parish" ON public.recurring_salmist_schedules;

-- Allow anonymous users to read psalm_melodies
CREATE POLICY "Anyone can view psalm melodies"
ON public.psalm_melodies FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view psalm melodies of their parish" ON public.psalm_melodies;

-- Allow anonymous users to read schedule_overrides
CREATE POLICY "Anyone can view schedule overrides"
ON public.schedule_overrides FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view schedule overrides of their parish" ON public.schedule_overrides;

-- Allow anonymous users to read salmist_schedule_overrides
CREATE POLICY "Anyone can view salmist schedule overrides"
ON public.salmist_schedule_overrides FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view salmist schedule overrides of their parish" ON public.salmist_schedule_overrides;

-- Allow anonymous users to read psalm_melody_audio_links
CREATE POLICY "Anyone can view psalm melody audio links"
ON public.psalm_melody_audio_links FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view psalm melody audio links of their parish" ON public.psalm_melody_audio_links;

-- Allow anonymous users to read slide_folders
CREATE POLICY "Anyone can view slide folders"
ON public.slide_folders FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view slide folders of their parish" ON public.slide_folders;

-- Allow anonymous users to read slide_files
CREATE POLICY "Anyone can view slide files"
ON public.slide_files FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view slide files of their parish" ON public.slide_files;