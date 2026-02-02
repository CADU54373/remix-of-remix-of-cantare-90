import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Church, Users, Shield, Plus, Trash2, UserCog, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CreateUserDialog from "@/components/CreateUserDialog";

interface Parish {
  id: string;
  name: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  approval_status: string;
  parish_id: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'super_admin' | 'priest';
}

export default function SuperAdmin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newParishName, setNewParishName] = useState("");
  const [newParishDialogOpen, setNewParishDialogOpen] = useState(false);
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'priest' | 'user'>('user');
  const [selectedParish, setSelectedParish] = useState<string>("");
  const [expandedParishes, setExpandedParishes] = useState<Set<string>>(new Set());

  // Buscar paróquias
  const { data: parishes, isLoading: loadingParishes } = useQuery({
    queryKey: ['parishes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parishes')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Parish[];
    },
  });

  // Buscar todos os usuários aprovados
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('email');
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Buscar roles de usuários
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      return data as UserRole[];
    },
  });

  // Criar paróquia
  const createParishMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('parishes')
        .insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parishes'] });
      toast({ title: "Paróquia criada!", description: "A nova paróquia foi cadastrada com sucesso." });
      setNewParishName("");
      setNewParishDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar a paróquia.", variant: "destructive" });
    },
  });

  // Deletar paróquia
  const deleteParishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parishes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parishes'] });
      toast({ title: "Paróquia removida!", description: "A paróquia foi excluída com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível remover a paróquia.", variant: "destructive" });
    },
  });

  // Atribuir role e paróquia ao usuário
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role, parishId }: { userId: string; role: 'admin' | 'priest' | 'user'; parishId: string }) => {
      // Atualizar paróquia do usuário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ parish_id: parishId, approval_status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', userId);
      if (profileError) throw profileError;

      // Remover roles existentes
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (deleteError) throw deleteError;

      // Adicionar nova role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({ title: "Usuário atualizado!", description: "Role e paróquia atribuídos com sucesso." });
      setAssignRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('Error assigning role:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar o usuário.", variant: "destructive" });
    },
  });

  // Deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({ title: "Usuário excluído!", description: "O usuário foi removido com sucesso." });
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      toast({ title: "Erro", description: error.message || "Não foi possível excluir o usuário.", variant: "destructive" });
    },
  });

  const getUserRole = (userId: string) => {
    const role = userRoles?.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const getParishName = (parishId: string | null) => {
    if (!parishId) return 'Sem paróquia';
    const parish = parishes?.find(p => p.id === parishId);
    return parish?.name || 'Desconhecida';
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      super_admin: { variant: "destructive", label: "Super Admin" },
      admin: { variant: "default", label: "Admin" },
      priest: { variant: "secondary", label: "Padre" },
      user: { variant: "outline", label: "Usuário" },
    };
    const { variant, label } = variants[role] || variants.user;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getUserCountForParish = (parishId: string) => {
    return users?.filter(u => u.parish_id === parishId).length || 0;
  };

  const getUsersForParish = (parishId: string) => {
    return users?.filter(u => u.parish_id === parishId) || [];
  };

  const toggleParishExpanded = (parishId: string) => {
    const newExpanded = new Set(expandedParishes);
    if (newExpanded.has(parishId)) {
      newExpanded.delete(parishId);
    } else {
      newExpanded.add(parishId);
    }
    setExpandedParishes(newExpanded);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Painel Super Admin</h1>
              <p className="text-sm text-muted-foreground">Gerenciamento do Sistema</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="parishes">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parishes" className="gap-2">
              <Church className="h-4 w-4" />
              Paróquias
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>

          {/* Tab Paróquias */}
          <TabsContent value="parishes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Paróquias Cadastradas</h2>
              <Dialog open={newParishDialogOpen} onOpenChange={setNewParishDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Paróquia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Paróquia</DialogTitle>
                    <DialogDescription>
                      Informe o nome da nova paróquia a ser cadastrada no sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="parish-name">Nome da Paróquia</Label>
                      <Input
                        id="parish-name"
                        placeholder="Ex: Nossa Senhora Aparecida"
                        value={newParishName}
                        onChange={(e) => setNewParishName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => createParishMutation.mutate(newParishName)}
                      disabled={!newParishName.trim() || createParishMutation.isPending}
                    >
                      Cadastrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingParishes ? (
              <p className="text-muted-foreground">Carregando paróquias...</p>
            ) : parishes && parishes.length > 0 ? (
              <div className="grid gap-4">
                {parishes.map((parish) => {
                  const userCount = getUserCountForParish(parish.id);
                  const parishUsers = getUsersForParish(parish.id);
                  const isExpanded = expandedParishes.has(parish.id);
                  
                  return (
                    <Card key={parish.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-3">
                          <Church className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg font-medium">
                              {parish.name}
                            </CardTitle>
                            <CardDescription>
                              Cadastrada em {new Date(parish.created_at).toLocaleDateString('pt-BR')}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            <Users className="h-3 w-3 mr-1" />
                            {userCount} {userCount === 1 ? 'usuário' : 'usuários'}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleParishExpanded(parish.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir paróquia?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a paróquia "{parish.name}"? 
                                  Esta ação não pode ser desfeita e removerá todos os dados associados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteParishMutation.mutate(parish.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-3">Usuários desta paróquia:</h4>
                            {parishUsers.length > 0 ? (
                              <div className="space-y-2">
                                {parishUsers.map((user) => (
                                  <div 
                                    key={user.id} 
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{user.email}</span>
                                      {getRoleBadge(getUserRole(user.id))}
                                      <Badge variant={user.approval_status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                        {user.approval_status === 'approved' ? 'Aprovado' : 
                                         user.approval_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                      </Badge>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setSelectedRole(getUserRole(user.id) as 'admin' | 'priest' | 'user');
                                        setSelectedParish(user.parish_id || '');
                                        setAssignRoleDialogOpen(true);
                                      }}
                                    >
                                      <UserCog className="h-3 w-3 mr-1" />
                                      Editar
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Nenhum usuário nesta paróquia.</p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma paróquia cadastrada ainda.</p>
              </Card>
            )}
          </TabsContent>

          {/* Tab Usuários */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
              <CreateUserDialog parishes={parishes} />
            </div>

            {loadingUsers ? (
              <p className="text-muted-foreground">Carregando usuários...</p>
            ) : users && users.length > 0 ? (
              <div className="grid gap-4">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{user.email}</CardTitle>
                        <div className="flex gap-2 items-center">
                          {getRoleBadge(getUserRole(user.id))}
                          <Badge variant="outline">{getParishName(user.parish_id)}</Badge>
                          <Badge variant={user.approval_status === 'approved' ? 'default' : 'secondary'}>
                            {user.approval_status === 'approved' ? 'Aprovado' : 
                             user.approval_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={assignRoleDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setAssignRoleDialogOpen(open);
                          if (open) {
                            setSelectedUser(user);
                            setSelectedRole(getUserRole(user.id) as 'admin' | 'priest' | 'user');
                            setSelectedParish(user.parish_id || '');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <UserCog className="h-4 w-4 mr-2" />
                              Gerenciar
                            </Button>
                          </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Gerenciar Usuário</DialogTitle>
                            <DialogDescription>
                              Defina a role e a paróquia de {user.email}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Paróquia</Label>
                              <Select value={selectedParish} onValueChange={setSelectedParish}>
                                <SelectTrigger>
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
                              <Label>Role</Label>
                              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'admin' | 'priest' | 'user')}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Usuário</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="priest">Padre</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => assignRoleMutation.mutate({ 
                                userId: user.id, 
                                role: selectedRole,
                                parishId: selectedParish 
                              })}
                              disabled={!selectedParish || assignRoleMutation.isPending}
                            >
                              Salvar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o usuário "{user.email}"? 
                              Esta ação não pode ser desfeita e removerá todos os dados associados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
