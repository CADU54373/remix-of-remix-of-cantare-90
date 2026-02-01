-- Inserir paróquia padrão se não existir
INSERT INTO public.parishes (id, name, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Nossa Senhora Aparecida', now())
ON CONFLICT (id) DO NOTHING;

-- Criar função para verificar se é super_admin por email
CREATE OR REPLACE FUNCTION public.is_super_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _email = 'carlosedduardo239@gmail.com';
$$;

-- Criar função para auto-atribuir super_admin role ao email específico
CREATE OR REPLACE FUNCTION public.handle_super_admin_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o email for do super admin, atribuir role de super_admin
  IF NEW.email = 'carlosedduardo239@gmail.com' THEN
    -- Atualizar para approved automaticamente
    UPDATE public.user_profiles 
    SET approval_status = 'approved', approved_at = now()
    WHERE id = NEW.id;
    
    -- Remover role de user e adicionar super_admin
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar após insert em user_profiles
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_super_admin_assignment();

-- Atualizar políticas de user_profiles para permitir que padres vejam e atualizem usuários pendentes da sua paróquia
-- Primeiro, dropar as políticas existentes de padres
DROP POLICY IF EXISTS "Priests can view profiles of their parish" ON public.user_profiles;
DROP POLICY IF EXISTS "Priests can update profiles of their parish" ON public.user_profiles;

-- Criar política para padres verem TODOS os perfis (pendentes, aprovados, rejeitados) da sua paróquia
CREATE POLICY "Priests can view profiles of their parish"
ON public.user_profiles
FOR SELECT
USING (
  is_priest(auth.uid()) AND 
  parish_id = get_user_parish_id(auth.uid())
);

-- Criar política para padres atualizarem perfis da sua paróquia (aprovar/rejeitar)
CREATE POLICY "Priests can update profiles of their parish"
ON public.user_profiles
FOR UPDATE
USING (
  is_priest(auth.uid()) AND 
  parish_id = get_user_parish_id(auth.uid())
);