ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS forma_pagamento text,
  ADD COLUMN IF NOT EXISTS valor_extra numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS obs_pagamento text;