-- Link clientes to auth user
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);

-- Public read policies for booking site
CREATE POLICY "Public can view barbearias"
  ON public.barbearias FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can view active servicos"
  ON public.servicos FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "Public can view active barbeiros"
  ON public.barbeiros FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "Public can view bloqueios"
  ON public.barbeiro_bloqueios FOR SELECT
  TO anon, authenticated
  USING (true);

-- Function to expose only busy slots (no PII)
CREATE OR REPLACE FUNCTION public.get_busy_slots(_barbeiro_id uuid, _data date)
RETURNS TABLE(hora time, duracao integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.hora, a.duracao FROM public.agendamentos a
  WHERE a.barbeiro_id = _barbeiro_id
    AND a.data = _data
    AND a.status IN ('confirmado', 'concluido');
$$;

GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date) TO anon, authenticated;

-- Clientes self-management
CREATE POLICY "Cliente insert own record"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cliente view own record"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Cliente update own record"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Agendamentos: cliente can create on their own behalf
CREATE POLICY "Cliente insert own agendamento"
  ON public.agendamentos FOR INSERT
  TO authenticated
  WITH CHECK (
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
  );

CREATE POLICY "Cliente view own agendamentos"
  ON public.agendamentos FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
  );

CREATE POLICY "Cliente cancel own agendamento"
  ON public.agendamentos FOR UPDATE
  TO authenticated
  USING (
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
  );