-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS - WAREHOUSE HIERARCHY DDL
-- Multi-tier nested warehouse capacity management:
-- Godowns (Blocks) -> Floors -> Racks -> Rows / Shelves
-- ===================================================================

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Updated Timestamp Trigger Function
CREATE OR REPLACE FUNCTION update_warehouse_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Table: warehouse_godowns
CREATE TABLE IF NOT EXISTS public.warehouse_godowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    total_area_sqft INTEGER DEFAULT 25000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: warehouse_floors
CREATE TABLE IF NOT EXISTS public.warehouse_floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    godown_id UUID NOT NULL REFERENCES public.warehouse_godowns(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    climate_zone TEXT DEFAULT 'Standard Warehouse Atmosphere',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_godown_floor UNIQUE (godown_id, floor_number)
);

-- 5. Table: warehouse_racks
CREATE TABLE IF NOT EXISTS public.warehouse_racks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID NOT NULL REFERENCES public.warehouse_floors(id) ON DELETE CASCADE,
    rack_code TEXT NOT NULL,
    name TEXT NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 100,
    dimensions TEXT DEFAULT '4m x 1.5m x 5m',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_floor_rack UNIQUE (floor_id, rack_code)
);

-- 6. Table: warehouse_rows (Shelves / Pallet Slots)
CREATE TABLE IF NOT EXISTS public.warehouse_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rack_id UUID NOT NULL REFERENCES public.warehouse_racks(id) ON DELETE CASCADE,
    row_code TEXT NOT NULL,
    name TEXT NOT NULL,
    max_items INTEGER NOT NULL DEFAULT 50,
    current_occupied_count INTEGER NOT NULL DEFAULT 0,
    location_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rack_row UNIQUE (rack_id, row_code)
);

-- 7. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_warehouse_floors_godown ON public.warehouse_floors(godown_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_racks_floor ON public.warehouse_racks(floor_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_rows_rack ON public.warehouse_rows(rack_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_rows_location_code ON public.warehouse_rows(location_code);

-- 8. Trigger Attachments
DROP TRIGGER IF EXISTS trg_warehouse_godowns_updated ON public.warehouse_godowns;
CREATE TRIGGER trg_warehouse_godowns_updated
    BEFORE UPDATE ON public.warehouse_godowns
    FOR EACH ROW EXECUTE FUNCTION update_warehouse_timestamp();

DROP TRIGGER IF EXISTS trg_warehouse_floors_updated ON public.warehouse_floors;
CREATE TRIGGER trg_warehouse_floors_updated
    BEFORE UPDATE ON public.warehouse_floors
    FOR EACH ROW EXECUTE FUNCTION update_warehouse_timestamp();

DROP TRIGGER IF EXISTS trg_warehouse_racks_updated ON public.warehouse_racks;
CREATE TRIGGER trg_warehouse_racks_updated
    BEFORE UPDATE ON public.warehouse_racks
    FOR EACH ROW EXECUTE FUNCTION update_warehouse_timestamp();

DROP TRIGGER IF EXISTS trg_warehouse_rows_updated ON public.warehouse_rows;
CREATE TRIGGER trg_warehouse_rows_updated
    BEFORE UPDATE ON public.warehouse_rows
    FOR EACH ROW EXECUTE FUNCTION update_warehouse_timestamp();

-- 9. Row Level Security (RLS) Policies
ALTER TABLE public.warehouse_godowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_rows ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated and anon users
DROP POLICY IF EXISTS "Public Read warehouse_godowns" ON public.warehouse_godowns;
CREATE POLICY "Public Read warehouse_godowns" ON public.warehouse_godowns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read warehouse_floors" ON public.warehouse_floors;
CREATE POLICY "Public Read warehouse_floors" ON public.warehouse_floors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read warehouse_racks" ON public.warehouse_racks;
CREATE POLICY "Public Read warehouse_racks" ON public.warehouse_racks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read warehouse_rows" ON public.warehouse_rows;
CREATE POLICY "Public Read warehouse_rows" ON public.warehouse_rows FOR SELECT USING (true);

-- Allow full modifications to admins, managers, and service role
DROP POLICY IF EXISTS "Full Access warehouse_godowns" ON public.warehouse_godowns;
CREATE POLICY "Full Access warehouse_godowns" ON public.warehouse_godowns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full Access warehouse_floors" ON public.warehouse_floors;
CREATE POLICY "Full Access warehouse_floors" ON public.warehouse_floors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full Access warehouse_racks" ON public.warehouse_racks;
CREATE POLICY "Full Access warehouse_racks" ON public.warehouse_racks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full Access warehouse_rows" ON public.warehouse_rows;
CREATE POLICY "Full Access warehouse_rows" ON public.warehouse_rows FOR ALL USING (true) WITH CHECK (true);

-- ===================================================================
-- 10. INITIAL SEED DATA
-- ===================================================================

DO $$
DECLARE
    g1_id UUID;
    g2_id UUID;
    f1_g1_id UUID;
    f2_g1_id UUID;
    f1_g2_id UUID;
    f2_g2_id UUID;
    r_ra_id UUID;
    r_rb_id UUID;
    r_rc_id UUID;
    r_rd_id UUID;
    r_re_id UUID;
BEGIN
    -- Insert Godown 1
    INSERT INTO public.warehouse_godowns (code, name, address, notes, total_area_sqft)
    VALUES ('G1', 'Godown 1 - Main Yard & Heavy Sets', 'Plot 42, Film City Logistics Corridor, Sector A', '14m ceiling clearance, 20-ton crane hoist, wide vehicular ramp', 28000)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO g1_id;

    -- Insert Godown 2
    INSERT INTO public.warehouse_godowns (code, name, address, notes, total_area_sqft)
    VALUES ('G2', 'Godown 2 - Precision Tech & Wardrobe', 'Plot 42, Film City Logistics Corridor, Sector B', 'Multi-zone HVAC climate control (21C / 45% RH), ESD flooring, RF shielded vaults', 22000)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO g2_id;

    -- Floors for Godown 1
    INSERT INTO public.warehouse_floors (godown_id, floor_number, name, climate_zone)
    VALUES (g1_id, 0, 'Ground Floor - Heavy Armory & Vehicles', 'Standard Dry Logistics')
    ON CONFLICT (godown_id, floor_number) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO f1_g1_id;

    INSERT INTO public.warehouse_floors (godown_id, floor_number, name, climate_zone)
    VALUES (g1_id, 1, 'Floor 1 - Teakwood Sets & Palace Durbars', 'Dehumidified Teak Storage')
    ON CONFLICT (godown_id, floor_number) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO f2_g1_id;

    -- Floors for Godown 2
    INSERT INTO public.warehouse_floors (godown_id, floor_number, name, climate_zone)
    VALUES (g2_id, 0, 'Ground Floor - Studio Optics & Cameras', 'Climate Vault (20C / 40% RH)')
    ON CONFLICT (godown_id, floor_number) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO f1_g2_id;

    INSERT INTO public.warehouse_floors (godown_id, floor_number, name, climate_zone)
    VALUES (g2_id, 1, 'Floor 1 - Retro Electronics & CRT Monitors', 'ESD Protected Zone')
    ON CONFLICT (godown_id, floor_number) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO f2_g2_id;

    -- Racks for Godown 1, Floor 0
    INSERT INTO public.warehouse_racks (floor_id, rack_code, name, max_capacity, dimensions)
    VALUES (f1_g1_id, 'RA', 'Rack A - Royal Thrones & Durbars', 120, '6m x 2m x 5m')
    ON CONFLICT (floor_id, rack_code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO r_ra_id;

    INSERT INTO public.warehouse_racks (floor_id, rack_code, name, max_capacity, dimensions)
    VALUES (f1_g1_id, 'RB', 'Rack B - Medieval Armory & Shields', 150, '5m x 1.5m x 4.5m')
    ON CONFLICT (floor_id, rack_code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO r_rb_id;

    -- Racks for Godown 1, Floor 1
    INSERT INTO public.warehouse_racks (floor_id, rack_code, name, max_capacity, dimensions)
    VALUES (f2_g1_id, 'RC', 'Rack C - Antique Belgian Chandeliers', 100, '5m x 2m x 4m')
    ON CONFLICT (floor_id, rack_code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO r_rc_id;

    -- Racks for Godown 2, Floor 0
    INSERT INTO public.warehouse_racks (floor_id, rack_code, name, max_capacity, dimensions)
    VALUES (f1_g2_id, 'RD', 'Rack D - 35mm Vintage Cameras & Lenses', 80, '4m x 1m x 3.5m')
    ON CONFLICT (floor_id, rack_code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO r_rd_id;

    -- Racks for Godown 2, Floor 1
    INSERT INTO public.warehouse_racks (floor_id, rack_code, name, max_capacity, dimensions)
    VALUES (f2_g2_id, 'RE', 'Rack E - Retro CRT Monitors & Sci-Fi Consoles', 90, '4.5m x 1.2m x 4m')
    ON CONFLICT (floor_id, rack_code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO r_re_id;

    -- Rows / Shelves for Rack A (Godown 1 -> Floor 0 -> Rack A)
    INSERT INTO public.warehouse_rows (rack_id, row_code, name, max_items, current_occupied_count, location_code)
    VALUES 
        (r_ra_id, 'S01', 'Shelf 01 - Heavy Base Units', 40, 32, 'G1-F0-RA-S01'),
        (r_ra_id, 'S02', 'Shelf 02 - Medium Teakwood Sets', 40, 35, 'G1-F0-RA-S02'),
        (r_ra_id, 'S03', 'Shelf 03 - Small Gold Filigree Accents', 40, 18, 'G1-F0-RA-S03')
    ON CONFLICT (rack_id, row_code) DO UPDATE SET current_occupied_count = EXCLUDED.current_occupied_count;

    -- Rows / Shelves for Rack B (Godown 1 -> Floor 0 -> Rack B)
    INSERT INTO public.warehouse_rows (rack_id, row_code, name, max_items, current_occupied_count, location_code)
    VALUES 
        (r_rb_id, 'S01', 'Shelf 01 - Chola & Rajput Bronze Armor', 50, 45, 'G1-F0-RB-S01'),
        (r_rb_id, 'S02', 'Shelf 02 - Ceremonial Broadswords', 50, 42, 'G1-F0-RB-S02'),
        (r_rb_id, 'S03', 'Shelf 03 - Iron Shields & Spearheads', 50, 28, 'G1-F0-RB-S03')
    ON CONFLICT (rack_id, row_code) DO UPDATE SET current_occupied_count = EXCLUDED.current_occupied_count;

    -- Rows / Shelves for Rack C (Godown 1 -> Floor 1 -> Rack C)
    INSERT INTO public.warehouse_rows (rack_id, row_code, name, max_items, current_occupied_count, location_code)
    VALUES 
        (r_rc_id, 'S01', 'Shelf 01 - Brass Belgian Chandeliers', 30, 25, 'G1-F1-RC-S01'),
        (r_rc_id, 'S02', 'Shelf 02 - Crystal Hanging Lanterns', 35, 22, 'G1-F1-RC-S02'),
        (r_rc_id, 'S03', 'Shelf 03 - Kerosene & Gas Stage Lamps', 35, 15, 'G1-F1-RC-S03')
    ON CONFLICT (rack_id, row_code) DO UPDATE SET current_occupied_count = EXCLUDED.current_occupied_count;

    -- Rows / Shelves for Rack D (Godown 2 -> Floor 0 -> Rack D)
    INSERT INTO public.warehouse_rows (rack_id, row_code, name, max_items, current_occupied_count, location_code)
    VALUES 
        (r_rd_id, 'S01', 'Shelf 01 - Arriflex 35mm Bodies', 25, 18, 'G2-F0-RD-S01'),
        (r_rd_id, 'S02', 'Shelf 02 - Mitchell BNC Anamorphic Glass', 25, 20, 'G2-F0-RD-S02'),
        (r_rd_id, 'S03', 'Shelf 03 - Prime Lens Flight Cases', 30, 12, 'G2-F0-RD-S03')
    ON CONFLICT (rack_id, row_code) DO UPDATE SET current_occupied_count = EXCLUDED.current_occupied_count;

    -- Rows / Shelves for Rack E (Godown 2 -> Floor 1 -> Rack E)
    INSERT INTO public.warehouse_rows (rack_id, row_code, name, max_items, current_occupied_count, location_code)
    VALUES 
        (r_re_id, 'S01', 'Shelf 01 - Working Sony Trinitron CRTs', 30, 26, 'G2-F1-RE-S01'),
        (r_re_id, 'S02', 'Shelf 02 - Reel-to-Reel Audio Consoles', 30, 14, 'G2-F1-RE-S02'),
        (r_re_id, 'S03', 'Shelf 03 - Neon Control Panels', 30, 10, 'G2-F1-RE-S03')
    ON CONFLICT (rack_id, row_code) DO UPDATE SET current_occupied_count = EXCLUDED.current_occupied_count;
END $$;
