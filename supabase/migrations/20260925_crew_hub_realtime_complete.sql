-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS: CREW HUB REALTIME DATABASE
-- Migration: 20260925_crew_hub_realtime_complete.sql
-- Modules Included:
--   1. Crew Members Directory & 360° Profiles (crew_members)
--   2. In-House Order Crew Assignments & Deployments (order_crew_assignments)
--   3. Client-Sourced External Crew Gate-Pass Records (order_external_crew)
--   4. Daily Attendance & Field Health Check-Ins (crew_field_logs)
--   5. Field Crew Roster Mapping (order_field_crew)
--   6. Prop Damage Incident Tickets & Debit Notes (prop_damage_incidents)
--   7. Labor Sheets & Wage Disbursement Vouchers (labor_vouchers)
--   8. Row Level Security (RLS) Permissive Policies
--   9. Realtime Publication Enablement (supabase_realtime)
--  10. Seed Data for Professional Crew Specialists
-- ===================================================================

-- 1. CREW MEMBERS DIRECTORY & PROFILES
CREATE TABLE IF NOT EXISTS public.crew_members (
  id TEXT PRIMARY KEY,
  badge_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'crew',
  designation TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'On_Shoot', 'Standby', 'Off_Duty', 'Medical_Leave')),
  daily_wage NUMERIC DEFAULT 1000,
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  skills_and_certifications JSONB DEFAULT '{}'::jsonb,
  current_deployment JSONB DEFAULT NULL,
  analytics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crew_members_badge ON public.crew_members(badge_number);
CREATE INDEX IF NOT EXISTS idx_crew_members_status ON public.crew_members(status);

-- 2. ORDER CREW ASSIGNMENTS (DAILY DEPLOYMENTS)
CREATE TABLE IF NOT EXISTS public.order_crew_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  crew_member_id TEXT REFERENCES public.crew_members(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  daily_wage NUMERIC NOT NULL DEFAULT 1000,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Replaced', 'Completed')),
  assigned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_crew_order_id ON public.order_crew_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_crew_member_id ON public.order_crew_assignments(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_order_crew_status ON public.order_crew_assignments(status);

-- 3. CLIENT SOURCED EXTERNAL CREW (GATE-PASS & LEGAL RECORDS)
CREATE TABLE IF NOT EXISTS public.order_external_crew (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_external_crew_order_id ON public.order_external_crew(order_id);

-- 4. DAILY ATTENDANCE & FIELD LOGS
CREATE TABLE IF NOT EXISTS public.crew_field_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  crew_member_id TEXT REFERENCES public.crew_members(id) ON DELETE SET NULL,
  log_type TEXT CHECK (log_type IN ('Attendance', 'Location_Ping', 'Prop_Health_Update', 'Incident')),
  location_name TEXT,
  gps_coordinates JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crew_field_logs_order_id ON public.crew_field_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_crew_field_logs_member_id ON public.crew_field_logs(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_field_logs_created_at ON public.crew_field_logs(created_at DESC);

-- 5. ORDER FIELD CREW ROSTER
CREATE TABLE IF NOT EXISTS public.order_field_crew (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  crew_type TEXT CHECK (crew_type IN ('in_house', 'client_sourced')) DEFAULT 'in_house',
  worker_id TEXT REFERENCES public.crew_members(id) ON DELETE SET NULL,
  external_name TEXT,
  external_phone TEXT,
  external_govt_id TEXT,
  daily_wage NUMERIC DEFAULT 1000,
  assigned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_field_crew_order_id ON public.order_field_crew(order_id);

-- 6. ON-SITE PROP DAMAGE INCIDENTS & DEBIT NOTES
CREATE TABLE IF NOT EXISTS public.prop_damage_incidents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  incident_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  prop_serialized_item_id TEXT,
  item_code TEXT,
  prop_title TEXT,
  prop_category TEXT,
  reported_by TEXT,
  reported_by_name TEXT,
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

CREATE INDEX IF NOT EXISTS idx_prop_damage_order_id ON public.prop_damage_incidents(order_id);
CREATE INDEX IF NOT EXISTS idx_prop_damage_status ON public.prop_damage_incidents(status);
CREATE INDEX IF NOT EXISTS idx_prop_damage_created ON public.prop_damage_incidents(created_at DESC);

-- 7. LABOR SHEETS & WAGE DISBURSEMENT VOUCHERS
CREATE TABLE IF NOT EXISTS public.labor_vouchers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  voucher_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  crew_member_id TEXT REFERENCES public.crew_members(id) ON DELETE SET NULL,
  daily_wage_rate NUMERIC NOT NULL DEFAULT 1000,
  active_shoot_days INT NOT NULL DEFAULT 1,
  total_wages_earned NUMERIC NOT NULL DEFAULT 1000,
  payment_status TEXT DEFAULT 'Pending_Disbursement' CHECK (payment_status IN ('Pending_Disbursement', 'Approved', 'Disbursed')),
  payment_ref TEXT,
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_labor_vouchers_order_id ON public.labor_vouchers(order_id);
CREATE INDEX IF NOT EXISTS idx_labor_vouchers_status ON public.labor_vouchers(payment_status);

-- 8. EXTEND ORDERS TABLE WITH LABOR SUMMARY COLUMNS
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS crew_type TEXT DEFAULT 'in_house',
  ADD COLUMN IF NOT EXISTS total_labor_charges NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS in_house_worker_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_wage_rate NUMERIC DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS client_sourced_crew JSONB DEFAULT '[]'::jsonb;

-- 9. ENABLE ROW LEVEL SECURITY (RLS) & OPEN PERMISSIVE POLICIES
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_external_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_field_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_field_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prop_damage_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_vouchers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- crew_members
  DROP POLICY IF EXISTS "Public Read crew_members" ON public.crew_members;
  CREATE POLICY "Public Read crew_members" ON public.crew_members FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Full Access crew_members" ON public.crew_members;
  CREATE POLICY "Full Access crew_members" ON public.crew_members FOR ALL USING (true) WITH CHECK (true);

  -- order_crew_assignments
  DROP POLICY IF EXISTS "Public Read order_crew_assignments" ON public.order_crew_assignments;
  CREATE POLICY "Public Read order_crew_assignments" ON public.order_crew_assignments FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Full Access order_crew_assignments" ON public.order_crew_assignments;
  CREATE POLICY "Full Access order_crew_assignments" ON public.order_crew_assignments FOR ALL USING (true) WITH CHECK (true);

  -- order_external_crew
  DROP POLICY IF EXISTS "Public Read order_external_crew" ON public.order_external_crew;
  CREATE POLICY "Public Read order_external_crew" ON public.order_external_crew FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Full Access order_external_crew" ON public.order_external_crew;
  CREATE POLICY "Full Access order_external_crew" ON public.order_external_crew FOR ALL USING (true) WITH CHECK (true);

  -- crew_field_logs
  DROP POLICY IF EXISTS "Public Read crew_field_logs" ON public.crew_field_logs;
  CREATE POLICY "Public Read crew_field_logs" ON public.crew_field_logs FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Full Access crew_field_logs" ON public.crew_field_logs;
  CREATE POLICY "Full Access crew_field_logs" ON public.crew_field_logs FOR ALL USING (true) WITH CHECK (true);

  -- order_field_crew
  DROP POLICY IF EXISTS "Public Read order_field_crew" ON public.order_field_crew;
  CREATE POLICY "Public Read order_field_crew" ON public.order_field_crew FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Full Access order_field_crew" ON public.order_field_crew;
  CREATE POLICY "Full Access order_field_crew" ON public.order_field_crew FOR ALL USING (true) WITH CHECK (true);

  -- prop_damage_incidents
  DROP POLICY IF EXISTS "Public Read prop_damage_incidents" ON public.prop_damage_incidents;
  CREATE POLICY "Public Read prop_damage_incidents" ON public.prop_damage_incidents FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Full Access prop_damage_incidents" ON public.prop_damage_incidents;
  CREATE POLICY "Full Access prop_damage_incidents" ON public.prop_damage_incidents FOR ALL USING (true) WITH CHECK (true);

  -- labor_vouchers
  DROP POLICY IF EXISTS "Public Read labor_vouchers" ON public.labor_vouchers;
  CREATE POLICY "Public Read labor_vouchers" ON public.labor_vouchers FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Full Access labor_vouchers" ON public.labor_vouchers;
  CREATE POLICY "Full Access labor_vouchers" ON public.labor_vouchers FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 10. ENABLE SUPABASE REALTIME REPLICATION (INSTANT WEBSOCKET UPDATES)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_members;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_crew_assignments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_external_crew;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_field_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_field_crew;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prop_damage_incidents;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.labor_vouchers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 11. STORAGE BUCKET FOR DAMAGE EVIDENCE PHOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('props-damage-evidence', 'props-damage-evidence', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Damage Evidence" ON storage.objects;
CREATE POLICY "Public Read Damage Evidence" ON storage.objects
  FOR SELECT USING (bucket_id = 'props-damage-evidence');

DROP POLICY IF EXISTS "Public Insert Damage Evidence" ON storage.objects;
CREATE POLICY "Public Insert Damage Evidence" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'props-damage-evidence');

-- 12. INITIAL CREW DIRECTORY SEED DATA
INSERT INTO public.crew_members (id, badge_number, full_name, role, designation, phone, email, avatar_url, status, daily_wage, emergency_contact, skills_and_certifications, current_deployment, analytics)
VALUES
(
  'cw-001',
  'ASH-CW-01',
  'Ramesh Kumar',
  'crew',
  'Senior Prop Rigging & Handling Specialist',
  '+91 98491 22334',
  'ramesh.kumar@aswamovies.com',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'On_Shoot',
  1200,
  '{"name": "K. Padma (Spouse)", "relationship": "Spouse", "phone": "+91 98491 99881"}'::jsonb,
  '{"license_type": "Heavy Commercial Vehicle (HMV) - TS-09-2018", "heavy_rigging_certified": true, "fragile_optics_handling": true, "film_industry_experience_years": 9}'::jsonb,
  '{"order_id": "a2000000-0000-0000-0000-000000000014", "order_number": "ASH-2026-ORD-014", "movie_project_name": "Pushpa 2: The Rule", "shoot_location": "Ramoji Film City, Studio Floor 14 - Rain Sequence", "start_date": "2026-09-16", "end_date": "2026-09-20"}'::jsonb,
  '{"total_shoots_completed": 38, "total_days_deployed": 142, "cumulative_lifetime_earnings": 145000, "clean_record_score": 100, "total_damage_incidents": 0, "rating": 4.95}'::jsonb
),
(
  'cw-002',
  'ASH-CW-02',
  'Suresh Varma',
  'crew',
  'Vintage Armory & Prop Weapons Technician',
  '+91 98492 33445',
  'suresh.varma@aswamovies.com',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'On_Shoot',
  1500,
  '{"name": "V. Sunitha (Spouse)", "relationship": "Spouse", "phone": "+91 98492 88776"}'::jsonb,
  '{"license_type": "Certified Movie Armorer - Guild License 2021", "heavy_rigging_certified": false, "fragile_optics_handling": true, "film_industry_experience_years": 12}'::jsonb,
  '{"order_id": "a2000000-0000-0000-0000-000000000014", "order_number": "ASH-2026-ORD-014", "movie_project_name": "Pushpa 2: The Rule", "shoot_location": "Ramoji Film City, Studio Floor 14 - Rain Sequence", "start_date": "2026-09-16", "end_date": "2026-09-20"}'::jsonb,
  '{"total_shoots_completed": 52, "total_days_deployed": 210, "cumulative_lifetime_earnings": 220000, "clean_record_score": 98, "total_damage_incidents": 1, "rating": 4.88}'::jsonb
),
(
  'cw-003',
  'ASH-CW-03',
  'Govind Raj',
  'crew',
  'Heavy Machinery & Throne Logistics Lead',
  '+91 98493 44556',
  'govind.raj@aswamovies.com',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  'Available',
  1100,
  '{"name": "G. Venkatesh (Brother)", "relationship": "Brother", "phone": "+91 98493 77665"}'::jsonb,
  '{"license_type": "Hydraulic Crane Operator Class A", "heavy_rigging_certified": true, "fragile_optics_handling": false, "film_industry_experience_years": 7}'::jsonb,
  NULL,
  '{"total_shoots_completed": 29, "total_days_deployed": 96, "cumulative_lifetime_earnings": 105600, "clean_record_score": 100, "total_damage_incidents": 0, "rating": 4.9}'::jsonb
),
(
  'cw-004',
  'ASH-CW-04',
  'Mahesh Babu Rao',
  'crew',
  'Glassware, Optics & Fragile Antiques Handler',
  '+91 98494 55667',
  'mahesh.rao@aswamovies.com',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'Standby',
  1300,
  '{"name": "M. Lakshmi (Mother)", "relationship": "Mother", "phone": "+91 98494 66554"}'::jsonb,
  '{"license_type": "Museum Conservation Specialist Cert.", "heavy_rigging_certified": false, "fragile_optics_handling": true, "film_industry_experience_years": 6}'::jsonb,
  NULL,
  '{"total_shoots_completed": 24, "total_days_deployed": 88, "cumulative_lifetime_earnings": 98000, "clean_record_score": 96, "total_damage_incidents": 1, "rating": 4.75}'::jsonb
),
(
  'cw-005',
  'ASH-CW-05',
  'Venkatesh Naidu',
  'crew',
  'High-Speed Action Set Prop Safety Supervisor',
  '+91 98495 66778',
  'venkatesh.naidu@aswamovies.com',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'Available',
  1400,
  '{"name": "V. Aruna (Spouse)", "relationship": "Spouse", "phone": "+91 98495 55443"}'::jsonb,
  '{"license_type": "Stunt & Pyrotechnics Safety Certified", "heavy_rigging_certified": true, "fragile_optics_handling": true, "film_industry_experience_years": 11}'::jsonb,
  NULL,
  '{"total_shoots_completed": 45, "total_days_deployed": 175, "cumulative_lifetime_earnings": 185000, "clean_record_score": 100, "total_damage_incidents": 0, "rating": 4.98}'::jsonb
),
(
  'cw-006',
  'ASH-CW-06',
  'Anand Shankar',
  'crew',
  'Mid-Century Furniture & Set Dressing Lead',
  '+91 98496 77889',
  'anand.shankar@aswamovies.com',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'Available',
  1000,
  '{"name": "S. Preethi (Sister)", "relationship": "Sister", "phone": "+91 98496 44332"}'::jsonb,
  '{"license_type": "Art Department Set Dressing Guild", "heavy_rigging_certified": false, "fragile_optics_handling": true, "film_industry_experience_years": 5}'::jsonb,
  NULL,
  '{"total_shoots_completed": 19, "total_days_deployed": 62, "cumulative_lifetime_earnings": 62000, "clean_record_score": 100, "total_damage_incidents": 0, "rating": 4.82}'::jsonb
),
(
  'cw-007',
  'ASH-CW-07',
  'Kalyan Chakravarthy',
  'crew',
  'Heavy Vehicle Driver & Logistics Coordinator',
  '+91 98497 88990',
  'kalyan.c@aswamovies.com',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'Available',
  1100,
  '{"name": "K. Bhavani (Spouse)", "relationship": "Spouse", "phone": "+91 98497 33221"}'::jsonb,
  '{"license_type": "Heavy Commercial Transport (TS-08-HGV-9941)", "heavy_rigging_certified": true, "fragile_optics_handling": false, "film_industry_experience_years": 8}'::jsonb,
  NULL,
  '{"total_shoots_completed": 33, "total_days_deployed": 120, "cumulative_lifetime_earnings": 132000, "clean_record_score": 100, "total_damage_incidents": 0, "rating": 4.91}'::jsonb
),
(
  'cw-008',
  'ASH-CW-08',
  'Pradeep Reddy',
  'crew',
  'Vintage Electronics & Practical Light Rigger',
  '+91 98498 99001',
  'pradeep.reddy@aswamovies.com',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'Available',
  1250,
  '{"name": "P. Srinivas (Father)", "relationship": "Father", "phone": "+91 98498 22110"}'::jsonb,
  '{"license_type": "Certified Cinema Electrical Inspector", "heavy_rigging_certified": false, "fragile_optics_handling": true, "film_industry_experience_years": 6}'::jsonb,
  NULL,
  '{"total_shoots_completed": 21, "total_days_deployed": 74, "cumulative_lifetime_earnings": 92500, "clean_record_score": 100, "total_damage_incidents": 0, "rating": 4.87}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  designation = EXCLUDED.designation,
  status = EXCLUDED.status,
  current_deployment = EXCLUDED.current_deployment,
  daily_wage = EXCLUDED.daily_wage;
