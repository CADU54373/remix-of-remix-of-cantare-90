import { supabase } from '@/integrations/supabase/client';
import { 
  Folder, 
  MusicFile, 
  MusicVideoLink,
  MusicAudioLink,
  RecurringSchedule, 
  RecurringSalmistSchedule,
  ScheduleOverride,
  SalmistScheduleOverride,
  PsalmMelody,
  PsalmMelodyLink,
  PsalmMelodyAudioLink,
  Musician,
  SlideFolder,
  SlideFile
} from '@/types';
import { getNthWeekdayOfMonth } from './utils';

// Função para sanitizar nome de arquivo removendo caracteres especiais
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por underscore
    .replace(/_+/g, '_') // Remove underscores duplicados
    .replace(/^_|_$/g, ''); // Remove underscores no início/fim
};

// ========== FOLDERS ==========

export const getFolders = async (filterParishId?: string): Promise<Folder[]> => {
  let query = supabase
    .from('folders')
    .select('*')
    .order('name');
  
  if (filterParishId) {
    query = query.eq('parish_id', filterParishId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map(f => ({
    id: f.id,
    name: f.name,
    parentId: f.parent_id,
    createdAt: f.created_at,
  }));
};

export const addFolder = async (folder: Omit<Folder, 'id' | 'createdAt'>, parishId?: string): Promise<Folder> => {
  const { data, error } = await supabase
    .from('folders')
    .insert({
      name: folder.name,
      parent_id: folder.parentId,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    parentId: data.parent_id,
    createdAt: data.created_at,
  };
};

export const updateFolder = async (folderId: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .update({ name })
    .eq('id', folderId);
  
  if (error) throw error;
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);
  
  if (error) throw error;
};

// ========== MUSIC FILES ==========

export const getMusicFiles = async (filterParishId?: string): Promise<MusicFile[]> => {
  let query = supabase
    .from('music_files')
    .select('*')
    .order('uploaded_at', { ascending: false });
  
  if (filterParishId) {
    query = query.eq('parish_id', filterParishId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Buscar links de vídeo e áudio para cada arquivo
  const filesWithLinks = await Promise.all(
    data.map(async (f) => {
      const [videoLinks, audioLinks] = await Promise.all([
        getMusicVideoLinks(f.id),
        getMusicAudioLinks(f.id)
      ]);
      return {
        id: f.id,
        name: f.name,
        folderId: f.folder_id,
        fileData: f.file_url,
        uploadedAt: f.uploaded_at,
        uploadedBy: f.uploaded_by,
        videoLinks,
        audioLinks,
      };
    })
  );
  
  return filesWithLinks;
};

export const addMusicFile = async (
  file: Omit<MusicFile, 'id' | 'uploadedAt'>,
  pdfFile: File,
  parishId?: string
): Promise<MusicFile> => {
  const fileId = crypto.randomUUID();
  const fileName = `${fileId}_${sanitizeFileName(pdfFile.name)}`;
  
  // Upload para Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('music-pdfs')
    .upload(fileName, pdfFile, {
      contentType: 'application/pdf',
      upsert: false,
    });
  
  if (uploadError) throw uploadError;
  
  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('music-pdfs')
    .getPublicUrl(fileName);
  
  // Salvar registro no banco
  const { data, error } = await supabase
    .from('music_files')
    .insert({
      id: fileId,
      name: file.name,
      folder_id: file.folderId,
      file_url: publicUrl,
      uploaded_by: file.uploadedBy,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    folderId: data.folder_id,
    fileData: data.file_url,
    uploadedAt: data.uploaded_at,
    uploadedBy: data.uploaded_by,
  };
};

export const deleteMusicFile = async (fileId: string): Promise<void> => {
  // Buscar URL do arquivo
  const { data: file } = await supabase
    .from('music_files')
    .select('file_url')
    .eq('id', fileId)
    .single();
  
  if (file) {
    // Extrair nome do arquivo da URL
    const fileName = file.file_url.split('/').pop();
    if (fileName) {
      // Deletar do Storage
      await supabase.storage
        .from('music-pdfs')
        .remove([fileName]);
    }
  }
  
  // Deletar registro do banco (links serão deletados automaticamente via CASCADE)
  const { error } = await supabase
    .from('music_files')
    .delete()
    .eq('id', fileId);
  
  if (error) throw error;
};

// ========== MUSIC VIDEO LINKS ==========

export const getMusicVideoLinks = async (musicFileId: string): Promise<MusicVideoLink[]> => {
  const { data, error } = await supabase
    .from('music_video_links')
    .select('*')
    .eq('music_file_id', musicFileId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(link => ({
    id: link.id,
    musicFileId: link.music_file_id,
    title: link.title,
    videoUrl: link.video_url,
    createdAt: link.created_at,
    createdBy: link.created_by,
  }));
};

export const addMusicVideoLink = async (
  link: Omit<MusicVideoLink, 'id' | 'createdAt'>,
  parishId?: string
): Promise<MusicVideoLink> => {
  const { data, error } = await supabase
    .from('music_video_links')
    .insert({
      music_file_id: link.musicFileId,
      title: link.title,
      video_url: link.videoUrl,
      created_by: link.createdBy,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    musicFileId: data.music_file_id,
    title: data.title,
    videoUrl: data.video_url,
    createdAt: data.created_at,
    createdBy: data.created_by,
  };
};

export const deleteMusicVideoLink = async (linkId: string): Promise<void> => {
  const { error } = await supabase
    .from('music_video_links')
    .delete()
    .eq('id', linkId);
  
  if (error) throw error;
};

// ========== MUSIC AUDIO LINKS ==========

export const getMusicAudioLinks = async (musicFileId: string): Promise<MusicAudioLink[]> => {
  const { data, error } = await supabase
    .from('music_audio_links')
    .select('*')
    .eq('music_file_id', musicFileId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(link => ({
    id: link.id,
    musicFileId: link.music_file_id,
    title: link.title,
    audioUrl: link.audio_url,
    durationSeconds: link.duration_seconds,
    createdAt: link.created_at,
    createdBy: link.created_by,
  }));
};

export const addMusicAudioLink = async (
  link: Omit<MusicAudioLink, 'id' | 'createdAt'>,
  audioFile: File,
  parishId?: string
): Promise<MusicAudioLink> => {
  const fileId = crypto.randomUUID();
  const fileName = `${fileId}_${sanitizeFileName(audioFile.name)}`;
  
  // Upload para Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('music-audios')
    .upload(fileName, audioFile, {
      contentType: audioFile.type,
      upsert: false,
    });
  
  if (uploadError) throw uploadError;
  
  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('music-audios')
    .getPublicUrl(fileName);
  
  // Salvar registro no banco
  const { data, error } = await supabase
    .from('music_audio_links')
    .insert({
      music_file_id: link.musicFileId,
      title: link.title,
      audio_url: publicUrl,
      duration_seconds: link.durationSeconds,
      created_by: link.createdBy,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    musicFileId: data.music_file_id,
    title: data.title,
    audioUrl: data.audio_url,
    durationSeconds: data.duration_seconds,
    createdAt: data.created_at,
    createdBy: data.created_by,
  };
};

export const deleteMusicAudioLink = async (linkId: string): Promise<void> => {
  // Buscar URL do áudio
  const { data: link } = await supabase
    .from('music_audio_links')
    .select('audio_url')
    .eq('id', linkId)
    .single();
  
  if (link) {
    // Extrair nome do arquivo da URL
    const fileName = link.audio_url.split('/').pop();
    if (fileName) {
      // Deletar do Storage
      await supabase.storage
        .from('music-audios')
        .remove([fileName]);
    }
  }
  
  // Deletar registro do banco
  const { error } = await supabase
    .from('music_audio_links')
    .delete()
    .eq('id', linkId);
  
  if (error) throw error;
};

// ========== RECURRING SCHEDULES ==========

export const getRecurringSchedules = async (filterParishId?: string): Promise<RecurringSchedule[]> => {
  let query = supabase
    .from('recurring_schedules')
    .select('*')
    .order('week_of_month, day_of_week');
  
  if (filterParishId) {
    query = query.eq('parish_id', filterParishId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map(s => ({
    id: s.id,
    weekOfMonth: s.week_of_month as 1 | 2 | 3 | 4 | 5,
    dayOfWeek: s.day_of_week as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    time: s.time,
    type: s.type as 'dominical' | 'semanal' | 'especial' | 'outro',
    community: s.community,
    musicians: s.musicians as unknown as Musician[],
    observations: s.observations || undefined,
    isActive: s.is_active,
    startMonth: s.start_month,
    createdAt: s.created_at,
    createdBy: s.created_by || undefined,
  }));
};

export const addRecurringSchedule = async (schedule: Omit<RecurringSchedule, 'id' | 'createdAt'>, parishId?: string): Promise<RecurringSchedule> => {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .insert({
      week_of_month: schedule.weekOfMonth,
      day_of_week: schedule.dayOfWeek,
      time: schedule.time,
      type: schedule.type,
      community: schedule.community,
      musicians: schedule.musicians as unknown as any,
      observations: schedule.observations,
      is_active: schedule.isActive,
      start_month: schedule.startMonth,
      created_by: schedule.createdBy,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    weekOfMonth: data.week_of_month as 1 | 2 | 3 | 4 | 5,
    dayOfWeek: data.day_of_week as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    time: data.time,
    type: data.type as 'dominical' | 'semanal' | 'especial' | 'outro',
    community: data.community,
    musicians: data.musicians as unknown as Musician[],
    observations: data.observations || undefined,
    isActive: data.is_active,
    startMonth: data.start_month,
    createdAt: data.created_at,
    createdBy: data.created_by || undefined,
  };
};

export const updateRecurringSchedule = async (schedule: RecurringSchedule): Promise<void> => {
  const { error } = await supabase
    .from('recurring_schedules')
    .update({
      week_of_month: schedule.weekOfMonth,
      day_of_week: schedule.dayOfWeek,
      time: schedule.time,
      type: schedule.type,
      community: schedule.community,
      musicians: schedule.musicians as unknown as any,
      observations: schedule.observations,
      is_active: schedule.isActive,
      start_month: schedule.startMonth,
    })
    .eq('id', schedule.id);
  
  if (error) throw error;
};

export const deleteRecurringSchedule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('recurring_schedules')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ========== SCHEDULE OVERRIDES ==========

export const getScheduleOverrides = async (month?: string): Promise<ScheduleOverride[]> => {
  let query = supabase
    .from('schedule_overrides')
    .select('*')
    .order('date');
  
  if (month) {
    query = query.eq('specific_month', month);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map(o => ({
    id: o.id,
    recurringScheduleId: o.recurring_schedule_id,
    specificMonth: o.specific_month,
    date: o.date,
    time: o.time,
    type: o.type as 'dominical' | 'semanal' | 'especial' | 'outro',
    community: o.community,
    musicians: o.musicians as unknown as Musician[],
    observations: o.observations || undefined,
    createdAt: o.created_at,
    createdBy: undefined,
  }));
};

export const addScheduleOverride = async (override: Omit<ScheduleOverride, 'id' | 'createdAt'>, parishId?: string): Promise<ScheduleOverride> => {
  const { data, error } = await supabase
    .from('schedule_overrides')
    .insert({
      recurring_schedule_id: override.recurringScheduleId,
      specific_month: override.specificMonth,
      date: override.date,
      time: override.time,
      type: override.type,
      community: override.community,
      musicians: override.musicians as any,
      observations: override.observations,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    recurringScheduleId: data.recurring_schedule_id,
    specificMonth: data.specific_month,
    date: data.date,
    time: data.time,
    type: data.type as 'dominical' | 'semanal' | 'especial' | 'outro',
    community: data.community,
    musicians: data.musicians as unknown as Musician[],
    observations: data.observations || undefined,
    createdAt: data.created_at,
    createdBy: undefined,
  };
};

export const updateScheduleOverride = async (override: ScheduleOverride): Promise<void> => {
  const { error } = await supabase
    .from('schedule_overrides')
    .update({
      date: override.date,
      time: override.time,
      type: override.type,
      community: override.community,
      musicians: override.musicians as unknown as any,
      observations: override.observations,
    })
    .eq('id', override.id);
  
  if (error) throw error;
};

export const deleteScheduleOverride = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('schedule_overrides')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ========== RECURRING SALMIST SCHEDULES ==========

export const getRecurringSalmistSchedules = async (filterParishId?: string): Promise<RecurringSalmistSchedule[]> => {
  let query = supabase
    .from('recurring_salmist_schedules')
    .select('*')
    .order('week_of_month, day_of_week');
  
  if (filterParishId) {
    query = query.eq('parish_id', filterParishId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map(s => ({
    id: s.id,
    weekOfMonth: s.week_of_month as 1 | 2 | 3 | 4 | 5,
    dayOfWeek: s.day_of_week as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    time: s.time,
    community: s.community,
    psalmist: s.psalmist,
    observations: s.observations || undefined,
    isActive: s.is_active,
    startMonth: s.start_month,
    createdAt: s.created_at,
    createdBy: s.created_by || undefined,
  }));
};

export const addRecurringSalmistSchedule = async (schedule: Omit<RecurringSalmistSchedule, 'id' | 'createdAt'>, parishId?: string): Promise<RecurringSalmistSchedule> => {
  const { data, error } = await supabase
    .from('recurring_salmist_schedules')
    .insert({
      week_of_month: schedule.weekOfMonth,
      day_of_week: schedule.dayOfWeek,
      time: schedule.time,
      community: schedule.community,
      psalmist: schedule.psalmist,
      observations: schedule.observations,
      is_active: schedule.isActive,
      start_month: schedule.startMonth,
      created_by: schedule.createdBy,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    weekOfMonth: data.week_of_month as 1 | 2 | 3 | 4 | 5,
    dayOfWeek: data.day_of_week as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    time: data.time,
    community: data.community,
    psalmist: data.psalmist,
    observations: data.observations || undefined,
    isActive: data.is_active,
    startMonth: data.start_month,
    createdAt: data.created_at,
    createdBy: data.created_by || undefined,
  };
};

export const updateRecurringSalmistSchedule = async (schedule: RecurringSalmistSchedule): Promise<void> => {
  const { error } = await supabase
    .from('recurring_salmist_schedules')
    .update({
      week_of_month: schedule.weekOfMonth,
      day_of_week: schedule.dayOfWeek,
      time: schedule.time,
      community: schedule.community,
      psalmist: schedule.psalmist,
      observations: schedule.observations,
      is_active: schedule.isActive,
      start_month: schedule.startMonth,
    })
    .eq('id', schedule.id);
  
  if (error) throw error;
};

export const deleteRecurringSalmistSchedule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('recurring_salmist_schedules')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ========== SALMIST SCHEDULE OVERRIDES ==========

export const getSalmistScheduleOverrides = async (month?: string): Promise<SalmistScheduleOverride[]> => {
  let query = supabase
    .from('salmist_schedule_overrides')
    .select('*')
    .order('date');
  
  if (month) {
    query = query.eq('specific_month', month);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map(o => ({
    id: o.id,
    recurringSalmistScheduleId: o.recurring_salmist_schedule_id,
    specificMonth: o.specific_month,
    date: o.date,
    time: o.time,
    community: o.community,
    psalmist: o.psalmist,
    observations: o.observations || undefined,
    createdAt: o.created_at,
    createdBy: undefined,
  }));
};

export const addSalmistScheduleOverride = async (override: Omit<SalmistScheduleOverride, 'id' | 'createdAt'>, parishId?: string): Promise<SalmistScheduleOverride> => {
  const { data, error } = await supabase
    .from('salmist_schedule_overrides')
    .insert({
      recurring_salmist_schedule_id: override.recurringSalmistScheduleId,
      specific_month: override.specificMonth,
      date: override.date,
      time: override.time,
      community: override.community,
      psalmist: override.psalmist,
      observations: override.observations,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    recurringSalmistScheduleId: data.recurring_salmist_schedule_id,
    specificMonth: data.specific_month,
    date: data.date,
    time: data.time,
    community: data.community,
    psalmist: data.psalmist,
    observations: data.observations || undefined,
    createdAt: data.created_at,
    createdBy: undefined,
  };
};

export const updateSalmistScheduleOverride = async (override: SalmistScheduleOverride): Promise<void> => {
  const { error } = await supabase
    .from('salmist_schedule_overrides')
    .update({
      date: override.date,
      time: override.time,
      community: override.community,
      psalmist: override.psalmist,
      observations: override.observations,
    })
    .eq('id', override.id);
  
  if (error) throw error;
};

export const deleteSalmistScheduleOverride = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('salmist_schedule_overrides')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ========== PSALM MELODIES ==========

export const getPsalmMelodies = async (filterParishId?: string): Promise<PsalmMelody[]> => {
  let query = supabase
    .from('psalm_melodies')
    .select('*')
    .order('date', { ascending: false });
  
  if (filterParishId) {
    query = query.eq('parish_id', filterParishId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Buscar áudios para cada melodia
  const melodiesWithAudio = await Promise.all(
    data.map(async (m) => {
      const audioLinks = await getPsalmMelodyAudioLinks(m.id);
      return {
        id: m.id,
        date: m.date,
        psalmIndex: m.psalm_index || 0,
        psalmText: m.psalm_text,
        psalmReference: m.psalm_reference,
        youtubeLinks: (m.youtube_links as unknown as PsalmMelodyLink[]) || [],
        audioLinks,
        addedBy: m.added_by || undefined,
        addedAt: m.added_at,
      };
    })
  );
  
  return melodiesWithAudio;
};

export const addPsalmMelody = async (melody: PsalmMelody, parishId?: string): Promise<string> => {
  const { data, error } = await supabase
    .from('psalm_melodies')
    .upsert([{
      date: melody.date,
      psalm_index: melody.psalmIndex,
      psalm_reference: melody.psalmReference,
      psalm_text: melody.psalmText,
      youtube_links: melody.youtubeLinks as any,
      added_by: melody.addedBy,
      added_at: melody.addedAt || new Date().toISOString(),
      parish_id: parishId,
    }], {
      onConflict: 'date,psalm_index',
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
};

// ========== PSALM MELODY AUDIO LINKS ==========

export const getPsalmMelodyAudioLinks = async (psalmMelodyId: string): Promise<PsalmMelodyAudioLink[]> => {
  const { data, error } = await supabase
    .from('psalm_melody_audio_links')
    .select('*')
    .eq('psalm_melody_id', psalmMelodyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(link => ({
    id: link.id,
    psalmMelodyId: link.psalm_melody_id,
    title: link.title,
    audioUrl: link.audio_url,
    durationSeconds: link.duration_seconds,
    createdAt: link.created_at,
    createdBy: link.created_by,
  }));
};

export const addPsalmMelodyAudioLink = async (
  link: Omit<PsalmMelodyAudioLink, 'id' | 'createdAt'>,
  audioFile: File,
  parishId?: string
): Promise<PsalmMelodyAudioLink> => {
  const fileId = crypto.randomUUID();
  const fileName = `${fileId}_${sanitizeFileName(audioFile.name)}`;
  
  // Upload para Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('psalm-audios')
    .upload(fileName, audioFile, {
      contentType: audioFile.type,
      upsert: false,
    });
  
  if (uploadError) throw uploadError;
  
  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('psalm-audios')
    .getPublicUrl(fileName);
  
  // Salvar registro no banco
  const { data, error } = await supabase
    .from('psalm_melody_audio_links')
    .insert({
      psalm_melody_id: link.psalmMelodyId,
      title: link.title,
      audio_url: publicUrl,
      duration_seconds: link.durationSeconds,
      created_by: link.createdBy,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    psalmMelodyId: data.psalm_melody_id,
    title: data.title,
    audioUrl: data.audio_url,
    durationSeconds: data.duration_seconds,
    createdAt: data.created_at,
    createdBy: data.created_by,
  };
};

export const deletePsalmMelodyAudioLink = async (linkId: string): Promise<void> => {
  // Buscar URL do áudio
  const { data: link } = await supabase
    .from('psalm_melody_audio_links')
    .select('audio_url')
    .eq('id', linkId)
    .single();
  
  if (link) {
    // Extrair nome do arquivo da URL
    const fileName = link.audio_url.split('/').pop();
    if (fileName) {
      // Deletar do Storage
      await supabase.storage
        .from('psalm-audios')
        .remove([fileName]);
    }
  }
  
  // Deletar registro do banco
  const { error } = await supabase
    .from('psalm_melody_audio_links')
    .delete()
    .eq('id', linkId);
  
  if (error) throw error;
};

// ========== HELPER: GENERATE SCHEDULES FOR MONTH ==========

export interface GeneratedMusicianSchedule {
  recurringSchedule: RecurringSchedule;
  date: Date;
  override?: ScheduleOverride;
  isOverride: boolean;
}

export interface GeneratedSalmistSchedule {
  recurringSalmistSchedule: RecurringSalmistSchedule;
  date: Date;
  override?: SalmistScheduleOverride;
  isOverride: boolean;
}

export const generateSchedulesForMonth = async (
  year: number,
  month: number,
  filterParishId?: string
): Promise<{
  musicianSchedules: GeneratedMusicianSchedule[];
  salmistSchedules: GeneratedSalmistSchedule[];
}> => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  
  // Buscar dados
  const [recurringSchedules, recurringSalmistSchedules, scheduleOverrides, salmistScheduleOverrides] = await Promise.all([
    getRecurringSchedules(filterParishId),
    getRecurringSalmistSchedules(filterParishId),
    getScheduleOverrides(monthStr),
    getSalmistScheduleOverrides(monthStr),
  ]);
  
  const musicianSchedules: GeneratedMusicianSchedule[] = [];
  const salmistSchedules: GeneratedSalmistSchedule[] = [];
  
  // Processar escalas de músicos
  for (const recurring of recurringSchedules) {
    if (!recurring.isActive) continue;
    if (recurring.startMonth > monthStr) continue;
    
    const date = getNthWeekdayOfMonth(year, month, recurring.weekOfMonth, recurring.dayOfWeek);
    if (!date) continue;
    
    const override = scheduleOverrides.find(o => o.recurringScheduleId === recurring.id);
    
    musicianSchedules.push({
      recurringSchedule: recurring,
      date,
      override,
      isOverride: !!override,
    });
  }
  
  // Processar escalas de salmistas
  for (const recurring of recurringSalmistSchedules) {
    if (!recurring.isActive) continue;
    if (recurring.startMonth > monthStr) continue;
    
    const date = getNthWeekdayOfMonth(year, month, recurring.weekOfMonth, recurring.dayOfWeek);
    if (!date) continue;
    
    const override = salmistScheduleOverrides.find(o => o.recurringSalmistScheduleId === recurring.id);
    
    salmistSchedules.push({
      recurringSalmistSchedule: recurring,
      date,
      override,
      isOverride: !!override,
    });
  }
  
  return { musicianSchedules, salmistSchedules };
};

// ========== SLIDE FOLDERS ==========

export const getSlideFolders = async (filterParishId?: string): Promise<SlideFolder[]> => {
  let query = supabase
    .from('slide_folders')
    .select('*')
    .order('name');
  
  if (filterParishId) {
    query = query.eq('parish_id', filterParishId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map(f => ({
    id: f.id,
    name: f.name,
    parentId: f.parent_id,
    createdAt: f.created_at,
    createdBy: f.created_by,
  }));
};

export const addSlideFolder = async (folder: Omit<SlideFolder, 'id' | 'createdAt'>, parishId?: string): Promise<SlideFolder> => {
  const { data, error } = await supabase
    .from('slide_folders')
    .insert({
      name: folder.name,
      parent_id: folder.parentId,
      created_by: folder.createdBy,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    parentId: data.parent_id,
    createdAt: data.created_at,
    createdBy: data.created_by,
  };
};

export const updateSlideFolder = async (folderId: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('slide_folders')
    .update({ name })
    .eq('id', folderId);
  
  if (error) throw error;
};

export const deleteSlideFolder = async (folderId: string): Promise<void> => {
  const { error } = await supabase
    .from('slide_folders')
    .delete()
    .eq('id', folderId);
  
  if (error) throw error;
};

// ========== SLIDE FILES ==========

export const getSlideFiles = async (filterParishId?: string): Promise<SlideFile[]> => {
  let query = supabase
    .from('slide_files')
    .select('*')
    .order('uploaded_at', { ascending: false });
  
  if (filterParishId) {
    query = query.eq('parish_id', filterParishId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map(f => ({
    id: f.id,
    folderId: f.folder_id,
    name: f.name,
    fileUrl: f.file_url,
    uploadedAt: f.uploaded_at,
    uploadedBy: f.uploaded_by,
  }));
};

export const addSlideFile = async (
  file: Omit<SlideFile, 'id' | 'uploadedAt' | 'fileUrl'>, 
  slideFile: File,
  parishId?: string
): Promise<SlideFile> => {
  // Sanitizar nome do arquivo
  const sanitizedName = sanitizeFileName(slideFile.name);
  const filePath = `${Date.now()}_${sanitizedName}`;
  
  // Upload do arquivo para o storage
  const { error: uploadError } = await supabase
    .storage
    .from('slides')
    .upload(filePath, slideFile);
  
  if (uploadError) throw uploadError;
  
  // Obter URL pública
  const { data: publicUrlData } = supabase
    .storage
    .from('slides')
    .getPublicUrl(filePath);
  
  // Inserir registro no banco
  const { data, error } = await supabase
    .from('slide_files')
    .insert({
      folder_id: file.folderId,
      name: file.name,
      file_url: publicUrlData.publicUrl,
      uploaded_by: file.uploadedBy,
      parish_id: parishId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    folderId: data.folder_id,
    name: data.name,
    fileUrl: data.file_url,
    uploadedAt: data.uploaded_at,
    uploadedBy: data.uploaded_by,
  };
};

export const deleteSlideFile = async (fileId: string): Promise<void> => {
  // Buscar arquivo para obter URL
  const { data: file, error: fetchError } = await supabase
    .from('slide_files')
    .select('file_url')
    .eq('id', fileId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Extrair path do arquivo no storage
  if (file.file_url) {
    const urlParts = file.file_url.split('/slides/');
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      await supabase.storage.from('slides').remove([storagePath]);
    }
  }
  
  // Deletar registro do banco
  const { error } = await supabase
    .from('slide_files')
    .delete()
    .eq('id', fileId);
  
  if (error) throw error;
};