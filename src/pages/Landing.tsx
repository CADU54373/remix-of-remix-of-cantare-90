import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, Calendar, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-church-music.jpg";
import logoImage from "@/assets/logo-cantare.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-secondary/10" />
      
      {/* Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 animate-fade-in">
          {/* Logo principal */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
              <img 
                src={logoImage} 
                alt="CANTARE Logo" 
                className="relative w-40 h-40 object-contain drop-shadow-xl"
              />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground">
              CANTARE
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Gerencie músicas, escalas e liturgia do seu ministério paroquial
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="card-liturgic p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">Músicas</h3>
              <p className="text-sm text-muted-foreground">
                Organize PDFs em pastas por tempo litúrgico
              </p>
            </div>

            <div className="card-liturgic p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-lg">Escalas</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie escalas de músicos e celebrações
              </p>
            </div>

            <div className="card-liturgic p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-golden/10 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-golden" />
              </div>
              <h3 className="font-display font-semibold text-lg">Liturgia</h3>
              <p className="text-sm text-muted-foreground">
                Consulte leituras e adicione melodias dos salmos
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-12 py-6 gradient-primary hover:opacity-90 transition-smooth shadow-medium hover:shadow-golden"
            >
              🔐 Entrar com Login
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="text-lg px-12 py-6 border-2"
            >
              👤 Entrar como Visitante
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-xs text-muted-foreground">
            <span>Com login: acesso completo</span>
            <span className="hidden sm:inline">•</span>
            <span>Sem login: visualização e escalas</span>
          </div>

          {/* Footer */}
          <p className="text-sm text-muted-foreground pt-12">
            Acesso aberto e colaborativo para toda a comunidade
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
