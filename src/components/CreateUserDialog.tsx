import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Loader2 } from "lucide-react";

interface Parish {
  id: string;
  name: string;
}

interface CreateUserDialogProps {
  parishes: Parish[] | undefined;
}

const CreateUserDialog = ({ parishes }: CreateUserDialogProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedParish, setSelectedParish] = useState("");
  const [selectedRole, setSelectedRole] = useState<'admin' | 'priest' | 'user'>('user');

  const createUserMutation = useMutation({
    mutationFn: async () => {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Você precisa estar autenticado");

      // Call the edge function to create user
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          parishId: selectedParish,
          role: selectedRole
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar usuário");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['parish-user-counts'] });
      toast({ 
        title: "Usuário criado!", 
        description: `O usuário ${email} foi cadastrado com sucesso e já está aprovado.` 
      });
      resetForm();
      setOpen(false);
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      toast({ 
        title: "Erro ao criar usuário", 
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setSelectedParish("");
    setSelectedRole('user');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedParish) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar o usuário.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive"
      });
      return;
    }
    createUserMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Criar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Cadastre um novo usuário já aprovado no sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">Senha</Label>
            <Input
              id="create-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-parish">Paróquia</Label>
            <Select value={selectedParish} onValueChange={setSelectedParish}>
              <SelectTrigger id="create-parish">
                <SelectValue placeholder="Selecione uma paróquia" />
              </SelectTrigger>
              <SelectContent>
                {parishes?.map((parish) => (
                  <SelectItem key={parish.id} value={parish.id}>
                    {parish.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-role">Cargo</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'admin' | 'priest' | 'user')}>
              <SelectTrigger id="create-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="priest">Padre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={createUserMutation.isPending}
              className="w-full"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
