-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS - AUDIT INSPECTION ITEMS & PROPERTIES SYNC
-- Support persistent single-asset inspection records and relationship
-- ===================================================================

-- 1. Ensure properties table exists with all required serialized asset fields
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code TEXT NOT NULL UNIQUE,
    name TEXT,
    title TEXT,
    image_url TEXT,
    model_id UUID,
    prop_id UUID,
    physical_condition TEXT NOT NULL DEFAULT 'GOOD',
    condition TEXT DEFAULT 'Good',
    rental_status TEXT NOT NULL DEFAULT 'Available',
    status TEXT NOT NULL DEFAULT 'Available',
    godown TEXT DEFAULT 'Godown 1',
    floor TEXT DEFAULT 'Floor 1',
    rack TEXT DEFAULT 'Rack A',
    shelf TEXT DEFAULT 'Shelf 01',
    row_bay TEXT,
    shelf_bay TEXT,
    storage_location TEXT DEFAULT 'Godown 1 > Floor 1 > Rack A > Shelf 01',
    location_code TEXT DEFAULT 'G1-F1-RA-S01',
    warehouse_code TEXT DEFAULT 'G1-F1-RA-S01',
    damage_notes TEXT,
    notes TEXT,
    last_audit_date TIMESTAMPTZ,
    last_inspected_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist in case properties was created earlier without them
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS storage_location TEXT DEFAULT 'Godown 1 > Floor 1 > Rack A > Shelf 01',
ADD COLUMN IF NOT EXISTS godown TEXT DEFAULT 'Godown 1',
ADD COLUMN IF NOT EXISTS floor TEXT DEFAULT 'Floor 1',
ADD COLUMN IF NOT EXISTS rack TEXT DEFAULT 'Rack A',
ADD COLUMN IF NOT EXISTS shelf TEXT DEFAULT 'Shelf 01',
ADD COLUMN IF NOT EXISTS physical_condition TEXT DEFAULT 'GOOD';

-- 2. Ensure audit_inspection_items table exists
CREATE TABLE IF NOT EXISTS public.audit_inspection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL,
    item_code TEXT NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    prop_id UUID,
    physical_condition TEXT NOT NULL DEFAULT 'GOOD',
    health_status TEXT NOT NULL DEFAULT 'PERFECT',
    rack_verified TEXT,
    notes TEXT,
    evidence_photos TEXT[] DEFAULT '{}',
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    scanned_by UUID,
    resolution_status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist in case audit_inspection_items already existed
ALTER TABLE public.audit_inspection_items
ADD COLUMN IF NOT EXISTS item_code TEXT,
ADD COLUMN IF NOT EXISTS physical_condition TEXT DEFAULT 'GOOD',
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS evidence_photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ DEFAULT now();

-- 3. Add foreign key from audit_inspection_items to properties via item_code if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_inspection_properties_item_code'
    ) THEN
        BEGIN
            ALTER TABLE public.audit_inspection_items
            ADD CONSTRAINT fk_audit_inspection_properties_item_code
            FOREIGN KEY (item_code) REFERENCES public.properties(item_code) ON DELETE CASCADE;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

-- 4. Enable RLS and permissive policies for audit inspection
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_inspection_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to properties') THEN
        CREATE POLICY "Allow public read access to properties" ON public.properties FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert/update to properties') THEN
        CREATE POLICY "Allow public insert/update to properties" ON public.properties FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to audit_inspection_items') THEN
        CREATE POLICY "Allow public read access to audit_inspection_items" ON public.audit_inspection_items FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert/update to audit_inspection_items') THEN
        CREATE POLICY "Allow public insert/update to audit_inspection_items" ON public.audit_inspection_items FOR ALL USING (true);
    END IF;
END $$;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_audit_inspection_items_item_code ON public.audit_inspection_items(item_code);
CREATE INDEX IF NOT EXISTS idx_audit_inspection_items_audit_id ON public.audit_inspection_items(audit_id);
CREATE INDEX IF NOT EXISTS idx_properties_item_code ON public.properties(item_code);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(godown, floor, rack, shelf);
