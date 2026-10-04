-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS - SERIALIZED ASSET MANAGEMENT DDL
-- Separation of SKU Catalog (prop_models/props) vs Physical Serialized Units (inventory_assets/properties)
-- ===================================================================

-- 1. Extend prop_serialized_items with granular physical asset location and condition attributes
ALTER TABLE public.prop_serialized_items
ADD COLUMN IF NOT EXISTS physical_condition TEXT DEFAULT 'GOOD',
ADD COLUMN IF NOT EXISTS godown TEXT DEFAULT 'Godown 1',
ADD COLUMN IF NOT EXISTS floor TEXT DEFAULT 'Floor 1',
ADD COLUMN IF NOT EXISTS rack TEXT DEFAULT 'Rack A',
ADD COLUMN IF NOT EXISTS shelf TEXT DEFAULT 'Shelf 01',
ADD COLUMN IF NOT EXISTS row_bay TEXT,
ADD COLUMN IF NOT EXISTS storage_location TEXT DEFAULT 'Godown 1 > Floor 1 > Rack A > Shelf 01',
ADD COLUMN IF NOT EXISTS warehouse_code TEXT DEFAULT 'G1-F1-RA-S01',
ADD COLUMN IF NOT EXISTS warehouse_location_name TEXT DEFAULT 'Godown 1 > Floor 1 > Rack A > Shelf 01',
ADD COLUMN IF NOT EXISTS damage_notes TEXT,
ADD COLUMN IF NOT EXISTS last_audit_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_inspected_by UUID;

-- 2. Create physical asset table 'properties' / 'inventory_assets' if not already present
-- Represents individual serialized physical units (e.g. ASH-ELEC-MOU-0001)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code TEXT NOT NULL UNIQUE,
    model_id UUID REFERENCES public.props(id) ON DELETE CASCADE,
    prop_id UUID REFERENCES public.props(id) ON DELETE CASCADE,
    physical_condition TEXT NOT NULL DEFAULT 'GOOD' CHECK (physical_condition IN ('EXCELLENT', 'GOOD', 'DAMAGED', 'SCRAP', 'MISSING', 'Brand New', 'Good / Normal Wear', 'Damaged / Needs Repair', 'Critical / Scrap')),
    condition TEXT DEFAULT 'Good',
    rental_status TEXT NOT NULL DEFAULT 'Available',
    status TEXT NOT NULL DEFAULT 'Available',
    godown TEXT DEFAULT 'Godown 1',
    floor TEXT DEFAULT 'Floor 1',
    rack TEXT DEFAULT 'Rack A',
    shelf TEXT DEFAULT 'Shelf 01',
    row_bay TEXT,
    shelf_bay TEXT,
    bin TEXT,
    storage_location TEXT DEFAULT 'Godown 1 > Floor 1 > Rack A > Shelf 01',
    location_code TEXT DEFAULT 'G1-F1-RA-S01',
    warehouse_code TEXT DEFAULT 'G1-F1-RA-S01',
    warehouse_location_name TEXT DEFAULT 'Godown 1 > Floor 1 > Rack A > Shelf 01',
    is_functional BOOLEAN DEFAULT TRUE,
    damage_notes TEXT,
    notes TEXT,
    last_audit_date TIMESTAMPTZ,
    last_inspected_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for instant unique asset lookups by item_code
CREATE INDEX IF NOT EXISTS idx_properties_item_code ON public.properties(item_code);
CREATE INDEX IF NOT EXISTS idx_properties_model_id ON public.properties(model_id);
CREATE INDEX IF NOT EXISTS idx_properties_physical_condition ON public.properties(physical_condition);

-- 3. inventory_assets alias table/view
CREATE TABLE IF NOT EXISTS public.inventory_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code TEXT NOT NULL UNIQUE,
    model_id UUID REFERENCES public.props(id) ON DELETE CASCADE,
    physical_condition TEXT NOT NULL DEFAULT 'GOOD',
    godown TEXT DEFAULT 'Godown 1',
    floor TEXT DEFAULT 'Floor 1',
    rack TEXT DEFAULT 'Rack A',
    shelf TEXT DEFAULT 'Shelf 01',
    storage_location TEXT DEFAULT 'Godown 1 > Floor 1 > Rack A > Shelf 01',
    damage_notes TEXT,
    last_audit_date TIMESTAMPTZ,
    last_inspected_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_assets_item_code ON public.inventory_assets(item_code);

-- 4. prop_models view mapping to parent SKU catalog
CREATE OR REPLACE VIEW public.prop_models AS
SELECT
    p.id,
    p.name,
    p.model_number,
    p.brand,
    p.category_id,
    p.description,
    p.calculated_rent_price AS base_daily_rate,
    p.replacement_value,
    p.rental_rate_percent,
    p.images,
    p.total_quantity,
    p.available_quantity,
    p.created_at,
    p.updated_at
FROM public.props p;

-- 5. Extend prop_health_history with asset tracking fields
ALTER TABLE public.prop_health_history
ADD COLUMN IF NOT EXISTS item_code TEXT,
ADD COLUMN IF NOT EXISTS condition_status TEXT,
ADD COLUMN IF NOT EXISTS physical_condition TEXT,
ADD COLUMN IF NOT EXISTS previous_location TEXT,
ADD COLUMN IF NOT EXISTS new_location TEXT,
ADD COLUMN IF NOT EXISTS inspector_id UUID,
ADD COLUMN IF NOT EXISTS inspector_name TEXT,
ADD COLUMN IF NOT EXISTS inspected_by_name TEXT,
ADD COLUMN IF NOT EXISTS damage_notes TEXT,
ADD COLUMN IF NOT EXISTS evidence_photos TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_prop_health_history_item_code ON public.prop_health_history(item_code);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read properties" ON public.properties;
CREATE POLICY "Public Read properties" ON public.properties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Update properties" ON public.properties;
CREATE POLICY "Public Update properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read inventory_assets" ON public.inventory_assets;
CREATE POLICY "Public Read inventory_assets" ON public.inventory_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Update inventory_assets" ON public.inventory_assets;
CREATE POLICY "Public Update inventory_assets" ON public.inventory_assets FOR ALL USING (true) WITH CHECK (true);
