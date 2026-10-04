-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS: WALK-IN ORDER TO RETURN & BILLING PIPELINE
-- Migration: 20260919_walkin_to_return_pipeline.sql
-- ===================================================================

-- 1. Extend Orders Table with Pipeline, Returns & Sourcing Columns
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS assigned_crew_type TEXT DEFAULT 'in_house' CHECK (assigned_crew_type IN ('in_house', 'client_sourced')),
  ADD COLUMN IF NOT EXISTS client_crew_details JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vehicle_no TEXT,
  ADD COLUMN IF NOT EXISTS driver_contact TEXT,
  ADD COLUMN IF NOT EXISTS actual_shoot_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS advance_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS return_status_crew TEXT DEFAULT 'Pending' CHECK (return_status_crew IN ('Pending', 'Initiated', 'Approved')),
  ADD COLUMN IF NOT EXISTS return_status_exec TEXT DEFAULT 'Pending' CHECK (return_status_exec IN ('Pending', 'Verified', 'Approved')),
  ADD COLUMN IF NOT EXISTS return_notes_crew TEXT,
  ADD COLUMN IF NOT EXISTS return_notes_exec TEXT,
  ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'Quotation' CHECK (lifecycle_status IN ('Quotation', 'Dispatched', 'On_Site_Active', 'Return_Initiated', 'Verified_Closed', 'Cancelled')),
  ADD COLUMN IF NOT EXISTS final_invoice_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS final_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS damage_deduction_amount NUMERIC DEFAULT 0;

-- 2. Integrated Labor Sheet Table (Auto-synced from Order Crew Assignments)
CREATE TABLE IF NOT EXISTS order_labor_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  crew_member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  crew_name TEXT NOT NULL,
  badge_number TEXT,
  movie_project_name TEXT NOT NULL,
  role_on_set TEXT DEFAULT 'Prop Handling & Rigging Specialist',
  daily_wage_rate NUMERIC NOT NULL DEFAULT 1000,
  active_shoot_days INTEGER NOT NULL DEFAULT 1,
  total_wages_earned NUMERIC NOT NULL DEFAULT 1000,
  voucher_number TEXT,
  payment_status TEXT DEFAULT 'Pending_Disbursement' CHECK (payment_status IN ('Pending_Disbursement', 'Approved', 'Disbursed')),
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_labor_sheets_order_id ON order_labor_sheets(order_id);
CREATE INDEX IF NOT EXISTS idx_labor_sheets_crew_id ON order_labor_sheets(crew_member_id);

-- 3. Final Tax Invoices Registry Table
CREATE TABLE IF NOT EXISTS final_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  production_name TEXT NOT NULL,
  shoot_location TEXT,
  vehicle_no TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_shoot_days INTEGER NOT NULL,
  base_rental_subtotal NUMERIC NOT NULL,
  handling_labor_charges NUMERIC DEFAULT 0,
  damage_penalties NUMERIC DEFAULT 0,
  gst_tax_amount NUMERIC NOT NULL,
  gross_total NUMERIC NOT NULL,
  advance_deduction NUMERIC DEFAULT 0,
  final_balance_due NUMERIC NOT NULL,
  items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Issued' CHECK (status IN ('Issued', 'Paid', 'Partially_Paid', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_final_invoices_order_id ON final_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_final_invoices_number ON final_invoices(invoice_number);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE order_labor_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read order_labor_sheets"
  ON order_labor_sheets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to manage order_labor_sheets"
  ON order_labor_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read final_invoices"
  ON final_invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to manage final_invoices"
  ON final_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'final_invoices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE final_invoices;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'order_labor_sheets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_labor_sheets;
  END IF;
END $$;
