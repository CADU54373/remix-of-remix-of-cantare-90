
-- Drop and recreate foreign keys with CASCADE for all tables referencing parishes
ALTER TABLE public.folders DROP CONSTRAINT IF EXISTS folders_parish_id_fkey;
ALTER TABLE public.folders ADD CONSTRAINT folders_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.music_files DROP CONSTRAINT IF EXISTS music_files_parish_id_fkey;
ALTER TABLE public.music_files ADD CONSTRAINT music_files_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.music_audio_links DROP CONSTRAINT IF EXISTS music_audio_links_parish_id_fkey;
ALTER TABLE public.music_audio_links ADD CONSTRAINT music_audio_links_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.music_video_links DROP CONSTRAINT IF EXISTS music_video_links_parish_id_fkey;
ALTER TABLE public.music_video_links ADD CONSTRAINT music_video_links_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.recurring_schedules DROP CONSTRAINT IF EXISTS recurring_schedules_parish_id_fkey;
ALTER TABLE public.recurring_schedules ADD CONSTRAINT recurring_schedules_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.recurring_salmist_schedules DROP CONSTRAINT IF EXISTS recurring_salmist_schedules_parish_id_fkey;
ALTER TABLE public.recurring_salmist_schedules ADD CONSTRAINT recurring_salmist_schedules_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.schedule_overrides DROP CONSTRAINT IF EXISTS schedule_overrides_parish_id_fkey;
ALTER TABLE public.schedule_overrides ADD CONSTRAINT schedule_overrides_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.salmist_schedule_overrides DROP CONSTRAINT IF EXISTS salmist_schedule_overrides_parish_id_fkey;
ALTER TABLE public.salmist_schedule_overrides ADD CONSTRAINT salmist_schedule_overrides_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.psalm_melodies DROP CONSTRAINT IF EXISTS psalm_melodies_parish_id_fkey;
ALTER TABLE public.psalm_melodies ADD CONSTRAINT psalm_melodies_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.psalm_melody_audio_links DROP CONSTRAINT IF EXISTS psalm_melody_audio_links_parish_id_fkey;
ALTER TABLE public.psalm_melody_audio_links ADD CONSTRAINT psalm_melody_audio_links_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.slide_folders DROP CONSTRAINT IF EXISTS slide_folders_parish_id_fkey;
ALTER TABLE public.slide_folders ADD CONSTRAINT slide_folders_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.slide_files DROP CONSTRAINT IF EXISTS slide_files_parish_id_fkey;
ALTER TABLE public.slide_files ADD CONSTRAINT slide_files_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_parish_id_fkey;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE SET NULL;
