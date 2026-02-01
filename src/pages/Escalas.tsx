import { useState, useEffect } from "react";
import { 
  addRecurringSchedule, 
  updateRecurringSchedule, 
  deleteRecurringSchedule, 
  addScheduleOverride, 
  updateScheduleOverride, 
  deleteScheduleOverride, 
  addRecurringSalmistSchedule, 
  updateRecurringSalmistSchedule, 
  deleteRecurringSalmistSchedule, 
  addSalmistScheduleOverride, 
  updateSalmistScheduleOverride, 
  deleteSalmistScheduleOverride, 
  generateSchedulesForMonth,
  getPsalmMelodies,
  GeneratedMusicianSchedule,
  GeneratedSalmistSchedule
} from "@/lib/supabase-storage";
import { RecurringSchedule, Musician, RecurringSalmistSchedule, ScheduleOverride, SalmistScheduleOverride, PsalmMelody } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Trash2, Edit, Users, Clock, Music, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Escalas = () => {
  const [viewMode, setViewMode] = useState<'musicos' | 'salmistas'>('musicos');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [communityFilter, setCommunityFilter] = useState<string>('all');
  
  const [musicianSchedules, setMusicianSchedules] = useState<GeneratedMusicianSchedule[]>([]);
  const [salmistSchedules, setSalmistSchedules] = useState<GeneratedSalmistSchedule[]>([]);
  const [psalmMelodies, setPsalmMelodies] = useState<PsalmMelody[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salmistDialogOpen, setSalmistDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'new' | 'edit-recurring' | 'create-override' | 'edit-override'>('new');
  const [editingRecurring, setEditingRecurring] = useState<RecurringSchedule | null>(null);
  const [editingOverride, setEditingOverride] = useState<ScheduleOverride | null>(null);
  const [editingRecurringSalmist, setEditingRecurringSalmist] = useState<RecurringSalmistSchedule | null>(null);
  const [editingOverrideSalmist, setEditingOverrideSalmist] = useState<SalmistScheduleOverride | null>(null);
  
  // Form state para escala fixa
  const [formData, setFormData] = useState({
    weekOfMonth: 1 as 1 | 2 | 3 | 4 | 5,
    dayOfWeek: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    time: "",
    type: "dominical" as RecurringSchedule['type'],
    community: "",
    observations: "",
    startMonth: "",
  });
  const [musicians, setMusicians] = useState<Musician[]>([{ name: "" }]);
  
  // Form state para substituição
  const [overrideFormData, setOverrideFormData] = useState({
    time: "",
    type: "dominical" as RecurringSchedule['type'],
    community: "",
    observations: "",
  });
  
  // Salmist form state
  const [salmistFormData, setSalmistFormData] = useState({
    weekOfMonth: 1 as 1 | 2 | 3 | 4 | 5,
    dayOfWeek: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    time: "",
    community: "",
    psalmist: "",
    observations: "",
    startMonth: "",
  });
  
  // Salmist override form state
  const [salmistOverrideFormData, setSalmistOverrideFormData] = useState({
    time: "",
    community: "",
    psalmist: "",
    observations: "",
  });

  useEffect(() => {
    refreshData();
  }, [selectedYear, selectedMonth]);

  const refreshData = async () => {
    try {
      const [schedules, melodies] = await Promise.all([
        generateSchedulesForMonth(selectedYear, selectedMonth),
        getPsalmMelodies()
      ]);
      setMusicianSchedules(schedules.musicianSchedules.sort((a, b) => a.date.getTime() - b.date.getTime()));
      setSalmistSchedules(schedules.salmistSchedules.sort((a, b) => a.date.getTime() - b.date.getTime()));
      setPsalmMelodies(melodies);
    } catch (error) {
      console.error("Erro ao carregar escalas:", error);
      toast.error("Erro ao carregar escalas");
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getMonthName = () => {
    const date = new Date(selectedYear, selectedMonth - 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const getDayOfWeekLabel = (day: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[day];
  };

  const getWeekLabel = (week: number) => {
    const labels = ['', '1º', '2º', '3º', '4º', '5º'];
    return labels[week];
  };

  // ========== Handlers para escala de músicos ==========

  const handleOpenDialog = (mode: 'new' | 'edit-recurring' | 'create-override' | 'edit-override', generated?: GeneratedMusicianSchedule) => {
    setDialogMode(mode);
    
    if (mode === 'new') {
      setEditingRecurring(null);
      setEditingOverride(null);
      setFormData({
        weekOfMonth: 1,
        dayOfWeek: 0,
        time: "",
        type: "dominical",
        community: "",
        observations: "",
        startMonth: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
      });
      setMusicians([{ name: "" }]);
    } else if (mode === 'edit-recurring' && generated) {
      setEditingRecurring(generated.recurringSchedule);
      setEditingOverride(null);
      setFormData({
        weekOfMonth: generated.recurringSchedule.weekOfMonth,
        dayOfWeek: generated.recurringSchedule.dayOfWeek,
        time: generated.recurringSchedule.time,
        type: generated.recurringSchedule.type,
        community: generated.recurringSchedule.community,
        observations: generated.recurringSchedule.observations || "",
        startMonth: generated.recurringSchedule.startMonth,
      });
      setMusicians(generated.recurringSchedule.musicians.length > 0 ? generated.recurringSchedule.musicians : [{ name: "" }]);
    } else if (mode === 'create-override' && generated) {
      setEditingRecurring(generated.recurringSchedule);
      setEditingOverride(null);
      setOverrideFormData({
        time: generated.recurringSchedule.time,
        type: generated.recurringSchedule.type,
        community: generated.recurringSchedule.community,
        observations: generated.recurringSchedule.observations || "",
      });
      setMusicians(generated.recurringSchedule.musicians.map(m => ({ ...m })));
    } else if (mode === 'edit-override' && generated && generated.override) {
      setEditingRecurring(generated.recurringSchedule);
      setEditingOverride(generated.override);
      setOverrideFormData({
        time: generated.override.time,
        type: generated.override.type,
        community: generated.override.community,
        observations: generated.override.observations || "",
      });
      setMusicians(generated.override.musicians.length > 0 ? generated.override.musicians : [{ name: "" }]);
    }
    
    setDialogOpen(true);
  };

  const handleAddMusician = () => {
    setMusicians([...musicians, { name: "" }]);
  };

  const handleRemoveMusician = (index: number) => {
    setMusicians(musicians.filter((_, i) => i !== index));
  };

  const handleMusicianChange = (index: number, value: string) => {
    const updated = [...musicians];
    updated[index].name = value;
    setMusicians(updated);
  };

  const handleSaveSchedule = async () => {
    const validMusicians = musicians.filter(m => m.name.trim());

    if (validMusicians.length === 0) {
      toast.error("Adicione pelo menos um coral");
      return;
    }

    try {
      if (dialogMode === 'new' || dialogMode === 'edit-recurring') {
        if (!formData.time || !formData.community || !formData.startMonth) {
          toast.error("Preencha horário, comunidade e mês de início");
          return;
        }

        const scheduleData: Omit<RecurringSchedule, 'id' | 'createdAt'> = {
          weekOfMonth: formData.weekOfMonth,
          dayOfWeek: formData.dayOfWeek,
          time: formData.time,
          type: formData.type,
          community: formData.community,
          musicians: validMusicians,
          observations: formData.observations,
          isActive: editingRecurring?.isActive ?? true,
          startMonth: formData.startMonth,
          createdBy: editingRecurring?.createdBy || 'Usuário Atual',
        };

        if (editingRecurring) {
          await updateRecurringSchedule({ ...scheduleData, id: editingRecurring.id, createdAt: editingRecurring.createdAt });
          toast.success("Escala fixa atualizada!");
        } else {
          await addRecurringSchedule(scheduleData);
          toast.success("Escala fixa criada!");
        }
      } else if (dialogMode === 'create-override' || dialogMode === 'edit-override') {
        if (!overrideFormData.time || !overrideFormData.community || !editingRecurring) {
          toast.error("Preencha horário e comunidade");
          return;
        }

        const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
        const foundSchedule = musicianSchedules.find(s => s.recurringSchedule.id === editingRecurring.id);
        const dateStr = foundSchedule?.date ? getValidDateString(foundSchedule.date) : format(new Date(), 'yyyy-MM-dd');
        
        if (!dateStr) {
          toast.error("Erro ao calcular data da escala");
          return;
        }

        const overrideData: Omit<ScheduleOverride, 'id' | 'createdAt'> = {
          recurringScheduleId: editingRecurring.id,
          specificMonth: monthStr,
          date: dateStr,
          time: overrideFormData.time,
          type: overrideFormData.type,
          community: overrideFormData.community,
          musicians: validMusicians,
          observations: overrideFormData.observations,
          createdBy: editingOverride?.createdBy || 'Usuário Atual',
        };

        if (editingOverride) {
          await updateScheduleOverride({ ...overrideData, id: editingOverride.id, createdAt: editingOverride.createdAt });
          toast.success("Substituição atualizada!");
        } else {
          await addScheduleOverride(overrideData);
          toast.success("Substituição criada!");
        }
      }

      await refreshData();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar escala:", error);
      toast.error("Erro ao salvar escala");
    }
  };

  const handleDeleteRecurringSchedule = async (recurring: RecurringSchedule) => {
    if (confirm(`Deseja excluir a escala fixa "${getWeekLabel(recurring.weekOfMonth)} ${getDayOfWeekLabel(recurring.dayOfWeek)}"? Todas as substituições relacionadas também serão excluídas.`)) {
      try {
        await deleteRecurringSchedule(recurring.id);
        await refreshData();
        toast.success("Escala fixa excluída!");
      } catch (error) {
        console.error("Erro ao excluir escala:", error);
        toast.error("Erro ao excluir escala");
      }
    }
  };

  const handleToggleRecurringSchedule = async (recurring: RecurringSchedule) => {
    try {
      await updateRecurringSchedule({ ...recurring, isActive: !recurring.isActive });
      await refreshData();
      toast.success(recurring.isActive ? "Escala desativada!" : "Escala ativada!");
    } catch (error) {
      console.error("Erro ao atualizar escala:", error);
      toast.error("Erro ao atualizar escala");
    }
  };

  const handleDeleteOverride = async (override: ScheduleOverride) => {
    if (confirm("Deseja excluir esta substituição?")) {
      try {
        await deleteScheduleOverride(override.id);
        await refreshData();
        toast.success("Substituição excluída!");
      } catch (error) {
        console.error("Erro ao excluir substituição:", error);
        toast.error("Erro ao excluir substituição");
      }
    }
  };

  // ========== Handlers para escala de salmistas ==========

  const handleOpenSalmistDialog = (mode: 'new' | 'edit-recurring' | 'create-override' | 'edit-override', generated?: GeneratedSalmistSchedule) => {
    setDialogMode(mode);
    
    if (mode === 'new') {
      setEditingRecurringSalmist(null);
      setEditingOverrideSalmist(null);
      setSalmistFormData({
        weekOfMonth: 1,
        dayOfWeek: 0,
        time: "",
        community: "",
        psalmist: "",
        observations: "",
        startMonth: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
      });
    } else if (mode === 'edit-recurring' && generated) {
      setEditingRecurringSalmist(generated.recurringSalmistSchedule);
      setEditingOverrideSalmist(null);
      setSalmistFormData({
        weekOfMonth: generated.recurringSalmistSchedule.weekOfMonth,
        dayOfWeek: generated.recurringSalmistSchedule.dayOfWeek,
        time: generated.recurringSalmistSchedule.time,
        community: generated.recurringSalmistSchedule.community,
        psalmist: generated.recurringSalmistSchedule.psalmist,
        observations: generated.recurringSalmistSchedule.observations || "",
        startMonth: generated.recurringSalmistSchedule.startMonth,
      });
    } else if (mode === 'create-override' && generated) {
      setEditingRecurringSalmist(generated.recurringSalmistSchedule);
      setEditingOverrideSalmist(null);
      setSalmistOverrideFormData({
        time: generated.recurringSalmistSchedule.time,
        community: generated.recurringSalmistSchedule.community,
        psalmist: generated.recurringSalmistSchedule.psalmist,
        observations: generated.recurringSalmistSchedule.observations || "",
      });
    } else if (mode === 'edit-override' && generated && generated.override) {
      setEditingRecurringSalmist(generated.recurringSalmistSchedule);
      setEditingOverrideSalmist(generated.override);
      setSalmistOverrideFormData({
        time: generated.override.time,
        community: generated.override.community,
        psalmist: generated.override.psalmist,
        observations: generated.override.observations || "",
      });
    }
    
    setSalmistDialogOpen(true);
  };

  const handleSaveSalmistSchedule = async () => {
    try {
      if (dialogMode === 'new' || dialogMode === 'edit-recurring') {
        if (!salmistFormData.time || !salmistFormData.community || !salmistFormData.psalmist || !salmistFormData.startMonth) {
          toast.error("Preencha horário, comunidade, salmista e mês de início");
          return;
        }

        const scheduleData: Omit<RecurringSalmistSchedule, 'id' | 'createdAt'> = {
          weekOfMonth: salmistFormData.weekOfMonth,
          dayOfWeek: salmistFormData.dayOfWeek,
          time: salmistFormData.time,
          community: salmistFormData.community,
          psalmist: salmistFormData.psalmist,
          observations: salmistFormData.observations,
          isActive: editingRecurringSalmist?.isActive ?? true,
          startMonth: salmistFormData.startMonth,
          createdBy: editingRecurringSalmist?.createdBy || 'Usuário Atual',
        };

        if (editingRecurringSalmist) {
          await updateRecurringSalmistSchedule({ ...scheduleData, id: editingRecurringSalmist.id, createdAt: editingRecurringSalmist.createdAt });
          toast.success("Escala fixa de salmista atualizada!");
        } else {
          await addRecurringSalmistSchedule(scheduleData);
          toast.success("Escala fixa de salmista criada!");
        }
      } else if (dialogMode === 'create-override' || dialogMode === 'edit-override') {
        if (!salmistOverrideFormData.time || !salmistOverrideFormData.community || !salmistOverrideFormData.psalmist || !editingRecurringSalmist) {
          toast.error("Preencha horário, comunidade e salmista");
          return;
        }

        const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
        const foundSchedule = salmistSchedules.find(s => s.recurringSalmistSchedule.id === editingRecurringSalmist.id);
        const dateStr = foundSchedule?.date ? getValidDateString(foundSchedule.date) : format(new Date(), 'yyyy-MM-dd');
        
        if (!dateStr) {
          toast.error("Erro ao calcular data da escala");
          return;
        }

        const overrideData: Omit<SalmistScheduleOverride, 'id' | 'createdAt'> = {
          recurringSalmistScheduleId: editingRecurringSalmist.id,
          specificMonth: monthStr,
          date: dateStr,
          time: salmistOverrideFormData.time,
          community: salmistOverrideFormData.community,
          psalmist: salmistOverrideFormData.psalmist,
          observations: salmistOverrideFormData.observations,
          createdBy: editingOverrideSalmist?.createdBy || 'Usuário Atual',
        };

        if (editingOverrideSalmist) {
          await updateSalmistScheduleOverride({ ...overrideData, id: editingOverrideSalmist.id, createdAt: editingOverrideSalmist.createdAt });
          toast.success("Substituição de salmista atualizada!");
        } else {
          await addSalmistScheduleOverride(overrideData);
          toast.success("Substituição de salmista criada!");
        }
      }

      await refreshData();
      setSalmistDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar escala de salmista:", error);
      toast.error("Erro ao salvar escala de salmista");
    }
  };

  const handleDeleteRecurringSalmist = async (recurring: RecurringSalmistSchedule) => {
    if (confirm(`Deseja excluir a escala fixa "${getWeekLabel(recurring.weekOfMonth)} ${getDayOfWeekLabel(recurring.dayOfWeek)}"? Todas as substituições relacionadas também serão excluídas.`)) {
      try {
        await deleteRecurringSalmistSchedule(recurring.id);
        await refreshData();
        toast.success("Escala fixa excluída!");
      } catch (error) {
        console.error("Erro ao excluir escala:", error);
        toast.error("Erro ao excluir escala");
      }
    }
  };

  const handleToggleRecurringSalmist = async (recurring: RecurringSalmistSchedule) => {
    try {
      await updateRecurringSalmistSchedule({ ...recurring, isActive: !recurring.isActive });
      await refreshData();
      toast.success(recurring.isActive ? "Escala desativada!" : "Escala ativada!");
    } catch (error) {
      console.error("Erro ao atualizar escala:", error);
      toast.error("Erro ao atualizar escala");
    }
  };

  const handleDeleteSalmistOverride = async (override: SalmistScheduleOverride) => {
    if (confirm("Deseja excluir esta substituição?")) {
      try {
        await deleteSalmistScheduleOverride(override.id);
        await refreshData();
        toast.success("Substituição excluída!");
      } catch (error) {
        console.error("Erro ao excluir substituição:", error);
        toast.error("Erro ao excluir substituição");
      }
    }
  };

  const getMassTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      dominical: 'Dominical',
      semanal: 'Semanal',
      especial: 'Especial',
      outro: 'Outro',
    };
    return types[type] || type;
  };

  const getMassTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      dominical: 'bg-primary',
      semanal: 'bg-accent',
      especial: 'bg-golden',
      outro: 'bg-secondary',
    };
    return colors[type] || 'bg-muted';
  };

  const getPsalmMelodyForDate = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('Data inválida fornecida para getPsalmMelodyForDate');
        return undefined;
      }
      
      const dateStr = format(date, 'yyyy-MM-dd');
      return psalmMelodies.find(m => m.date === dateStr);
    } catch (error) {
      console.error('Erro ao buscar melodia do salmo:', error);
      return undefined;
    }
  };
  
  const getValidDateString = (date: Date): string | null => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return null;
      }
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return null;
    }
  };

  const getAllCommunities = () => {
    const communities = new Set<string>();
    musicianSchedules.forEach(s => {
      if (s.override) {
        communities.add(s.override.community);
      } else {
        communities.add(s.recurringSchedule.community);
      }
    });
    salmistSchedules.forEach(s => {
      if (s.override) {
        communities.add(s.override.community);
      } else {
        communities.add(s.recurringSalmistSchedule.community);
      }
    });
    return Array.from(communities).sort();
  };

  const filteredMusicianSchedules = communityFilter === 'all' 
    ? musicianSchedules 
    : musicianSchedules.filter(s => {
        const community = s.override ? s.override.community : s.recurringSchedule.community;
        return community === communityFilter;
      });

  const filteredSalmistSchedules = communityFilter === 'all'
    ? salmistSchedules
    : salmistSchedules.filter(s => {
        const community = s.override ? s.override.community : s.recurringSalmistSchedule.community;
        return community === communityFilter;
      });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Escalas</h1>
          <p className="text-muted-foreground">
            Gerencie escalas fixas e substituições mensais
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'musicos' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('musicos')}
            >
              <Users className="w-4 h-4 mr-2" />
              Músicos
            </Button>
            <Button
              variant={viewMode === 'salmistas' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('salmistas')}
            >
              <Music className="w-4 h-4 mr-2" />
              Salmistas
            </Button>
          </div>
          <Button 
            onClick={() => viewMode === 'musicos' ? handleOpenDialog('new') : handleOpenSalmistDialog('new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Escala Fixa
          </Button>
        </div>
      </div>

      {/* Navegação de Mês */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-semibold capitalize">{getMonthName()}</h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Filtro de Comunidade */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium">Filtrar por comunidade:</Label>
          <Select value={communityFilter} onValueChange={setCommunityFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as comunidades</SelectItem>
              {getAllCommunities().map(community => (
                <SelectItem key={community} value={community}>
                  {community}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Escalas de Músicos */}
      {viewMode === 'musicos' && (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredMusicianSchedules.map((generated) => {
            const displayData = generated.isOverride && generated.override
              ? {
                  time: generated.override.time,
                  type: generated.override.type,
                  community: generated.override.community,
                  musicians: generated.override.musicians,
                  observations: generated.override.observations,
                }
              : {
                  time: generated.recurringSchedule.time,
                  type: generated.recurringSchedule.type,
                  community: generated.recurringSchedule.community,
                  musicians: generated.recurringSchedule.musicians,
                  observations: generated.recurringSchedule.observations,
                };

            return (
              <Card key={`${generated.recurringSchedule.id}-${getValidDateString(generated.date) || 'invalid'}`} className="hover-lift">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getMassTypeColor(displayData.type)}`}>
                          {getMassTypeLabel(displayData.type)}
                        </span>
                        {generated.isOverride ? (
                          <Badge variant="outline" className="text-xs">
                            Substituição - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM', { locale: ptBR })}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Fixa
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {format(generated.date, "dd 'de' MMMM", { locale: ptBR })}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getWeekLabel(generated.recurringSchedule.weekOfMonth)} {getDayOfWeekLabel(generated.recurringSchedule.dayOfWeek)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {generated.isOverride ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog('edit-override', generated)}
                            title="Editar substituição"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => generated.override && handleDeleteOverride(generated.override)}
                            title="Excluir substituição"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog('create-override', generated)}
                            title="Criar substituição para este mês"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog('edit-recurring', generated)}
                            title="Editar escala fixa"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteRecurringSchedule(generated.recurringSchedule)}
                            title="Excluir escala fixa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{displayData.time}</span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Comunidade: </span>
                    <span className="text-muted-foreground">{displayData.community}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Music className="w-4 h-4" />
                      <span>Coral:</span>
                    </div>
                    <div className="space-y-1">
                      {displayData.musicians.map((musician, idx) => (
                        <div
                          key={idx}
                          className="text-sm bg-muted/50 px-3 py-2 rounded"
                        >
                          <span className="font-medium">{musician.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {displayData.observations && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        {displayData.observations}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lista de Escalas de Salmistas */}
      {viewMode === 'salmistas' && (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredSalmistSchedules.map((generated) => {
            const displayData = generated.isOverride && generated.override
              ? {
                  time: generated.override.time,
                  community: generated.override.community,
                  psalmist: generated.override.psalmist,
                  observations: generated.override.observations,
                }
              : {
                  time: generated.recurringSalmistSchedule.time,
                  community: generated.recurringSalmistSchedule.community,
                  psalmist: generated.recurringSalmistSchedule.psalmist,
                  observations: generated.recurringSalmistSchedule.observations,
                };

            return (
              <Card key={`${generated.recurringSalmistSchedule.id}-${getValidDateString(generated.date) || 'invalid'}`} className="hover-lift">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {generated.isOverride ? (
                          <Badge variant="outline" className="text-xs">
                            Substituição - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM', { locale: ptBR })}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Fixa
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {format(generated.date, "dd 'de' MMMM", { locale: ptBR })}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getWeekLabel(generated.recurringSalmistSchedule.weekOfMonth)} {getDayOfWeekLabel(generated.recurringSalmistSchedule.dayOfWeek)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {generated.isOverride ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenSalmistDialog('edit-override', generated)}
                            title="Editar substituição"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => generated.override && handleDeleteSalmistOverride(generated.override)}
                            title="Excluir substituição"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenSalmistDialog('create-override', generated)}
                            title="Criar substituição para este mês"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenSalmistDialog('edit-recurring', generated)}
                            title="Editar escala fixa"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteRecurringSalmist(generated.recurringSalmistSchedule)}
                            title="Excluir escala fixa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{displayData.time}</span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Comunidade: </span>
                    <span className="text-muted-foreground">{displayData.community}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Music className="w-4 h-4" />
                      <span>Salmista:</span>
                    </div>
                    <div className="text-sm bg-muted/50 px-3 py-2 rounded">
                      <span className="font-medium">{displayData.psalmist}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    {(() => {
                      const dateStr = getValidDateString(generated.date);
                      if (!dateStr) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            Data inválida para carregar liturgia
                          </p>
                        );
                      }
                      return (
                        <Link
                          to={`/liturgia?date=${dateStr}`}
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <BookOpen className="w-4 h-4" />
                          Ver liturgia e melodia sugerida →
                        </Link>
                      );
                    })()}
                  </div>

                  {displayData.observations && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        {displayData.observations}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'musicos' && filteredMusicianSchedules.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nenhuma escala encontrada para este mês</p>
          <Button onClick={() => handleOpenDialog('new')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Nova Escala Fixa
          </Button>
        </Card>
      )}

      {viewMode === 'salmistas' && filteredSalmistSchedules.length === 0 && (
        <Card className="p-12 text-center">
          <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nenhuma escala de salmista encontrada para este mês</p>
          <Button onClick={() => handleOpenSalmistDialog('new')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Nova Escala Fixa de Salmista
          </Button>
        </Card>
      )}

      {/* Dialog para Músicos */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'new' && 'Nova Escala Fixa de Músicos'}
              {dialogMode === 'edit-recurring' && 'Editar Escala Fixa'}
              {dialogMode === 'create-override' && 'Criar Substituição'}
              {dialogMode === 'edit-override' && 'Editar Substituição'}
            </DialogTitle>
            <DialogDescription>
              {(dialogMode === 'new' || dialogMode === 'edit-recurring') && 'Configure a escala que se repetirá todo mês'}
              {(dialogMode === 'create-override' || dialogMode === 'edit-override') && `Substituição apenas para ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM/yyyy', { locale: ptBR })}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(dialogMode === 'new' || dialogMode === 'edit-recurring') ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Qual semana do mês?</Label>
                    <Select 
                      value={String(formData.weekOfMonth)} 
                      onValueChange={(v) => setFormData({...formData, weekOfMonth: Number(v) as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º</SelectItem>
                        <SelectItem value="2">2º</SelectItem>
                        <SelectItem value="3">3º</SelectItem>
                        <SelectItem value="4">4º</SelectItem>
                        <SelectItem value="5">5º</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dia da semana</Label>
                    <Select 
                      value={String(formData.dayOfWeek)} 
                      onValueChange={(v) => setFormData({...formData, dayOfWeek: Number(v) as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Domingo</SelectItem>
                        <SelectItem value="1">Segunda-feira</SelectItem>
                        <SelectItem value="2">Terça-feira</SelectItem>
                        <SelectItem value="3">Quarta-feira</SelectItem>
                        <SelectItem value="4">Quinta-feira</SelectItem>
                        <SelectItem value="5">Sexta-feira</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mês de início</Label>
                  <Input
                    type="month"
                    value={formData.startMonth}
                    onChange={(e) => setFormData({...formData, startMonth: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Missa</Label>
                    <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dominical">Dominical</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="especial">Especial</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Comunidade</Label>
                  <Input
                    value={formData.community}
                    onChange={(e) => setFormData({...formData, community: e.target.value})}
                    placeholder="Ex: Matriz, São José, etc."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={overrideFormData.time}
                      onChange={(e) => setOverrideFormData({...overrideFormData, time: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Missa</Label>
                    <Select value={overrideFormData.type} onValueChange={(v: any) => setOverrideFormData({...overrideFormData, type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dominical">Dominical</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="especial">Especial</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Comunidade</Label>
                  <Input
                    value={overrideFormData.community}
                    onChange={(e) => setOverrideFormData({...overrideFormData, community: e.target.value})}
                    placeholder="Ex: Matriz, São José, etc."
                  />
                </div>
              </>
            )}

            {/* Coral */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Coral</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddMusician}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {musicians.map((musician, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Nome do coral"
                      value={musician.name}
                      onChange={(e) => handleMusicianChange(idx, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveMusician(idx)}
                      disabled={musicians.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={(dialogMode === 'new' || dialogMode === 'edit-recurring') ? formData.observations : overrideFormData.observations}
                onChange={(e) => {
                  if (dialogMode === 'new' || dialogMode === 'edit-recurring') {
                    setFormData({...formData, observations: e.target.value});
                  } else {
                    setOverrideFormData({...overrideFormData, observations: e.target.value});
                  }
                }}
                placeholder="Observações adicionais (opcional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSchedule}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Salmistas */}
      <Dialog open={salmistDialogOpen} onOpenChange={setSalmistDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'new' && 'Nova Escala Fixa de Salmista'}
              {dialogMode === 'edit-recurring' && 'Editar Escala Fixa de Salmista'}
              {dialogMode === 'create-override' && 'Criar Substituição de Salmista'}
              {dialogMode === 'edit-override' && 'Editar Substituição de Salmista'}
            </DialogTitle>
            <DialogDescription>
              {(dialogMode === 'new' || dialogMode === 'edit-recurring') && 'Configure a escala que se repetirá todo mês'}
              {(dialogMode === 'create-override' || dialogMode === 'edit-override') && `Substituição apenas para ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM/yyyy', { locale: ptBR })}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(dialogMode === 'new' || dialogMode === 'edit-recurring') ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Qual semana do mês?</Label>
                    <Select 
                      value={String(salmistFormData.weekOfMonth)} 
                      onValueChange={(v) => setSalmistFormData({...salmistFormData, weekOfMonth: Number(v) as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º</SelectItem>
                        <SelectItem value="2">2º</SelectItem>
                        <SelectItem value="3">3º</SelectItem>
                        <SelectItem value="4">4º</SelectItem>
                        <SelectItem value="5">5º</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dia da semana</Label>
                    <Select 
                      value={String(salmistFormData.dayOfWeek)} 
                      onValueChange={(v) => setSalmistFormData({...salmistFormData, dayOfWeek: Number(v) as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Domingo</SelectItem>
                        <SelectItem value="1">Segunda-feira</SelectItem>
                        <SelectItem value="2">Terça-feira</SelectItem>
                        <SelectItem value="3">Quarta-feira</SelectItem>
                        <SelectItem value="4">Quinta-feira</SelectItem>
                        <SelectItem value="5">Sexta-feira</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mês de início</Label>
                  <Input
                    type="month"
                    value={salmistFormData.startMonth}
                    onChange={(e) => setSalmistFormData({...salmistFormData, startMonth: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={salmistFormData.time}
                      onChange={(e) => setSalmistFormData({...salmistFormData, time: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Comunidade</Label>
                    <Input
                      value={salmistFormData.community}
                      onChange={(e) => setSalmistFormData({...salmistFormData, community: e.target.value})}
                      placeholder="Ex: Matriz, São José, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Salmista</Label>
                  <Input
                    value={salmistFormData.psalmist}
                    onChange={(e) => setSalmistFormData({...salmistFormData, psalmist: e.target.value})}
                    placeholder="Nome do salmista"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={salmistOverrideFormData.time}
                      onChange={(e) => setSalmistOverrideFormData({...salmistOverrideFormData, time: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Comunidade</Label>
                    <Input
                      value={salmistOverrideFormData.community}
                      onChange={(e) => setSalmistOverrideFormData({...salmistOverrideFormData, community: e.target.value})}
                      placeholder="Ex: Matriz, São José, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Salmista</Label>
                  <Input
                    value={salmistOverrideFormData.psalmist}
                    onChange={(e) => setSalmistOverrideFormData({...salmistOverrideFormData, psalmist: e.target.value})}
                    placeholder="Nome do salmista"
                  />
                </div>
              </>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={(dialogMode === 'new' || dialogMode === 'edit-recurring') ? salmistFormData.observations : salmistOverrideFormData.observations}
                onChange={(e) => {
                  if (dialogMode === 'new' || dialogMode === 'edit-recurring') {
                    setSalmistFormData({...salmistFormData, observations: e.target.value});
                  } else {
                    setSalmistOverrideFormData({...salmistOverrideFormData, observations: e.target.value});
                  }
                }}
                placeholder="Observações adicionais (opcional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSalmistDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSalmistSchedule}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Escalas;
