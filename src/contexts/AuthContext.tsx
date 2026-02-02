import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

type UserRole = 'admin' | 'user' | 'super_admin' | 'priest';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPriest: boolean;
  userRole: UserRole | null;
  signUp: (email: string, password: string, parishId: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isPriest, setIsPriest] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      const role = data.role as UserRole;
      setUserRole(role);
      setIsAdmin(role === 'admin');
      setIsSuperAdmin(role === 'super_admin');
      setIsPriest(role === 'priest');
      return role;
    }
    setUserRole(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsPriest(false);
    return null;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Check user role
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsPriest(false);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Check user role
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, parishId: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          parish_id: parishId
        }
      }
    });

    if (!error && data.user) {
      // Atualizar o perfil com a paróquia selecionada (backup caso o trigger não capture)
      await supabase
        .from('user_profiles')
        .update({ parish_id: parishId })
        .eq('id', data.user.id);
      
      toast({
        title: "Cadastro realizado!",
        description: "Aguarde a aprovação do padre da sua paróquia.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    // Check approval status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('approval_status')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.approval_status === 'pending') {
      await supabase.auth.signOut();
      return { 
        error: { 
          message: 'Sua conta está aguardando aprovação. Você receberá acesso assim que o padre da sua paróquia aprovar seu cadastro.' 
        } 
      };
    }

    if (profile?.approval_status === 'rejected') {
      await supabase.auth.signOut();
      return { 
        error: { 
          message: 'Sua conta foi rejeitada. Entre em contato com o padre da sua paróquia para mais informações.' 
        } 
      };
    }

    // Check user role for redirection
    const role = await checkUserRole(data.user.id);

    toast({
      title: "Login realizado!",
      description: "Bem-vindo de volta.",
    });

    // Redirect based on role
    if (role === 'super_admin') {
      navigate("/super-admin");
    } else {
      navigate("/dashboard");
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsPriest(false);
    setUserRole(null);
    toast({
      title: "Logout realizado",
      description: "Até breve!",
    });
    navigate("/");
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isSuperAdmin,
        isPriest,
        userRole,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
