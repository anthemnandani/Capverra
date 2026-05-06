-- ═══════════════════════════════════════════════════════════════════════════════
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste ALL → Run
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Create table
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  client_id   UUID,
  phone       TEXT,
  avatar_url  TEXT,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  appearance_settings      JSONB DEFAULT '{}'::jsonb,
  last_login  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_select_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile"  ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own_profile"  ON public.users;
DROP POLICY IF EXISTS "admins_can_select_all_users"   ON public.users;

CREATE POLICY "users_can_select_own_profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "admins_can_select_all_users" ON public.users
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- STEP 3: Trigger — auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- STEP 5: Backfill all existing auth users
INSERT INTO public.users (id, email, name, role)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1)
  ),
  'client'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- STEP 6: Indexes
CREATE INDEX IF NOT EXISTS idx_users_role  ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- VERIFY: Should return your existing users
SELECT id, email, name, role, created_at FROM public.users;