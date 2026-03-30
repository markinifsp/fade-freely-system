
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'barbeiro');

-- Barbearias (multi-tenant)
CREATE TABLE public.barbearias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  hora_abertura TIME DEFAULT '09:00',
  hora_fechamento TIME DEFAULT '20:00',
  intervalo_inicio TIME,
  intervalo_fim TIME,
  dias_funcionamento INTEGER[] DEFAULT '{1,2,3,4,5,6}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Barbeiros
CREATE TABLE public.barbeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  comissao NUMERIC DEFAULT 40,
  ativo BOOLEAN DEFAULT true,
  hora_inicio TIME DEFAULT '09:00',
  hora_fim TIME DEFAULT '18:00',
  dias_folga INTEGER[] DEFAULT '{0}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Barbeiro permissions
CREATE TABLE public.barbeiro_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID REFERENCES public.barbeiros(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ver_agenda_outros BOOLEAN DEFAULT false,
  ver_faturamento_total BOOLEAN DEFAULT false,
  editar_propria_agenda BOOLEAN DEFAULT true
);

-- Barbeiro schedule blocks
CREATE TABLE public.barbeiro_bloqueios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID REFERENCES public.barbeiros(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  dia_inteiro BOOLEAN DEFAULT true,
  hora_inicio TIME,
  hora_fim TIME,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Servicos
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL,
  duracao INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agendamentos
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  barbeiro_id UUID REFERENCES public.barbeiros(id) NOT NULL,
  servico_id UUID REFERENCES public.servicos(id) NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  duracao INTEGER NOT NULL,
  preco NUMERIC NOT NULL,
  status TEXT DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'cancelado', 'concluido')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiro_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiro_bloqueios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user barbearia_id
CREATE OR REPLACE FUNCTION public.get_user_barbearia_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbearia_id FROM public.profiles WHERE id = _user_id
$$;

-- Get barbeiro_id for a user
CREATE OR REPLACE FUNCTION public.get_barbeiro_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.barbeiros WHERE user_id = _user_id LIMIT 1
$$;

-- Check barbeiro permission
CREATE OR REPLACE FUNCTION public.barbeiro_has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Trigger to create profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Barbearias
CREATE POLICY "Users see own barbearia" ON public.barbearias
  FOR SELECT USING (id = public.get_user_barbearia_id(auth.uid()));

CREATE POLICY "Admins update own barbearia" ON public.barbearias
  FOR UPDATE USING (id = public.get_user_barbearia_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE POLICY "Users see profiles in barbearia" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR barbearia_id = public.get_user_barbearia_id(auth.uid()));

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- User roles
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Barbeiros
CREATE POLICY "Users see barbeiros in barbearia" ON public.barbeiros
  FOR SELECT USING (barbearia_id = public.get_user_barbearia_id(auth.uid()));

CREATE POLICY "Admins insert barbeiros" ON public.barbeiros
  FOR INSERT WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete barbeiros" ON public.barbeiros
  FOR DELETE USING (barbearia_id = public.get_user_barbearia_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update barbeiros" ON public.barbeiros
  FOR UPDATE USING (
    barbearia_id = public.get_user_barbearia_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
    )
  );

-- Barbeiro permissoes
CREATE POLICY "Admins manage permissoes" ON public.barbeiro_permissoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.barbeiros b
      WHERE b.id = barbeiro_id AND b.barbearia_id = public.get_user_barbearia_id(auth.uid())
    ) AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users read own permissoes" ON public.barbeiro_permissoes
  FOR SELECT USING (
    barbeiro_id = public.get_barbeiro_id(auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

-- Barbeiro bloqueios
CREATE POLICY "Users see bloqueios in barbearia" ON public.barbeiro_bloqueios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbeiros b
      WHERE b.id = barbeiro_id AND b.barbearia_id = public.get_user_barbearia_id(auth.uid())
    )
  );

CREATE POLICY "Barbeiros manage own bloqueios" ON public.barbeiro_bloqueios
  FOR INSERT WITH CHECK (
    barbeiro_id = public.get_barbeiro_id(auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Barbeiros delete own bloqueios" ON public.barbeiro_bloqueios
  FOR DELETE USING (
    barbeiro_id = public.get_barbeiro_id(auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

-- Servicos
CREATE POLICY "Users see servicos" ON public.servicos
  FOR SELECT USING (barbearia_id = public.get_user_barbearia_id(auth.uid()));

CREATE POLICY "Admins insert servicos" ON public.servicos
  FOR INSERT WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update servicos" ON public.servicos
  FOR UPDATE USING (barbearia_id = public.get_user_barbearia_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete servicos" ON public.servicos
  FOR DELETE USING (barbearia_id = public.get_user_barbearia_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Clientes
CREATE POLICY "Users see clientes" ON public.clientes
  FOR SELECT USING (barbearia_id = public.get_user_barbearia_id(auth.uid()));

CREATE POLICY "Users insert clientes" ON public.clientes
  FOR INSERT WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid()));

CREATE POLICY "Users update clientes" ON public.clientes
  FOR UPDATE USING (barbearia_id = public.get_user_barbearia_id(auth.uid()));

-- Agendamentos
CREATE POLICY "Users see agendamentos" ON public.agendamentos
  FOR SELECT USING (
    barbearia_id = public.get_user_barbearia_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'admin')
      OR barbeiro_id = public.get_barbeiro_id(auth.uid())
      OR public.barbeiro_has_permission(auth.uid(), 'ver_agenda_outros')
    )
  );

CREATE POLICY "Users insert agendamentos" ON public.agendamentos
  FOR INSERT WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid()));

CREATE POLICY "Admins update agendamentos" ON public.agendamentos
  FOR UPDATE USING (
    barbearia_id = public.get_user_barbearia_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'admin') OR barbeiro_id = public.get_barbeiro_id(auth.uid())
    )
  );

-- Unique constraint to prevent double booking
CREATE UNIQUE INDEX idx_no_double_booking ON public.agendamentos (barbeiro_id, data, hora)
  WHERE status != 'cancelado';
