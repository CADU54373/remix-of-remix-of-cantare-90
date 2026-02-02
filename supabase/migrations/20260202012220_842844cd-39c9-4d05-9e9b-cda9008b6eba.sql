-- 1) Ensure new users always get a profile + default role, and capture parish_id from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_parish_id uuid;
BEGIN
  -- Try to read parish_id from auth user metadata (set at signup)
  BEGIN
    v_parish_id := NULLIF(NEW.raw_user_meta_data->>'parish_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_parish_id := NULL;
  END;

  -- Create profile with pending status
  INSERT INTO public.user_profiles (id, email, approval_status, parish_id)
  VALUES (NEW.id, NEW.email, 'pending', v_parish_id)
  ON CONFLICT (id) DO NOTHING;

  -- Add default 'user' role (can be overridden later)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2) Trigger: when an auth user is created, create profile/role in public schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- 3) Trigger: auto-assign super admin role/approval if the inserted profile email matches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_user_profile_created'
      AND n.nspname = 'public'
      AND c.relname = 'user_profiles'
  ) THEN
    CREATE TRIGGER on_user_profile_created
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_super_admin_assignment();
  END IF;
END;
$$;
