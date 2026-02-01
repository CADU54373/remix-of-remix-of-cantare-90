import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Church, Loader2, CheckCircle, Clock } from "lucide-react";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-church-music.jpg";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email: loginEmail, password: loginPassword });
      setIsLoading(true);
      
      const { error } = await signIn(validated.email, validated.password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message === "Invalid login credentials" 
            ? "Email ou senha incorretos" 
            : error.message,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: error.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email: signupEmail, password: signupPassword });
      setIsLoading(true);
      
      const { error } = await signUp(validated.email, validated.password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: error.message === "User already registered" 
            ? "Este email já está cadastrado" 
            : error.message,
        });
      } else {
        setShowPendingMessage(true);
        setSignupEmail("");
        setSignupPassword("");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: error.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-secondary/10" />
      
      {/* Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Logo/Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-glow-pulse" />
                <div className="relative bg-primary rounded-full p-6 shadow-golden">
                  <Church className="w-12 h-12 text-primary-foreground" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground">CANTARE</h1>
            <p className="text-muted-foreground">Sistema de Gestão Musical Paroquial</p>
          </div>

          {/* Auth Card */}
          <Card className="card-liturgic p-6">
            {showPendingMessage ? (
              <Alert className="bg-primary/10 border-primary">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertTitle>Cadastro realizado com sucesso!</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Sua conta foi criada e está <strong>aguardando aprovação</strong> de um administrador.
                  </p>
                  <p className="text-sm">
                    Você receberá acesso em breve. Obrigado pela paciência!
                  </p>
                  <Button 
                    onClick={() => setShowPendingMessage(false)} 
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    Voltar para Login
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Já Tenho Conta</TabsTrigger>
                  <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full gradient-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <Alert className="mb-4">
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Após criar sua conta, você precisará aguardar a aprovação de um administrador para acessar o sistema.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full gradient-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        "Criar Conta"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </Card>

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">
              ✅ <strong>Com Conta:</strong> Adicione e gerencie músicas, melodias e escalas
            </p>
            <p className="text-sm text-muted-foreground">
              👁️ <strong>Visitante:</strong> Visualize conteúdo sem fazer login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
