-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS - INVENTORY & SERIALIZED ITEMS DDL
-- Multi-tier serialized asset tracking with warehouse slot binding
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: prop_categories
CREATE TABLE IF NOT EXISTS public.prop_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'Layers',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ensure Warehouse columns exist on props
CREATE TABLE IF NOT EXISTS public.props (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.prop_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    model_number TEXT,
    brand TEXT,
    description TEXT,
    replacement_value NUMERIC(12,2) NOT NULL DEFAULT 1000.00,
    rental_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    calculated_rent_price NUMERIC(12,2) GENERATED ALWAYS AS (replacement_value * (rental_rate_percent / 100.0)) STORED,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    godown_id UUID REFERENCES public.warehouse_godowns(id) ON DELETE SET NULL,
    floor_id UUID REFERENCES public.warehouse_floors(id) ON DELETE SET NULL,
    rack_id UUID REFERENCES public.warehouse_racks(id) ON DELETE SET NULL,
    row_id UUID REFERENCES public.warehouse_rows(id) ON DELETE SET NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: prop_serialized_items (Individual Physical Prop Units)
CREATE TABLE IF NOT EXISTS public.prop_serialized_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prop_id UUID NOT NULL REFERENCES public.props(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL UNIQUE,
    condition TEXT NOT NULL DEFAULT 'Good' CHECK (condition IN ('Brand New', 'Good', 'Minor Wear', 'Maintenance Required')),
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'In Cart', 'Dispatched / On Rent', 'Damaged', 'Lost')),
    rental_count INTEGER NOT NULL DEFAULT 0,
    lifetime_earnings NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    qr_data TEXT NOT NULL,
    current_order_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_prop_serialized_prop_id ON public.prop_serialized_items(prop_id);
CREATE INDEX IF NOT EXISTS idx_prop_serialized_item_code ON public.prop_serialized_items(item_code);
CREATE INDEX IF NOT EXISTS idx_prop_serialized_status ON public.prop_serialized_items(status);
CREATE INDEX IF NOT EXISTS idx_props_category_id ON public.props(category_id);
CREATE INDEX IF NOT EXISTS idx_props_row_id ON public.props(row_id);

-- 5. Row Level Security (RLS)
ALTER TABLE public.prop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prop_serialized_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read prop_categories" ON public.prop_categories;
CREATE POLICY "Public Read prop_categories" ON public.prop_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full Access prop_categories" ON public.prop_categories;
CREATE POLICY "Full Access prop_categories" ON public.prop_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read prop_serialized_items" ON public.prop_serialized_items;
CREATE POLICY "Public Read prop_serialized_items" ON public.prop_serialized_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full Access prop_serialized_items" ON public.prop_serialized_items;
CREATE POLICY "Full Access prop_serialized_items" ON public.prop_serialized_items FOR ALL USING (true) WITH CHECK (true);

-- 6. Initial Seed Data
DO $$
DECLARE
    cat_elec_id UUID;
    cat_furn_id UUID;
    cat_optics_id UUID;
    cat_armory_id UUID;
    prop_mouse_id UUID;
    prop_throne_id UUID;
    prop_cam_id UUID;
    prop_sword_id UUID;
    g1_id UUID;
    f0_g1_id UUID;
    r_ra_id UUID;
    s01_ra_id UUID;
    i INTEGER;
    code_str TEXT;
BEGIN
    -- Seed Categories
    INSERT INTO public.prop_categories (name, slug, icon, description)
    VALUES 
        ('Electronics & Tech', 'electronics', 'Tv', 'Vintage CRT monitors, studio broadcast gear, sci-fi cyberpunk consoles, computer peripherals'),
        ('Period & Royal Furniture', 'vintage-furniture', 'Armchair', 'Burma teakwood thrones, palace durbar sets, Victorian chaises, Belgian chandeliers'),
        ('Cinema Cameras & Optics', 'optics', 'Camera', '35mm vintage camera bodies, anamorphic lenses, director viewfinders, matte boxes'),
        ('Medieval Armory & Weapons', 'armory', 'Shield', 'Bronze & iron breastplates, battle-worn broadswords, ceremonial shields, spears')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_elec_id;

    SELECT id INTO cat_furn_id FROM public.prop_categories WHERE slug = 'vintage-furniture';
    SELECT id INTO cat_optics_id FROM public.prop_categories WHERE slug = 'optics';
    SELECT id INTO cat_armory_id FROM public.prop_categories WHERE slug = 'armory';

    -- Retrieve Warehouse IDs if present
    SELECT id INTO g1_id FROM public.warehouse_godowns WHERE code = 'G1' LIMIT 1;
    SELECT id INTO f0_g1_id FROM public.warehouse_floors WHERE godown_id = g1_id LIMIT 1;
    SELECT id INTO r_ra_id FROM public.warehouse_racks WHERE floor_id = f0_g1_id LIMIT 1;
    SELECT id INTO s01_ra_id FROM public.warehouse_rows WHERE rack_id = r_ra_id LIMIT 1;

    -- Seed Prop 1: Logitech Wireless Mouse M331
    INSERT INTO public.props (
        category_id, name, model_number, brand, description, 
        replacement_value, rental_rate_percent, images,
        godown_id, floor_id, rack_id, row_id,
        total_quantity, available_quantity
    ) VALUES (
        cat_elec_id,
        'Logitech Wireless Silent Mouse M331',
        'M331-SILENT',
        'Logitech',
        'Ergonomic silent optical mouse for modern corporate office and cyber sequences.',
        2000.00,
        20.00,
        ARRAY['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80'],
        g1_id, f0_g1_id, r_ra_id, s01_ra_id,
        25, 23
    ) RETURNING id INTO prop_mouse_id;

    -- Seed 25 Serialized Items for Mouse
    FOR i IN 1..25 LOOP
        code_str := 'ASH-ELEC-MOU-' || LPAD(i::TEXT, 4, '0');
        INSERT INTO public.prop_serialized_items (
            prop_id, item_code, condition, status, rental_count, lifetime_earnings, qr_data, notes
        ) VALUES (
            prop_mouse_id,
            code_str,
            CASE WHEN i % 7 = 0 THEN 'Minor Wear' ELSE 'Good' END,
            CASE WHEN i = 1 THEN 'Dispatched / On Rent' WHEN i = 2 THEN 'In Cart' ELSE 'Available' END,
            (i * 2),
            (i * 2 * 400.00),
            '{"itemCode":"' || code_str || '","propId":"' || prop_mouse_id || '","model":"M331-SILENT"}',
            'Matte black finish'
        ) ON CONFLICT (item_code) DO NOTHING;
    END LOOP;

    -- Seed Prop 2: Royal Victorian Teakwood Throne
    INSERT INTO public.props (
        category_id, name, model_number, brand, description, 
        replacement_value, rental_rate_percent, images,
        godown_id, floor_id, rack_id, row_id,
        total_quantity, available_quantity
    ) VALUES (
        cat_furn_id,
        'Royal Victorian Teakwood Throne with Velvet Upholstery',
        'THRONE-VIC-01',
        'Burma Teak Heritage',
        'Handcrafted Burma teak throne with 24k gold leaf filigree and deep crimson royal velvet backrest.',
        150000.00,
        20.00,
        ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'],
        g1_id, f0_g1_id, r_ra_id, s01_ra_id,
        4, 3
    ) RETURNING id INTO prop_throne_id;

    -- Seed 4 Serialized Units for Throne
    FOR i IN 1..4 LOOP
        code_str := 'ASH-FURN-THR-' || LPAD(i::TEXT, 4, '0');
        INSERT INTO public.prop_serialized_items (
            prop_id, item_code, condition, status, rental_count, lifetime_earnings, qr_data, notes
        ) VALUES (
            prop_throne_id,
            code_str,
            CASE WHEN i = 4 THEN 'Minor Wear' ELSE 'Good' END,
            CASE WHEN i = 1 THEN 'Dispatched / On Rent' ELSE 'Available' END,
            (i * 3),
            (i * 3 * 30000.00),
            '{"itemCode":"' || code_str || '","propId":"' || prop_throne_id || '","model":"THRONE-VIC-01"}',
            'Hero throne unit with golden lion armrests'
        ) ON CONFLICT (item_code) DO NOTHING;
    END LOOP;

END $$;
