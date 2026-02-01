import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisitorParish } from "@/contexts/VisitorParishContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Church, Loader2, ArrowLeft } from "lucide-react";
import heroImage from "@/assets/hero-church-music.jpg";
import logoImage from "@/assets/logo-cantare.png";

interface Parish {
  id: string;
  name: string;
}

const VisitorParishSelect = () => {
  const navigate = useNavigate();
  const { setVisitorParish } = useVisitorParish();
  const [selectedParish, setSelectedParish] = useState<string>("");

  const { data: parishes, isLoading } = useQuery({
    queryKey: ['parishes-visitor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parishes')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Parish[];
    },
  });

  const handleContinue = () => {
    const parish = parishes?.find(p => p.id === selectedParish);
    if (parish) {
      setVisitorParish(parish.id, parish.name);
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-secondary/10" />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-lg w-full space-y-8">
          {/* Logo/Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={logoImage} 
                alt="CANTARE Logo" 
                className="w-24 h-24 object-contain drop-shadow-xl"
              />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">CANTARE</h1>
            <p className="text-muted-foreground">Modo Visitante</p>
          </div>

          {/* Parish Selection Card */}
          <Card className="card-liturgic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="w-5 h-5 text-primary" />
                Selecione uma Paróquia
              </CardTitle>
              <CardDescription>
                Escolha a paróquia cujas informações você deseja visualizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : parishes && parishes.length > 0 ? (
                <RadioGroup value={selectedParish} onValueChange={setSelectedParish}>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {parishes.map((parish) => (
                      <div
                        key={parish.id}
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                          selectedParish === parish.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedParish(parish.id)}
                      >
                        <RadioGroupItem value={parish.id} id={parish.id} />
                        <Label 
                          htmlFor={parish.id} 
                          className="flex-1 cursor-pointer font-medium"
                        >
                          {parish.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma paróquia cadastrada ainda.
                </p>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleContinue}
                  disabled={!selectedParish}
                  className="flex-1 gradient-primary"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            👁️ Como visitante, você pode visualizar músicas, escalas e liturgia
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisitorParishSelect;
