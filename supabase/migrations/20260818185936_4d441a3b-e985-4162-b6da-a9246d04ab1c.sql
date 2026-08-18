ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS lembrete_auto boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lembrete_antecedencia integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS lembrete_mensagem text NOT NULL DEFAULT 'Olá {nome}, não se esqueça do seu horário marcado hoje às {hora}!';

CREATE POLICY "Admins delete clientes" ON public.clientes
  FOR DELETE
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role));