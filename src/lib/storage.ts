import { AppData, Folder, MusicFile, Schedule, SalmistSchedule, PsalmMelody, RecurringSchedule, RecurringSalmistSchedule, ScheduleOverride, SalmistScheduleOverride } from '@/types';
import { getNthWeekdayOfMonth } from './utils';

const STORAGE_KEY = 'ministerio-musica-data';
const DATA_VERSION = 4;

// Dados iniciais (seed)
const initialData: AppData = {
  version: DATA_VERSION,
  folders: [
    // Tempo Comum
    { id: 'tempo-comum', name: 'Tempo Comum', parentId: null, createdAt: new Date().toISOString() },
    { id: 'tc-ano-a', name: 'Ano A', parentId: 'tempo-comum', createdAt: new Date().toISOString() },
    { id: 'tc-ano-b', name: 'Ano B', parentId: 'tempo-comum', createdAt: new Date().toISOString() },
    { id: 'tc-ano-c', name: 'Ano C', parentId: 'tempo-comum', createdAt: new Date().toISOString() },
    
    // Tempo Pascal
    { id: 'tempo-pascal', name: 'Tempo Pascal', parentId: null, createdAt: new Date().toISOString() },
    { id: 'tp-ano-a', name: 'Ano A', parentId: 'tempo-pascal', createdAt: new Date().toISOString() },
    { id: 'tp-ano-b', name: 'Ano B', parentId: 'tempo-pascal', createdAt: new Date().toISOString() },
    { id: 'tp-ano-c', name: 'Ano C', parentId: 'tempo-pascal', createdAt: new Date().toISOString() },
    
    // Tempo Quaresmal
    { id: 'tempo-quaresmal', name: 'Tempo Quaresmal', parentId: null, createdAt: new Date().toISOString() },
    { id: 'tq-ano-a', name: 'Ano A', parentId: 'tempo-quaresmal', createdAt: new Date().toISOString() },
    { id: 'tq-ano-b', name: 'Ano B', parentId: 'tempo-quaresmal', createdAt: new Date().toISOString() },
    { id: 'tq-ano-c', name: 'Ano C', parentId: 'tempo-quaresmal', createdAt: new Date().toISOString() },
    
    // Advento
    { id: 'advento', name: 'Advento', parentId: null, createdAt: new Date().toISOString() },
    { id: 'adv-ano-a', name: 'Ano A', parentId: 'advento', createdAt: new Date().toISOString() },
    { id: 'adv-ano-b', name: 'Ano B', parentId: 'advento', createdAt: new Date().toISOString() },
    { id: 'adv-ano-c', name: 'Ano C', parentId: 'advento', createdAt: new Date().toISOString() },
    
    // Natal
    { id: 'natal', name: 'Natal', parentId: null, createdAt: new Date().toISOString() },
    { id: 'nat-ano-a', name: 'Ano A', parentId: 'natal', createdAt: new Date().toISOString() },
    { id: 'nat-ano-b', name: 'Ano B', parentId: 'natal', createdAt: new Date().toISOString() },
    { id: 'nat-ano-c', name: 'Ano C', parentId: 'natal', createdAt: new Date().toISOString() },
  ],
  files: [],
  schedules: [],
  recurringSchedules: [
    {
      id: 'rec-esc-1',
      weekOfMonth: 1,
      dayOfWeek: 0, // Domingo
      time: '19:00',
      type: 'dominical',
      community: 'Matriz',
      musicians: [
        { name: 'Coral São João' },
        { name: 'Coral Matriz' },
        { name: 'Coral Santa Cecília' },
      ],
      observations: 'Primeiro domingo do mês',
      isActive: true,
      startMonth: '2025-01',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
    },
  ],
  scheduleOverrides: [],
  salmistSchedules: [],
  recurringSalmistSchedules: [],
  salmistScheduleOverrides: [],
  psalmMelodies: [
    {
      date: new Date().toISOString().split('T')[0],
      psalmIndex: 0,
      psalmText: 'O Senhor é meu pastor, nada me faltará.',
      psalmReference: 'Salmo 22 (23)',
      youtubeLinks: [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Melodia Principal' }],
      addedBy: 'Admin',
      addedAt: new Date().toISOString(),
    },
  ],
  currentUser: undefined,
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Migração de versão 3 para 4
      if (!data.version || data.version < DATA_VERSION) {
        console.log('Migrando para nova estrutura de dados (v4)...');
        const migratedData: AppData = {
          ...data,
          version: DATA_VERSION,
          recurringSchedules: data.recurringSchedules || [],
          scheduleOverrides: data.scheduleOverrides || [],
          recurringSalmistSchedules: data.recurringSalmistSchedules || [],
          salmistScheduleOverrides: data.salmistScheduleOverrides || [],
        };
        saveData(migratedData);
        return migratedData;
      }
      return data;
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
  return initialData;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
};

export const addFolder = (folder: Folder): void => {
  const data = loadData();
  data.folders.push(folder);
  saveData(data);
};

export const deleteFolder = (folderId: string): void => {
  const data = loadData();
  
  // Deletar subpastas recursivamente
  const getSubfolders = (id: string): string[] => {
    const subfolders = data.folders.filter(f => f.parentId === id);
    return [id, ...subfolders.flatMap(sf => getSubfolders(sf.id))];
  };
  
  const foldersToDelete = getSubfolders(folderId);
  
  data.folders = data.folders.filter(f => !foldersToDelete.includes(f.id));
  data.files = data.files.filter(f => !foldersToDelete.includes(f.folderId));
  
  saveData(data);
};

export const addFile = (file: MusicFile): void => {
  const data = loadData();
  data.files.push(file);
  saveData(data);
};

export const deleteFile = (fileId: string): void => {
  const data = loadData();
  data.files = data.files.filter(f => f.id !== fileId);
  saveData(data);
};

export const addSchedule = (schedule: Schedule): void => {
  const data = loadData();
  data.schedules.push(schedule);
  saveData(data);
};

export const updateSchedule = (schedule: Schedule): void => {
  const data = loadData();
  data.schedules = data.schedules.map(s => s.id === schedule.id ? schedule : s);
  saveData(data);
};

export const deleteSchedule = (scheduleId: string): void => {
  const data = loadData();
  data.schedules = data.schedules.filter(s => s.id !== scheduleId);
  saveData(data);
};

export const addSalmistSchedule = (schedule: SalmistSchedule): void => {
  const data = loadData();
  data.salmistSchedules = data.salmistSchedules || [];
  data.salmistSchedules.push(schedule);
  saveData(data);
};

export const updateSalmistSchedule = (schedule: SalmistSchedule): void => {
  const data = loadData();
  data.salmistSchedules = data.salmistSchedules || [];
  data.salmistSchedules = data.salmistSchedules.map(s => s.id === schedule.id ? schedule : s);
  saveData(data);
};

export const deleteSalmistSchedule = (scheduleId: string): void => {
  const data = loadData();
  data.salmistSchedules = data.salmistSchedules || [];
  data.salmistSchedules = data.salmistSchedules.filter(s => s.id !== scheduleId);
  saveData(data);
};

export const addPsalmMelody = (melody: PsalmMelody): void => {
  const data = loadData();
  data.psalmMelodies = data.psalmMelodies.filter(m => m.date !== melody.date);
  data.psalmMelodies.push(melody);
  saveData(data);
};

export const setCurrentUser = (name: string | undefined): void => {
  const data = loadData();
  data.currentUser = name;
  saveData(data);
};

export const getCurrentUser = (): string | undefined => {
  return loadData().currentUser;
};

// ========== Funções para RecurringSchedule ==========

export const addRecurringSchedule = (schedule: RecurringSchedule): void => {
  const data = loadData();
  data.recurringSchedules.push(schedule);
  saveData(data);
};

export const updateRecurringSchedule = (schedule: RecurringSchedule): void => {
  const data = loadData();
  data.recurringSchedules = data.recurringSchedules.map(s => s.id === schedule.id ? schedule : s);
  saveData(data);
};

export const deleteRecurringSchedule = (id: string): void => {
  const data = loadData();
  data.recurringSchedules = data.recurringSchedules.filter(s => s.id !== id);
  // Também remover overrides relacionados
  data.scheduleOverrides = data.scheduleOverrides.filter(o => o.recurringScheduleId !== id);
  saveData(data);
};

export const getRecurringSchedules = (): RecurringSchedule[] => {
  return loadData().recurringSchedules || [];
};

// ========== Funções para ScheduleOverride ==========

export const addScheduleOverride = (override: ScheduleOverride): void => {
  const data = loadData();
  data.scheduleOverrides.push(override);
  saveData(data);
};

export const updateScheduleOverride = (override: ScheduleOverride): void => {
  const data = loadData();
  data.scheduleOverrides = data.scheduleOverrides.map(o => o.id === override.id ? override : o);
  saveData(data);
};

export const deleteScheduleOverride = (id: string): void => {
  const data = loadData();
  data.scheduleOverrides = data.scheduleOverrides.filter(o => o.id !== id);
  saveData(data);
};

export const getScheduleOverridesForMonth = (month: string): ScheduleOverride[] => {
  const data = loadData();
  return data.scheduleOverrides.filter(o => o.specificMonth === month);
};

// ========== Funções para RecurringSalmistSchedule ==========

export const addRecurringSalmistSchedule = (schedule: RecurringSalmistSchedule): void => {
  const data = loadData();
  data.recurringSalmistSchedules.push(schedule);
  saveData(data);
};

export const updateRecurringSalmistSchedule = (schedule: RecurringSalmistSchedule): void => {
  const data = loadData();
  data.recurringSalmistSchedules = data.recurringSalmistSchedules.map(s => s.id === schedule.id ? schedule : s);
  saveData(data);
};

export const deleteRecurringSalmistSchedule = (id: string): void => {
  const data = loadData();
  data.recurringSalmistSchedules = data.recurringSalmistSchedules.filter(s => s.id !== id);
  // Também remover overrides relacionados
  data.salmistScheduleOverrides = data.salmistScheduleOverrides.filter(o => o.recurringSalmistScheduleId !== id);
  saveData(data);
};

export const getRecurringSalmistSchedules = (): RecurringSalmistSchedule[] => {
  return loadData().recurringSalmistSchedules || [];
};

// ========== Funções para SalmistScheduleOverride ==========

export const addSalmistScheduleOverride = (override: SalmistScheduleOverride): void => {
  const data = loadData();
  data.salmistScheduleOverrides.push(override);
  saveData(data);
};

export const updateSalmistScheduleOverride = (override: SalmistScheduleOverride): void => {
  const data = loadData();
  data.salmistScheduleOverrides = data.salmistScheduleOverrides.map(o => o.id === override.id ? override : o);
  saveData(data);
};

export const deleteSalmistScheduleOverride = (id: string): void => {
  const data = loadData();
  data.salmistScheduleOverrides = data.salmistScheduleOverrides.filter(o => o.id !== id);
  saveData(data);
};

export const getSalmistScheduleOverridesForMonth = (month: string): SalmistScheduleOverride[] => {
  const data = loadData();
  return data.salmistScheduleOverrides.filter(o => o.specificMonth === month);
};

// ========== Função para gerar escalas de um mês ==========

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

export const generateSchedulesForMonth = (
  year: number,
  month: number
): {
  musicianSchedules: GeneratedMusicianSchedule[];
  salmistSchedules: GeneratedSalmistSchedule[];
} => {
  const data = loadData();
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  
  const musicianSchedules: GeneratedMusicianSchedule[] = [];
  const salmistSchedules: GeneratedSalmistSchedule[] = [];
  
  // Processar escalas de músicos
  for (const recurring of data.recurringSchedules) {
    if (!recurring.isActive) continue;
    if (recurring.startMonth > monthStr) continue;
    
    const date = getNthWeekdayOfMonth(year, month, recurring.weekOfMonth, recurring.dayOfWeek);
    if (!date) continue;
    
    const override = data.scheduleOverrides.find(
      o => o.recurringScheduleId === recurring.id && o.specificMonth === monthStr
    );
    
    musicianSchedules.push({
      recurringSchedule: recurring,
      date,
      override,
      isOverride: !!override,
    });
  }
  
  // Processar escalas de salmistas
  for (const recurring of data.recurringSalmistSchedules) {
    if (!recurring.isActive) continue;
    if (recurring.startMonth > monthStr) continue;
    
    const date = getNthWeekdayOfMonth(year, month, recurring.weekOfMonth, recurring.dayOfWeek);
    if (!date) continue;
    
    const override = data.salmistScheduleOverrides.find(
      o => o.recurringSalmistScheduleId === recurring.id && o.specificMonth === monthStr
    );
    
    salmistSchedules.push({
      recurringSalmistSchedule: recurring,
      date,
      override,
      isOverride: !!override,
    });
  }
  
  return { musicianSchedules, salmistSchedules };
};
