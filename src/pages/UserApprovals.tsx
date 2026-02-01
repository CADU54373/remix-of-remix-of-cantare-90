import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface UserProfile {
  id: string;
  email: string;
  approval_status: ApprovalStatus;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
}

export default function UserApprovals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | "all">("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['user-profiles', selectedStatus, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('approval_status', selectedStatus);
      }

      if (searchQuery) {
        query = query.ilike('email', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: "Usuário aprovado!",
        description: "O usuário agora pode acessar o sistema.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar o usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: "Usuário rejeitado",
        description: "O usuário foi notificado sobre a rejeição.",
      });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar o usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleReject = (profile: UserProfile) => {
    setSelectedUser(profile);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedUser) {
      rejectMutation.mutate({ userId: selectedUser.id, reason: rejectionReason });
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pendente" },
      approved: { variant: "default" as const, icon: CheckCircle, label: "Aprovado" },
      rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejeitado" },
    };

    const { variant, icon: Icon, label } = variants[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const pendingCount = profiles?.filter(p => p.approval_status === 'pending').length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gerenciar Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Aprovar ou rejeitar novos cadastros no sistema
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ApprovalStatus | "all")}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div className="grid gap-4">
              {profiles.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{profile.email}</CardTitle>
                        <CardDescription>
                          Cadastrado há {formatDistanceToNow(new Date(profile.created_at), { 
                            addSuffix: true
                          })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(profile.approval_status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {profile.approval_status === 'pending' && (
                        <>
                          <Button
                            onClick={() => approveMutation.mutate(profile.id)}
                            disabled={approveMutation.isPending}
                            className="flex-1"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => handleReject(profile)}
                            disabled={rejectMutation.isPending}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      {profile.approval_status === 'approved' && profile.approved_at && (
                        <p className="text-sm text-muted-foreground">
                          Aprovado {formatDistanceToNow(new Date(profile.approved_at), { 
                            addSuffix: true
                          })}
                        </p>
                      )}
                      {profile.approval_status === 'rejected' && profile.rejection_reason && (
                        <div className="w-full">
                          <p className="text-sm font-medium">Motivo da rejeição:</p>
                          <p className="text-sm text-muted-foreground mt-1">{profile.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Nenhum usuário encontrado com esse email"
                  : "Nenhum usuário nessa categoria"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar cadastro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar o cadastro de <strong>{selectedUser?.email}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Motivo da rejeição (opcional)
            </label>
            <Textarea
              placeholder="Ex: Email corporativo inválido, usuário não autorizado, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
