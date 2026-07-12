
-- Enums
CREATE TYPE public.fuel_type AS ENUM ('Petrol','Diesel');
CREATE TYPE public.bs_standard AS ENUM ('BS4','BS6');
CREATE TYPE public.reminder_kind AS ENUM ('oil_change','service','puc','insurance','battery','tyres','air_filter','brake');

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  fuel_type public.fuel_type NOT NULL,
  bs_standard public.bs_standard NOT NULL,
  engine_oil_grade TEXT,
  registration_number TEXT NOT NULL,
  odometer INTEGER NOT NULL DEFAULT 0,
  puc_number TEXT,
  puc_expiry DATE,
  insurance_provider TEXT,
  insurance_expiry DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vehicles" ON public.vehicles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service history
CREATE TABLE public.service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  service_date DATE NOT NULL,
  odometer INTEGER NOT NULL,
  parts_replaced TEXT,
  service_center TEXT,
  labour_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_history TO authenticated;
GRANT ALL ON public.service_history TO service_role;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own service_history" ON public.service_history FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.service_history (vehicle_id, service_date DESC);

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  symptom TEXT NOT NULL,
  description TEXT,
  ai_causes TEXT,
  ai_recommendation TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own complaints" ON public.complaints FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind public.reminder_kind NOT NULL,
  title TEXT NOT NULL,
  due_date DATE,
  due_odometer INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders" ON public.reminders FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER vehicles_touch BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
