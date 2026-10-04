-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS
-- Migration: 20260918_field_crew_and_damage_ticketing.sql
-- Description:
--   1. Order Field Crew Assignment (In-House vs Client-Sourced)
--   2. On-Site Prop Damage Incident Ticketing & Debit Notes
--   3. Extend orders table for Labor Charges & Crew Sourcing Metadata
-- ===================================================================

-- 1. Order Field Crew Assignment Table
CREATE TABLE IF NOT EXISTS public.order_field_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  crew_type TEXT CHECK (crew_type IN ('in_house', 'client_sourced')) DEFAULT 'in_house',
  worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- for in_house
  external_name TEXT, -- for client_sourced
  external_phone TEXT,
  external_govt_id TEXT,
  daily_wage NUMERIC DEFAULT 1000,
  assigned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_field_crew_order_id ON public.order_field_crew(order_id);
CREATE INDEX IF NOT EXISTS idx_order_field_crew_worker_id ON public.order_field_crew(worker_id);

-- Enable RLS for order_field_crew
ALTER TABLE public.order_field_crew ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read order_field_crew" ON public.order_field_crew;
CREATE POLICY "Public Read order_field_crew" ON public.order_field_crew FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full Access order_field_crew" ON public.order_field_crew;
CREATE POLICY "Full Access order_field_crew" ON public.order_field_crew FOR ALL USING (true) WITH CHECK (true);


-- 2. Prop Damage Incident Tickets Table
CREATE TABLE IF NOT EXISTS public.prop_damage_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT UNIQUE NOT NULL, -- e.g. ASH-DMG-2026-001
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  prop_serialized_item_id UUID REFERENCES public.prop_serialized_items(id) ON DELETE RESTRICT,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  severity TEXT CHECK (severity IN ('Minor', 'Moderate', 'Total_Loss')) DEFAULT 'Minor',
  description TEXT NOT NULL,
  evidence_photos TEXT[] DEFAULT '{}',
  shoot_location TEXT,
  repair_or_replacement_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Pending_Review' CHECK (status IN ('Pending_Review', 'Billed_To_Client', 'Waived', 'Settled')),
  manager_notes TEXT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prop_damage_incidents_order_id ON public.prop_damage_incidents(order_id);
CREATE INDEX IF NOT EXISTS idx_prop_damage_incidents_prop_id ON public.prop_damage_incidents(prop_serialized_item_id);
CREATE INDEX IF NOT EXISTS idx_prop_damage_incidents_status ON public.prop_damage_incidents(status);

-- Enable RLS for prop_damage_incidents
ALTER TABLE public.prop_damage_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read prop_damage_incidents" ON public.prop_damage_incidents;
CREATE POLICY "Public Read prop_damage_incidents" ON public.prop_damage_incidents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full Access prop_damage_incidents" ON public.prop_damage_incidents;
CREATE POLICY "Full Access prop_damage_incidents" ON public.prop_damage_incidents FOR ALL USING (true) WITH CHECK (true);


-- 3. Extend orders table for labor charges and crew sourcing
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS crew_type TEXT DEFAULT 'in_house',
  ADD COLUMN IF NOT EXISTS total_labor_charges NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS in_house_worker_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_wage_rate NUMERIC DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS client_sourced_crew JSONB DEFAULT '[]'::jsonb;


-- 4. Enable Supabase Realtime replication on newly created tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_field_crew;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prop_damage_incidents;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;


-- 5. Create storage bucket for damage evidence photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('props-damage-evidence', 'props-damage-evidence', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Damage Evidence" ON storage.objects;
CREATE POLICY "Public Read Damage Evidence" ON storage.objects
  FOR SELECT USING (bucket_id = 'props-damage-evidence');

DROP POLICY IF EXISTS "Public Insert Damage Evidence" ON storage.objects;
CREATE POLICY "Public Insert Damage Evidence" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'props-damage-evidence');
