-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS - WALKIN ORDERS & REALTIME QR PICKING
-- Migration: 20260913_walkin_realtime_picking.sql
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure / Upgrade orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    client_id UUID,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    movie_project_name TEXT,
    production_name TEXT,
    shoot_location TEXT,
    status TEXT NOT NULL DEFAULT 'Assigned' CHECK (status IN (
        'Draft', 'Assigned', 'Picking_In_Progress', 'picking_in_progress', 
        'Quotation_Review', 'Confirmed', 'Dispatched', 'dispatched', 'Returned', 'returned', 'Cancelled'
    )),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '3 days'),
    rental_start_date TIMESTAMPTZ DEFAULT NOW(),
    rental_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
    rental_days INTEGER NOT NULL DEFAULT 3,
    total_replacement_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_replacement_val NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    base_rental_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_rent_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    security_deposit NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    final_payable NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    assigned_executives JSONB DEFAULT '[]'::JSONB,
    vehicle_number TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    gate_pass_number TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter existing orders table if it pre-existed
DO $$
BEGIN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS movie_project_name TEXT;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_id UUID;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rental_start_date TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rental_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days');
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_replacement_val NUMERIC(14,2) DEFAULT 0.00;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_rent_amount NUMERIC(14,2) DEFAULT 0.00;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS final_payable NUMERIC(14,2) DEFAULT 0.00;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS advance_paid BOOLEAN DEFAULT false;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(14,2) DEFAULT 0.00;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 3;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_mode TEXT;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Table: order_assignments
CREATE TABLE IF NOT EXISTS public.order_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    executive_id UUID,
    executive_name TEXT NOT NULL,
    floor_assigned INTEGER DEFAULT 1,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. Ensure / Upgrade order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    prop_id UUID,
    prop_item_id UUID,
    prop_serialized_item_id UUID,
    item_serial TEXT,
    prop_title TEXT NOT NULL,
    prop_category TEXT,
    replacement_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    daily_rental_rate NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    rent_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    rental_days INTEGER NOT NULL DEFAULT 3,
    quantity INTEGER NOT NULL DEFAULT 1,
    floor INTEGER DEFAULT 1,
    rack TEXT,
    warehouse_location TEXT,
    status TEXT NOT NULL DEFAULT 'picked' CHECK (status IN ('pending', 'picked', 'loaded', 'returned', 'removed')),
    scanned_by UUID,
    scanned_by_name TEXT,
    picked_by_name TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    picked_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter existing order_items table if it pre-existed
DO $$
BEGIN
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS prop_serialized_item_id UUID;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS rent_price NUMERIC(14,2) DEFAULT 0.00;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS warehouse_location TEXT;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS added_by_executive_id UUID;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS added_by_executive_name TEXT;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS scanned_by UUID;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS scanned_by_name TEXT;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Table: prop_rental_history
CREATE TABLE IF NOT EXISTS public.prop_rental_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prop_serialized_item_id UUID,
    item_code TEXT,
    prop_name TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_number TEXT,
    client_name TEXT,
    movie_project_name TEXT,
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    returned_at TIMESTAMPTZ,
    rental_days INTEGER DEFAULT 3,
    rental_earnings NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    return_condition TEXT DEFAULT 'Good' CHECK (return_condition IN ('Good', 'Minor Damage', 'Repaired', 'Pristine')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for High-Speed Realtime Queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_assignments_order_id ON public.order_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_assignments_executive_id ON public.order_assignments(executive_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_serial ON public.order_items(item_serial);
CREATE INDEX IF NOT EXISTS idx_prop_rental_history_serial ON public.prop_rental_history(item_code);
CREATE INDEX IF NOT EXISTS idx_prop_rental_history_order ON public.prop_rental_history(order_id);

-- 6. Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prop_rental_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read orders" ON public.orders;
CREATE POLICY "Public Read orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Full Access orders" ON public.orders;
CREATE POLICY "Full Access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read order_assignments" ON public.order_assignments;
CREATE POLICY "Public Read order_assignments" ON public.order_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Full Access order_assignments" ON public.order_assignments;
CREATE POLICY "Full Access order_assignments" ON public.order_assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read order_items" ON public.order_items;
CREATE POLICY "Public Read order_items" ON public.order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Full Access order_items" ON public.order_items;
CREATE POLICY "Full Access order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read prop_rental_history" ON public.prop_rental_history;
CREATE POLICY "Public Read prop_rental_history" ON public.prop_rental_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Full Access prop_rental_history" ON public.prop_rental_history;
CREATE POLICY "Full Access prop_rental_history" ON public.prop_rental_history FOR ALL USING (true) WITH CHECK (true);

-- 7. Supabase Realtime Publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
