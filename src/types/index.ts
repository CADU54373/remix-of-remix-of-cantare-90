// Tipos para o sistema de gerenciamento de ministério de música

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface SlideFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  createdBy?: string;
}

export interface SlideFile {
  id: string;
  folderId: string;
  name: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface MusicVideoLink {
  id: string;
  musicFileId: string;
  title: string;
  videoUrl: string;
  createdAt: string;
  createdBy?: string;
}

export interface MusicAudioLink {
  id: string;
  musicFileId: string;
  title: string;
  audioUrl: string;
  durationSeconds?: number;
  createdAt: string;
  createdBy?: string;
}

export interface MusicFile {
  id: string;
  name: string;
  folderId: string;
  fileData: string; // Base64 ou URL
  uploadedAt: string;
  uploadedBy?: string;
  videoLinks?: MusicVideoLink[];
  audioLinks?: MusicAudioLink[];
}

export interface Musician {
  name: string;
}

export interface Schedule {
  id: string;
  date: string;
  time: string;
  type: 'dominical' | 'semanal' | 'especial' | 'outro';
  community: string;
  musicians: Musician[];
  observations?: string;
  createdAt: string;
  createdBy?: string;
}

export interface SalmistSchedule {
  id: string;
  date: string;
  time: string;
  community: string;
  psalmist: string;
  psalmText?: string;
  psalmReference?: string;
  youtubeLink?: string;
  observations?: string;
  createdAt: string;
  createdBy?: string;
}

export interface PsalmMelodyLink {
  url: string;
  title?: string;
}

export interface PsalmMelodyAudioLink {
  id: string;
  psalmMelodyId: string;
  title: string;
  audioUrl: string;
  durationSeconds?: number;
  createdAt: string;
  createdBy?: string;
}

export interface PsalmMelody {
  id?: string;
  date: string;
  psalmIndex: number;
  psalmText: string;
  psalmReference: string;
  youtubeLinks: PsalmMelodyLink[];
  audioLinks?: PsalmMelodyAudioLink[];
  addedBy?: string;
  addedAt?: string;
}

export interface LiturgyReading {
  title: string;
  reference: string;
  text: string;
}

export interface DailyLiturgy {
  date: string;
  firstReading: LiturgyReading;
  psalm: LiturgyReading;
  secondReading?: LiturgyReading;
  gospel: LiturgyReading;
}

export interface RecurringSchedule {
  id: string;
  weekOfMonth: 1 | 2 | 3 | 4 | 5; // Qual semana do mês
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 6 = Sábado
  time: string;
  type: 'dominical' | 'semanal' | 'especial' | 'outro';
  community: string;
  musicians: Musician[];
  observations?: string;
  isActive: boolean;
  startMonth: string; // Formato: "2025-01"
  createdAt: string;
  createdBy?: string;
}

export interface RecurringSalmistSchedule {
  id: string;
  weekOfMonth: 1 | 2 | 3 | 4 | 5;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  time: string;
  community: string;
  psalmist: string;
  observations?: string;
  isActive: boolean;
  startMonth: string;
  createdAt: string;
  createdBy?: string;
}

export interface ScheduleOverride {
  id: string;
  recurringScheduleId: string;
  specificMonth: string; // Formato: "2025-03"
  date: string;
  time: string;
  type: 'dominical' | 'semanal' | 'especial' | 'outro';
  community: string;
  musicians: Musician[];
  observations?: string;
  createdAt: string;
  createdBy?: string;
}

export interface SalmistScheduleOverride {
  id: string;
  recurringSalmistScheduleId: string;
  specificMonth: string;
  date: string;
  time: string;
  community: string;
  psalmist: string;
  observations?: string;
  createdAt: string;
  createdBy?: string;
}

export interface AppData {
  version?: number;
  folders: Folder[];
  files: MusicFile[];
  schedules: Schedule[]; // Mantido para compatibilidade
  recurringSchedules: RecurringSchedule[];
  scheduleOverrides: ScheduleOverride[];
  salmistSchedules: SalmistSchedule[]; // Mantido para compatibilidade
  recurringSalmistSchedules: RecurringSalmistSchedule[];
  salmistScheduleOverrides: SalmistScheduleOverride[];
  psalmMelodies: PsalmMelody[];
  currentUser?: string;
}
