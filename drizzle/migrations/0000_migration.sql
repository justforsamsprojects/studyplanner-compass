CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'aluno' CHECK (role IN ('aluno','professor')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'professor' THEN 'professor' ELSE 'aluno' END
  );
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.user_data (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_data TO authenticated;
GRANT ALL ON public.user_data TO service_role;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own data" ON public.user_data FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.teacher_subjects (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_subjects TO authenticated;
GRANT ALL ON public.teacher_subjects TO service_role;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in can read subjects" ON public.teacher_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner insert" ON public.teacher_subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update" ON public.teacher_subjects FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner delete" ON public.teacher_subjects FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.help_requests (
  id text PRIMARY KEY,
  student_id uuid NOT NULL DEFAULT auth.uid(),
  subject_code text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_requests TO authenticated;
GRANT ALL ON public.help_requests TO service_role;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_subject_code(_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_subjects WHERE code = _code AND owner_id = auth.uid())
$$;

CREATE POLICY "student or teacher read" ON public.help_requests FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.owns_subject_code(subject_code));
CREATE POLICY "student insert" ON public.help_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "student or teacher update" ON public.help_requests FOR UPDATE TO authenticated
  USING (auth.uid() = student_id OR public.owns_subject_code(subject_code));
CREATE POLICY "student delete" ON public.help_requests FOR DELETE TO authenticated
  USING (auth.uid() = student_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;