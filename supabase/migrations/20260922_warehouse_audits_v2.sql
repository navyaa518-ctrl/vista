-- ==============================================================================
-- ASHWA Movie Property Rentals - Property Health & Warehouse Audits Module
-- Migration: 20260922_warehouse_audits_v2.sql
-- ==============================================================================

-- 1. Main Warehouse Audits Table
CREATE TABLE IF NOT EXISTS public.warehouse_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    audit_type TEXT NOT NULL CHECK (audit_type IN ('WEEKLY', 'SPOT', 'CYCLE')),
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    floor_level TEXT NOT NULL CHECK (floor_level IN ('Floor 1', 'Floor 2', 'Floor 3', 'All Floors')),
    rack_range TEXT,
    category_id TEXT,
    scheduled_date DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 2. Audit Assignees Table (Multi-assignee support: Executives, Crew Members, Admins)
CREATE TABLE IF NOT EXISTS public.audit_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.warehouse_audits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(audit_id, user_id)
);

-- 3. Audit Inspection Items (Props inspected within an active audit batch)
CREATE TABLE IF NOT EXISTS public.audit_inspection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.warehouse_audits(id) ON DELETE CASCADE,
    prop_id UUID NOT NULL REFERENCES public.props(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    health_status TEXT NOT NULL CHECK (health_status IN ('PERFECT', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'MISSING')),
    rack_verified TEXT,
    is_misplaced BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    evidence_photos TEXT[] DEFAULT '{}',
    resolution_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (resolution_status IN ('PENDING', 'FLAGGED_MAINTENANCE', 'REPAIRED', 'RESOLVED', 'WRITTEN_OFF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(audit_id, prop_id)
);

-- 4. Property Health History (Auto-logged immutable timeline for each prop)
CREATE TABLE IF NOT EXISTS public.prop_health_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prop_id UUID NOT NULL REFERENCES public.props(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES public.warehouse_audits(id) ON DELETE SET NULL,
    inspected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('PERFECT', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'MISSING')),
    rack_location TEXT,
    is_misplaced BOOLEAN DEFAULT FALSE,
    notes TEXT,
    photo_urls TEXT[] DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Extend Props Table with Last Inspection Meta
ALTER TABLE public.props
ADD COLUMN IF NOT EXISTS last_inspected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_inspected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_condition TEXT DEFAULT 'PERFECT',
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'AVAILABLE';

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_audits_status ON public.warehouse_audits(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_audits_date ON public.warehouse_audits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_warehouse_audits_floor ON public.warehouse_audits(floor_level);
CREATE INDEX IF NOT EXISTS idx_audit_assignees_audit ON public.audit_assignees(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_assignees_user ON public.audit_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_inspection_audit ON public.audit_inspection_items(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_inspection_prop ON public.audit_inspection_items(prop_id);
CREATE INDEX IF NOT EXISTS idx_prop_health_history_prop ON public.prop_health_history(prop_id);
CREATE INDEX IF NOT EXISTS idx_prop_health_history_audit ON public.prop_health_history(audit_id);
CREATE INDEX IF NOT EXISTS idx_prop_health_history_timestamp ON public.prop_health_history(timestamp DESC);

-- 7. Ensure Storage Bucket Exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-evidence', 'audit-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Row Level Security Policies
ALTER TABLE public.warehouse_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prop_health_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to warehouse_audits"
ON public.warehouse_audits FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to warehouse_audits"
ON public.warehouse_audits FOR ALL USING (true);

CREATE POLICY "Allow public read access to audit_assignees"
ON public.audit_assignees FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to audit_assignees"
ON public.audit_assignees FOR ALL USING (true);

CREATE POLICY "Allow public read access to audit_inspection_items"
ON public.audit_inspection_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to audit_inspection_items"
ON public.audit_inspection_items FOR ALL USING (true);

CREATE POLICY "Allow public read access to prop_health_history"
ON public.prop_health_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to prop_health_history"
ON public.prop_health_history FOR ALL USING (true);
