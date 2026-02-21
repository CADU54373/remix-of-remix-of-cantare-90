import { useEffect, useState } from "react";
import { getMusicFiles, getFolders, getRecurringSchedules, getRecurringSalmistSchedules, getPsalmMelodies } from "@/lib/supabase-storage";
import { PsalmMelody } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, BookOpen, Calendar, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { fetchLiturgia } from "@/lib/liturgia-api";
import { useAuth } from "@/contexts/AuthContext";
import { useVisitorParish } from "@/contexts/VisitorParishContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, parishId } = useAuth();
  const { visitorParishId, isVisitor } = useVisitorParish();
  const effectiveParishId = isAuthenticated ? parishId : visitorParishId;
  const [loading, setLoading] = useState(true);
  const [todayPsalm, setTodayPsalm] = useState<PsalmMelody | null>(null);
  const [liturgyColor, setLiturgyColor] = useState<string>("");
  const [liturgyName, setLiturgyName] = useState<string>("");
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalRecurringSchedules: 0,
    totalSalmistSchedules: 0,
    totalFolders: 0,
    totalMelodies: 0,
  });

  useEffect(() => {
    loadData();
  }, [effectiveParishId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const pid = effectiveParishId || undefined;
      
      const [files, folders, schedules, salmistSchedules, melodies, liturgy] = await Promise.all([
        getMusicFiles(pid),
        getFolders(pid),
        getRecurringSchedules(pid),
        getRecurringSalmistSchedules(pid),
        getPsalmMelodies(pid),
        fetchLiturgia(today).catch(() => null),
      ]);

      const psalm = melodies.find(m => m.date === today);
      setTodayPsalm(psalm || null);

      if (liturgy) {
        setLiturgyColor(liturgy.cor);
        setLiturgyName(liturgy.liturgia);
      }

      setStats({
        totalFiles: files.length,
        totalRecurringSchedules: schedules.length,
        totalSalmistSchedules: salmistSchedules.length,
        totalFolders: folders.length,
        totalMelodies: melodies.length,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Bem-vindo ao CANTARE</h1>
        <p className="text-muted-foreground text-sm md:text-lg">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Músicas
            </CardTitle>
            <Music className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              em {stats.totalFolders} pastas
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Escalas de Músicos
            </CardTitle>
            <Calendar className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRecurringSchedules}</div>
            <p className="text-xs text-muted-foreground mt-1">escalas recorrentes</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Escalas de Salmistas
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSalmistSchedules}</div>
            <p className="text-xs text-muted-foreground mt-1">escalas recorrentes</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Melodias Cadastradas
            </CardTitle>
            <BookOpen className="w-4 h-4 text-golden" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMelodies}</div>
            <p className="text-xs text-muted-foreground mt-1">salmos salvos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="hover-lift glow-golden border-golden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient-golden">
            <BookOpen className="w-5 h-5" />
            Liturgia de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {liturgyName && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{liturgyName}</p>
              {liturgyColor && (
                <p className="text-sm text-muted-foreground">
                  Cor litúrgica: <span className="font-medium">{liturgyColor}</span>
                </p>
              )}
            </div>
          )}
          
          {todayPsalm ? (
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Salmo: {todayPsalm.psalmReference}
              </p>
              <p className="text-base italic mb-2">{todayPsalm.psalmText}</p>
              {todayPsalm.youtubeLinks.length > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400">✓ {todayPsalm.youtubeLinks.length} melodia(s) disponível(is)</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma melodia cadastrada para hoje</p>
          )}
          
          <Button onClick={() => navigate("/liturgia")} variant="outline" size="sm" className="w-full">
            Ver liturgia completa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
