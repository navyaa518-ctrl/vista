-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS: CREW OPERATIONS & FIELD FLEET MODULE
-- Migration: 20260918_crew_hub_operations.sql
-- ===================================================================

-- 1. In-House Order Crew Tagging with Date Range (Supports Mid-Shoot Swaps)
CREATE TABLE IF NOT EXISTS order_crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  crew_member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  daily_wage NUMERIC NOT NULL DEFAULT 1000,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Replaced', 'Completed')),
  assigned_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_order_crew_order_id ON order_crew_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_crew_member_id ON order_crew_assignments(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_order_crew_status ON order_crew_assignments(status);

-- 2. Client Sourced Crew Records (Gate-Pass Verification & Legal Liability)
CREATE TABLE IF NOT EXISTS order_external_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_external_crew_order_id ON order_external_crew(order_id);

-- 3. Daily Field Attendance & Prop Status Logs
CREATE TABLE IF NOT EXISTS crew_field_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  crew_member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_type TEXT CHECK (log_type IN ('Attendance', 'Location_Ping', 'Prop_Health_Update', 'Incident')),
  location_name TEXT,
  gps_coordinates JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crew_field_logs_order_id ON crew_field_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_crew_field_logs_member_id ON crew_field_logs(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_field_logs_created_at ON crew_field_logs(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE order_crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_external_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_field_logs ENABLE ROW LEVEL SECURITY;

-- Permissive operational policies for Ashwa authenticated staff
CREATE POLICY "Allow all authenticated users to read order_crew_assignments"
  ON order_crew_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to manage order_crew_assignments"
  ON order_crew_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read order_external_crew"
  ON order_external_crew FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to manage order_external_crew"
  ON order_external_crew FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read crew_field_logs"
  ON crew_field_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to insert crew_field_logs"
  ON crew_field_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable Realtime replication for field logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'crew_field_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crew_field_logs;
  END IF;
END $$;
