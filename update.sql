CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending'::text NOT NULL,
    nome_projeto TEXT NOT NULL,
    cliente TEXT,
    empresa_id UUID,
    descricao TEXT,
    tipo_estrutura JSONB,
    data_viagem DATE,
    data_montagem DATE,
    data_gravacao DATE,
    data_volta DATE,
    cidade TEXT,
    sigla_cidade TEXT,
    local_evento TEXT,
    distancia_km NUMERIC DEFAULT 0,
    valor_km NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0 NOT NULL,
    data_reprovacao TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.budget_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL UNIQUE REFERENCES public.budgets(id) ON DELETE CASCADE,
    cameras JSONB DEFAULT '[]'::jsonb,
    lentes JSONB DEFAULT '[]'::jsonb,
    aereo JSONB DEFAULT '[]'::jsonb,
    comunicacao JSONB DEFAULT '[]'::jsonb,
    movimento JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.budget_equipment
    ADD COLUMN IF NOT EXISTS lentes JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS movimento JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.budget_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL UNIQUE REFERENCES public.budgets(id) ON DELETE CASCADE,
    equipe JSONB DEFAULT '[]'::jsonb,
    verba_alimentacao NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.budget_team
    ADD COLUMN IF NOT EXISTS equipe JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS verba_alimentacao NUMERIC DEFAULT 0;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_team ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir acesso total a budgets" ON public.budgets;
    DROP POLICY IF EXISTS "Permitir acesso total a budget_equipment" ON public.budget_equipment;
    DROP POLICY IF EXISTS "Permitir acesso total a budget_team" ON public.budget_team;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Permitir acesso total a budgets" ON public.budgets FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a budget_equipment" ON public.budget_equipment FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a budget_team" ON public.budget_team FOR ALL USING (true);

-- Adding diarias column to equipment tables
ALTER TABLE public.budget_cameras ADD COLUMN IF NOT EXISTS diarias NUMERIC DEFAULT 1;
ALTER TABLE public.budget_lenses ADD COLUMN IF NOT EXISTS diarias NUMERIC DEFAULT 1;
ALTER TABLE public.budget_drones ADD COLUMN IF NOT EXISTS diarias NUMERIC DEFAULT 1;
ALTER TABLE public.budget_communication ADD COLUMN IF NOT EXISTS diarias NUMERIC DEFAULT 1;
ALTER TABLE public.budget_movement ADD COLUMN IF NOT EXISTS diarias NUMERIC DEFAULT 1;

-- Adding tax field to budgets
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS imposto_percentual NUMERIC DEFAULT 0;
