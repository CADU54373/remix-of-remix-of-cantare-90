import { useState, useEffect, useRef } from "react";
import { getPsalmMelodies, addPsalmMelody, addPsalmMelodyAudioLink, deletePsalmMelodyAudioLink } from "@/lib/supabase-storage";
import { PsalmMelody, PsalmMelodyLink, PsalmMelodyAudioLink } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BookOpen, Youtube, Plus, Calendar as CalendarIcon, Sparkles, Loader2, AlertCircle, Lock, X, Music, Upload, Trash2, Play, Pause } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { parseLocalDate } from "@/lib/utils";
import { fetchLiturgia, LiturgiaResponse } from "@/lib/liturgia-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Liturgia = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const dateFromUrl = searchParams.get('date');
  
  // Validate and sanitize date from URL
  const getValidDate = (dateStr: string | null): string => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date().toISOString().split('T')[0];
    }
    return dateStr;
  };
  
  const [selectedDate, setSelectedDate] = useState(getValidDate(dateFromUrl));
  const [psalmMelodies, setPsalmMelodies] = useState<PsalmMelody[]>([]);
  const [currentMelody, setCurrentMelody] = useState<PsalmMelody | null>(null);
  const [currentSalmoIndex, setCurrentSalmoIndex] = useState(0);
  const [melodyDialogOpen, setMelodyDialogOpen] = useState(false);
  const [editingMelodies, setEditingMelodies] = useState<PsalmMelodyLink[]>([]);
  const [newMelodyUrl, setNewMelodyUrl] = useState("");
  const [newMelodyTitle, setNewMelodyTitle] = useState("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [liturgy, setLiturgy] = useState<LiturgiaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Audio states
  const [audioOpen, setAudioOpen] = useState(false);
  const [newAudioTitle, setNewAudioTitle] = useState("");
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [pendingAudios, setPendingAudios] = useState<{ title: string; file: File }[]>([]);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  // Audio player state for display
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      toast.error("Você precisa fazer login para adicionar melodias");
      return;
    }
    action();
  };

  useEffect(() => {
    refreshData();
    loadLiturgy();
  }, []);

  useEffect(() => {
    const melody = psalmMelodies.find(m => m.date === selectedDate && m.psalmIndex === currentSalmoIndex);
    console.log("🎵 Melodia atual para", selectedDate, "índice", currentSalmoIndex, ":", melody);
    if (melody) {
      console.log("🎵 Links disponíveis:", melody.youtubeLinks);
    }
    setCurrentMelody(melody || null);
  }, [selectedDate, psalmMelodies, currentSalmoIndex]);

  useEffect(() => {
    loadLiturgy();
  }, [selectedDate]);

  const loadLiturgy = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiturgia(selectedDate);
      setLiturgy(data);
    } catch (err: any) {
      const errorMessage = err?.message || 'Não foi possível carregar a liturgia do dia. Tente novamente.';
      setError(errorMessage);
      console.error('Erro ao carregar liturgia:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const melodies = await getPsalmMelodies();
      console.log("📚 Melodias carregadas do banco:", melodies);
      setPsalmMelodies(melodies);
    } catch (error) {
      console.error("Erro ao carregar melodias:", error);
      toast.error("Erro ao carregar melodias");
    }
  };

  const getYoutubeVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      return urlObj.searchParams.get('v');
    } catch {
      return null;
    }
  };

  const handleAddMelody = () => {
    if (!newMelodyUrl.trim()) {
      toast.error("Adicione um link do YouTube");
      return;
    }

    const videoId = getYoutubeVideoId(newMelodyUrl);
    if (!videoId) {
      toast.error("Link do YouTube inválido");
      return;
    }

    if (editingMelodies.length >= 3) {
      toast.error("Máximo de 3 melodias permitido");
      return;
    }

    // Verificar duplicatas
    if (editingMelodies.some(m => m.url === newMelodyUrl)) {
      toast.error("Esta melodia já foi adicionada");
      return;
    }

    setEditingMelodies([...editingMelodies, { url: newMelodyUrl, title: newMelodyTitle.trim() || `Opção ${editingMelodies.length + 1}` }]);
    setNewMelodyUrl("");
    setNewMelodyTitle("");
  };

  const handleRemoveMelody = (index: number) => {
    setEditingMelodies(editingMelodies.filter((_, i) => i !== index));
  };

  const handleSaveMelody = async () => {
    if (editingMelodies.length === 0 && pendingAudios.length === 0) {
      toast.error("Adicione pelo menos uma melodia ou áudio");
      return;
    }

    if (!liturgy?.leituras.salmo[currentSalmoIndex]) {
      toast.error("Salmo não encontrado");
      return;
    }

    setUploadingAudio(true);
    
    try {
      const salmo = liturgy.leituras.salmo[currentSalmoIndex];
      const melody: PsalmMelody = {
        date: selectedDate,
        psalmIndex: currentSalmoIndex,
        psalmText: salmo.refrao,
        psalmReference: salmo.referencia,
        youtubeLinks: editingMelodies,
        addedBy: 'Usuário Atual',
        addedAt: new Date().toISOString(),
      };

      // Save the melody first to get its ID
      const melodyId = await addPsalmMelody(melody);
      
      // Upload pending audios
      for (const audio of pendingAudios) {
        await addPsalmMelodyAudioLink({
          psalmMelodyId: melodyId,
          title: audio.title,
          audioUrl: '', // Will be set by the function
          createdBy: 'Usuário Atual',
        }, audio.file);
      }

      await refreshData();
      setEditingMelodies([]);
      setPendingAudios([]);
      setNewMelodyUrl("");
      setNewMelodyTitle("");
      setMelodyDialogOpen(false);
      
      const total = editingMelodies.length + pendingAudios.length;
      toast.success(`${total} item(s) salvo(s) com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar melodias:", error);
      toast.error("Erro ao salvar melodias");
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleOpenMelodyDialog = (salmoIndex: number) => {
    setCurrentSalmoIndex(salmoIndex);
    const melody = psalmMelodies.find(m => m.date === selectedDate && m.psalmIndex === salmoIndex);
    setEditingMelodies(melody?.youtubeLinks || []);
    setPendingAudios([]);
    setNewMelodyUrl("");
    setNewMelodyTitle("");
    setNewAudioTitle("");
    setSelectedAudioFile(null);
    setAudioOpen(false);
    setMelodyDialogOpen(true);
  };

  // Audio handling functions
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|mp4|m4a|wav|ogg)$/i)) {
      toast.error("Formato inválido. Use MP3, MP4, M4A, WAV ou OGG.");
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 50MB.");
      return;
    }
    
    setSelectedAudioFile(file);
    if (!newAudioTitle) {
      setNewAudioTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAddPendingAudio = () => {
    if (!selectedAudioFile) {
      toast.error("Selecione um arquivo de áudio");
      return;
    }
    if (!newAudioTitle.trim()) {
      toast.error("Adicione um título para o áudio");
      return;
    }
    
    setPendingAudios([...pendingAudios, { title: newAudioTitle.trim(), file: selectedAudioFile }]);
    setSelectedAudioFile(null);
    setNewAudioTitle("");
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
    toast.success("Áudio adicionado à lista");
  };

  const handleRemovePendingAudio = (index: number) => {
    setPendingAudios(pendingAudios.filter((_, i) => i !== index));
  };

  const handleDeleteExistingAudio = async (audioId: string) => {
    try {
      await deletePsalmMelodyAudioLink(audioId);
      await refreshData();
      toast.success("Áudio removido com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar áudio:", error);
      toast.error("Erro ao remover áudio");
    }
  };

  const toggleAudioPlayback = (audioId: string) => {
    const audio = audioPlayerRefs.current[audioId];
    if (!audio) return;
    
    if (playingAudioId === audioId) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      // Pause any currently playing audio
      if (playingAudioId && audioPlayerRefs.current[playingAudioId]) {
        audioPlayerRefs.current[playingAudioId].pause();
      }
      audio.play();
      setPlayingAudioId(audioId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Liturgia Diária</h1>
          <p className="text-muted-foreground">
            Leituras e salmos da celebração
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setHistoryDialogOpen(true)}
        >
          Ver Histórico
        </Button>
      </div>

      {/* Seletor de Data */}
      <Card className="p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <Label>Data:</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <span className="text-sm text-muted-foreground">
            {format(parseLocalDate(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          {liturgy && (
            <span className="text-sm font-medium text-primary ml-auto">
              {liturgy.liturgia}
            </span>
          )}
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando liturgia...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liturgia Content */}
      {!loading && !error && liturgy && (
        <>

      {/* Primeira Leitura */}
      {liturgy.leituras.primeiraLeitura.map((leitura, idx) => (
        <Card key={`primeira-${idx}`} className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <BookOpen className="w-5 h-5" />
              Primeira Leitura
            </CardTitle>
            <p className="text-sm text-muted-foreground">{leitura.referencia}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium mb-2 text-muted-foreground">{leitura.titulo}</p>
            <p className="text-base leading-relaxed whitespace-pre-line">
              {leitura.texto}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* SALMO RESPONSORIAL - DESTAQUE ESPECIAL */}
      {liturgy.leituras.salmo.map((salmo, idx) => {
        const salmoMelody = psalmMelodies.find(m => m.date === selectedDate && m.psalmIndex === idx);
        
        return (
        <Card key={`salmo-${idx}`} className="hover-lift glow-golden border-2 border-golden/30 bg-gradient-to-br from-golden/5 to-golden/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gradient-golden text-xl">
              <Sparkles className="w-6 h-6" />
              Salmo Responsorial {liturgy.leituras.salmo.length > 1 ? `(Opção ${idx + 1})` : ''}
            </CardTitle>
            <p className="text-sm font-medium text-golden">{salmo.referencia}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-card/80 rounded-lg p-4 border border-golden/20">
              <p className="text-lg font-bold mb-3 text-golden">
                {salmo.refrao}
              </p>
              <p className="text-base leading-relaxed whitespace-pre-line">
                {salmo.texto}
              </p>
            </div>

          {/* Melodias do YouTube */}
          {salmoMelody?.youtubeLinks && salmoMelody.youtubeLinks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-golden" />
                  <span className="font-medium text-sm">
                    {salmoMelody.youtubeLinks.length === 1 ? 'Melodia Sugerida' : `${salmoMelody.youtubeLinks.length} Melodias Sugeridas`}
                  </span>
                </div>
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenMelodyDialog(idx)}
                  >
                    Editar
                  </Button>
                )}
              </div>
              
              {salmoMelody.youtubeLinks.length === 1 ? (
                // Exibir única melodia diretamente
                <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-golden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(salmoMelody.youtubeLinks[0].url)}`}
                    title={salmoMelody.youtubeLinks[0].title || "Melodia do Salmo"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="border-0"
                  />
                </div>
              ) : (
                // Exibir múltiplas melodias em tabs
                <Tabs defaultValue="0" className="w-full">
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${salmoMelody.youtubeLinks.length}, 1fr)` }}>
                    {salmoMelody.youtubeLinks.map((link, linkIdx) => (
                      <TabsTrigger key={linkIdx} value={linkIdx.toString()}>
                        {link.title || `Opção ${linkIdx + 1}`}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {salmoMelody.youtubeLinks.map((link, linkIdx) => (
                    <TabsContent key={linkIdx} value={linkIdx.toString()}>
                      <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-golden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${getYoutubeVideoId(link.url)}`}
                          title={link.title || `Melodia ${linkIdx + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="border-0"
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {salmoMelody.addedBy && salmoMelody.addedAt && (
                <p className="text-xs text-muted-foreground text-center">
                  Adicionado por {salmoMelody.addedBy} em{' '}
                  {(() => {
                    try {
                      return format(new Date(salmoMelody.addedAt), "dd/MM/yyyy 'às' HH:mm");
                    } catch {
                      return 'data inválida';
                    }
                  })()}
                </p>
              )}
            </div>
          )}

          {/* Áudios Gravados */}
          {salmoMelody?.audioLinks && salmoMelody.audioLinks.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-golden/20">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-golden" />
                <span className="font-medium text-sm">
                  {salmoMelody.audioLinks.length === 1 ? 'Áudio Gravado' : `${salmoMelody.audioLinks.length} Áudios Gravados`}
                </span>
              </div>
              
              <div className="space-y-2">
                {salmoMelody.audioLinks.map((audio) => (
                  <div key={audio.id} className="flex items-center gap-3 p-3 bg-card/80 rounded-lg border border-golden/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAudioPlayback(audio.id)}
                      className="flex-shrink-0"
                    >
                      {playingAudioId === audio.id ? (
                        <Pause className="w-5 h-5 text-golden" />
                      ) : (
                        <Play className="w-5 h-5 text-golden" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{audio.title}</p>
                    </div>
                    <audio
                      ref={(el) => {
                        if (el) audioPlayerRefs.current[audio.id] = el;
                      }}
                      src={audio.audioUrl}
                      onEnded={() => setPlayingAudioId(null)}
                      className="hidden"
                    />
                    {isAuthenticated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExistingAudio(audio.id)}
                        className="flex-shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

            {(!salmoMelody?.youtubeLinks || salmoMelody.youtubeLinks.length === 0) && (!salmoMelody?.audioLinks || salmoMelody.audioLinks.length === 0) && (
              <div className="text-center py-6 border-2 border-dashed border-golden/30 rounded-lg">
                <Youtube className="w-12 h-12 mx-auto text-golden/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma melodia adicionada para este salmo
                </p>
                {isAuthenticated ? (
                  <Button 
                    onClick={() => handleOpenMelodyDialog(idx)} 
                    className="gradient-golden hover:opacity-90" 
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Melodia
                  </Button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Badge variant="secondary" className="gap-2">
                      <Lock className="w-3 h-3" />
                      Login necessário
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Faça login para adicionar melodias
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        );
      })}

      {/* Segunda Leitura */}
      {liturgy.leituras.segundaLeitura.map((leitura, idx) => (
        <Card key={`segunda-${idx}`} className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <BookOpen className="w-5 h-5" />
              Segunda Leitura
            </CardTitle>
            <p className="text-sm text-muted-foreground">{leitura.referencia}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium mb-2 text-muted-foreground">{leitura.titulo}</p>
            <p className="text-base leading-relaxed whitespace-pre-line">
              {leitura.texto}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Evangelho */}
      {liturgy.leituras.evangelho.map((evangelho, idx) => (
        <Card key={`evangelho-${idx}`} className="hover-lift border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary text-xl">
              <BookOpen className="w-6 h-6" />
              Evangelho
            </CardTitle>
            <p className="text-sm font-medium text-primary">{evangelho.referencia}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium mb-2 text-muted-foreground">{evangelho.titulo}</p>
            <p className="text-base leading-relaxed whitespace-pre-line">
              {evangelho.texto}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Fim do conteúdo de liturgia */}
      </>
      )}

      {/* Dialog Adicionar/Editar Melodias */}
      <Dialog open={melodyDialogOpen} onOpenChange={setMelodyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-golden" />
              {currentMelody?.youtubeLinks && currentMelody.youtubeLinks.length > 0 ? "Editar Melodias" : "Adicionar Melodias"}
            </DialogTitle>
            <DialogDescription>
              Adicione até 3 opções de melodias para o salmo responsorial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Lista de Melodias Adicionadas */}
            {editingMelodies.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Melodias Adicionadas ({editingMelodies.length}/3)
                </Label>
                {editingMelodies.map((melody, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1 flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-golden flex-shrink-0" />
                          {melody.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {melody.url}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMelody(idx)}
                        className="flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Adicionar Nova Melodia */}
            {editingMelodies.length < 3 && (
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-medium">Adicionar Nova Melodia</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="melody-title" className="text-sm">Título (opcional)</Label>
                  <Input
                    id="melody-title"
                    placeholder="Ex: Melodia Principal, Versão Infantil..."
                    value={newMelodyTitle}
                    onChange={(e) => setNewMelodyTitle(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para usar "Opção 1", "Opção 2", etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube-link" className="text-sm">Link do YouTube</Label>
                  <Input
                    id="youtube-link"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newMelodyUrl}
                    onChange={(e) => setNewMelodyUrl(e.target.value)}
                  />
                </div>

                <Button onClick={handleAddMelody} className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Melodia
                </Button>

                {/* Preview do link atual */}
                {newMelodyUrl && getYoutubeVideoId(newMelodyUrl) && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYoutubeVideoId(newMelodyUrl)}`}
                      title="Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="border-0"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Seção de Áudios */}
            <Collapsible open={audioOpen} onOpenChange={setAudioOpen} className="border-t pt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Áudios Gravados ({pendingAudios.length + (currentMelody?.audioLinks?.length || 0)})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {audioOpen ? 'Fechar' : 'Expandir'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Existing audios from current melody */}
                {currentMelody?.audioLinks && currentMelody.audioLinks.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Áudios Existentes</Label>
                    {currentMelody.audioLinks.map((audio) => (
                      <Card key={audio.id} className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Music className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm truncate">{audio.title}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExistingAudio(audio.id)}
                            className="flex-shrink-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pending audios to upload */}
                {pendingAudios.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Novos Áudios (a enviar)</Label>
                    {pendingAudios.map((audio, idx) => (
                      <Card key={idx} className="p-3 border-dashed">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Upload className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm truncate">{audio.title}</span>
                            <Badge variant="secondary" className="text-xs">Novo</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePendingAudio(idx)}
                            className="flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add new audio */}
                <div className="space-y-3 border-t pt-3">
                  <Label className="text-sm font-medium">Adicionar Novo Áudio</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="audio-title" className="text-sm">Título do Áudio</Label>
                    <Input
                      id="audio-title"
                      placeholder="Ex: Gravação Comunidade, Versão Coral..."
                      value={newAudioTitle}
                      onChange={(e) => setNewAudioTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audio-file" className="text-sm">Arquivo de Áudio</Label>
                    <Input
                      ref={audioInputRef}
                      id="audio-file"
                      type="file"
                      accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/m4a,.mp3,.mp4,.m4a,.wav,.ogg"
                      onChange={handleAudioFileSelect}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos: MP3, MP4, M4A, WAV, OGG. Máximo: 50MB
                    </p>
                  </div>

                  {selectedAudioFile && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">{selectedAudioFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedAudioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleAddPendingAudio} 
                    className="w-full" 
                    variant="outline"
                    disabled={!selectedAudioFile}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Áudio à Lista
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMelodyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveMelody} 
              disabled={(editingMelodies.length === 0 && pendingAudios.length === 0) || uploadingAudio}
            >
              {uploadingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Salmos</DialogTitle>
            <DialogDescription>
              Salmos com melodias adicionadas anteriormente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {psalmMelodies.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma melodia no histórico
              </p>
            )}

            {[...psalmMelodies]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((melody, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">
                        {format(parseLocalDate(melody.date), "dd/MM/yyyy")} - {melody.psalmReference}
                      </p>
                      <p className="text-sm italic text-muted-foreground mb-2">
                        {melody.psalmText}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {melody.youtubeLinks.length > 0 && (
                          <span>{melody.youtubeLinks.length} vídeo(s)</span>
                        )}
                        {melody.audioLinks && melody.audioLinks.length > 0 && (
                          <span>{melody.audioLinks.length} áudio(s)</span>
                        )}
                      </div>
                      {melody.addedBy && (
                        <p className="text-xs text-muted-foreground">
                          Por {melody.addedBy}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(melody.date);
                        setHistoryDialogOpen(false);
                      }}
                    >
                      Ver
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Liturgia;
