-- ============================================================
-- BarberPro — Schema Completo do Banco de Dados
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- =====================
-- 1. ENUM
-- =====================
CREATE TYPE public.app_role AS ENUM ('admin', 'barbeiro');

-- =====================
-- 2. TABELAS
-- =====================

-- Barbearias (tenants)
CREATE TABLE public.barbearias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  hora_abertura TIME DEFAULT '09:00'::TIME,
  hora_fechamento TIME DEFAULT '20:00'::TIME,
  intervalo_inicio TIME,
  intervalo_fim TIME,
  dias_funcionamento INTEGER[] DEFAULT '{1,2,3,4,5,6}'::INTEGER[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (auto-criado via trigger no signup)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY, -- referencia auth.users(id)
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  avatar_url TEXT,
  barbearia_id UUID REFERENCES public.barbearias(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- referencia auth.users(id)
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Barbeiros
CREATE TABLE public.barbeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id),
  user_id UUID, -- referencia auth.users(id)
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  comissao NUMERIC DEFAULT 40,
  ativo BOOLEAN DEFAULT true,
  hora_inicio TIME DEFAULT '09:00'::TIME,
  hora_fim TIME DEFAULT '18:00'::TIME,
  dias_folga INTEGER[] DEFAULT '{0}'::INTEGER[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Barbeiro Permissões
CREATE TABLE public.barbeiro_permissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id UUID NOT NULL UNIQUE REFERENCES public.barbeiros(id),
  ver_agenda_outros BOOLEAN DEFAULT false,
  ver_faturamento_total BOOLEAN DEFAULT false,
  editar_propria_agenda BOOLEAN DEFAULT true
);

-- Barbeiro Bloqueios
CREATE TABLE public.barbeiro_bloqueios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id UUID NOT NULL REFERENCES public.barbeiros(id),
  data DATE NOT NULL,
  dia_inteiro BOOLEAN DEFAULT true,
  hora_inicio TIME,
  hora_fim TIME,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Serviços
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id),
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL,
  duracao INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agendamentos
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id),
  barbeiro_id UUID NOT NULL REFERENCES public.barbeiros(id),
  servico_id UUID NOT NULL REFERENCES public.servicos(id),
  cliente_id UUID REFERENCES public.clientes(id),
  data DATE NOT NULL,
  hora TIME NOT NULL,
  duracao INTEGER NOT NULL,
  preco NUMERIC NOT NULL,
  status TEXT DEFAULT 'confirmado',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice único para evitar double-booking
CREATE UNIQUE INDEX idx_no_double_booking
  ON public.agendamentos (barbeiro_id, data, hora)
  WHERE status <> 'cancelado';

-- =====================
-- 3. FUNÇÕES DE SEGURANÇA
-- =====================

-- Retorna barbearia_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_barbearia_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbearia_id FROM public.profiles WHERE id = _user_id
$$;

-- Verifica se o usuário tem um papel específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Retorna o barbeiro.id a partir do user_id
CREATE OR REPLACE FUNCTION public.get_barbeiro_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.barbeiros WHERE user_id = _user_id LIMIT 1
$$;

-- Verifica permissão granular do barbeiro
CREATE OR REPLACE FUNCTION public.barbeiro_has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _permission
    WHEN 'ver_agenda_outros' THEN COALESCE(bp.ver_agenda_outros, false)
    WHEN 'ver_faturamento_total' THEN COALESCE(bp.ver_faturamento_total, false)
    WHEN 'editar_propria_agenda' THEN COALESCE(bp.editar_propria_agenda, true)
    ELSE false
  END
  FROM public.barbeiros b
  JOIN public.barbeiro_permissoes bp ON bp.barbeiro_id = b.id
  WHERE b.user_id = _user_id
$$;

-- Trigger: cria profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- 4. RLS (Row Level Security)
-- =====================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiro_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiro_bloqueios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- ---- BARBEARIAS ----
CREATE POLICY "Users see own barbearia" ON public.barbearias
  FOR SELECT USING (id = get_user_barbearia_id(auth.uid()));

CREATE POLICY "Authenticated users can create barbearia" ON public.barbearias
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins update own barbearia" ON public.barbearias
  FOR UPDATE USING (id = get_user_barbearia_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- ---- PROFILES ----
CREATE POLICY "Users see profiles in barbearia" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR barbearia_id = get_user_barbearia_id(auth.uid()));

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ---- USER_ROLES ----
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ---- BARBEIROS ----
CREATE POLICY "Users see barbeiros in barbearia" ON public.barbeiros
  FOR SELECT USING (barbearia_id = get_user_barbearia_id(auth.uid()));

CREATE POLICY "Admins insert barbeiros" ON public.barbeiros
  FOR INSERT WITH CHECK (barbearia_id = get_user_barbearia_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update barbeiros" ON public.barbeiros
  FOR UPDATE USING (barbearia_id = get_user_barbearia_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR user_id = auth.uid()));

CREATE POLICY "Admins delete barbeiros" ON public.barbeiros
  FOR DELETE USING (barbearia_id = get_user_barbearia_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- ---- BARBEIRO_PERMISSOES ----
CREATE POLICY "Users read own permissoes" ON public.barbeiro_permissoes
  FOR SELECT USING (barbeiro_id = get_barbeiro_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage permissoes" ON public.barbeiro_permissoes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM barbeiros b WHERE b.id = barbeiro_permissoes.barbeiro_id AND b.barbearia_id = get_user_barbearia_id(auth.uid()))
    AND has_role(auth.uid(), 'admin')
  );

-- ---- BARBEIRO_BLOQUEIOS ----
CREATE POLICY "Users see bloqueios in barbearia" ON public.barbeiro_bloqueios
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM barbeiros b WHERE b.id = barbeiro_bloqueios.barbeiro_id AND b.barbearia_id = get_user_barbearia_id(auth.uid()))
  );

CREATE POLICY "Barbeiros manage own bloqueios" ON public.barbeiro_bloqueios
  FOR INSERT WITH CHECK (barbeiro_id = get_barbeiro_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Barbeiros delete own bloqueios" ON public.barbeiro_bloqueios
  FOR DELETE USING (barbeiro_id = get_barbeiro_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- ---- SERVICOS ----
CREATE POLICY "Users see servicos" ON public.servicos
  FOR SELECT USING (barbearia_id = get_user_barbearia_id(auth.uid()));

CREATE POLICY "Admins insert servicos" ON public.servicos
  FOR INSERT WITH CHECK (barbearia_id = get_user_barbearia_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update servicos" ON public.servicos
  FOR UPDATE USING (barbearia_id = get_user_barbearia_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete servicos" ON public.servicos
  FOR DELETE USING (barbearia_id = get_user_barbearia_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- ---- CLIENTES ----
CREATE POLICY "Users see clientes" ON public.clientes
  FOR SELECT USING (barbearia_id = get_user_barbearia_id(auth.uid()));

CREATE POLICY "Users insert clientes" ON public.clientes
  FOR INSERT WITH CHECK (barbearia_id = get_user_barbearia_id(auth.uid()));

CREATE POLICY "Users update clientes" ON public.clientes
  FOR UPDATE USING (barbearia_id = get_user_barbearia_id(auth.uid()));

-- ---- AGENDAMENTOS ----
CREATE POLICY "Users see agendamentos" ON public.agendamentos
  FOR SELECT USING (
    barbearia_id = get_user_barbearia_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR barbeiro_id = get_barbeiro_id(auth.uid()) OR barbeiro_has_permission(auth.uid(), 'ver_agenda_outros'))
  );

CREATE POLICY "Users insert agendamentos" ON public.agendamentos
  FOR INSERT WITH CHECK (barbearia_id = get_user_barbearia_id(auth.uid()));

CREATE POLICY "Admins update agendamentos" ON public.agendamentos
  FOR UPDATE USING (
    barbearia_id = get_user_barbearia_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR barbeiro_id = get_barbeiro_id(auth.uid()))
  );

-- =====================
-- 5. REALTIME (opcional)
-- =====================
-- Descomente para habilitar realtime em tabelas específicas:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.barbeiro_bloqueios;
