-- ==============================================================================
-- ASHWA Movie Property Rentals - Warehouse Property Inspection & Health Audits
-- Migration: 20260919_warehouse_property_audits.sql
-- ==============================================================================

-- 1. Inspection Tasks (Delegation & Batch Audits)
CREATE TABLE IF NOT EXISTS public.inspection_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    audit_type TEXT NOT NULL DEFAULT 'Weekly Audit' CHECK (audit_type IN ('Weekly Audit', 'Monthly Routine', 'Spot Check')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    scope_type TEXT NOT NULL DEFAULT 'Zone_Floor' CHECK (scope_type IN ('Zone_Floor', 'Rack_Range', 'Category', 'All')),
    zone_or_rack TEXT,
    category_id UUID REFERENCES public.prop_categories(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to_name TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    total_items_count INTEGER NOT NULL DEFAULT 0,
    audited_items_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 2. Property Audit History (Immutable Historical Inspection Records)
CREATE TABLE IF NOT EXISTS public.property_audit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.inspection_tasks(id) ON DELETE CASCADE,
    prop_id UUID REFERENCES public.props(id) ON DELETE CASCADE,
    prop_serialized_item_id UUID REFERENCES public.prop_serialized_items(id) ON DELETE SET NULL,
    inspected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    inspected_by_name TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('EXCELLENT', 'GOOD', 'MINOR_WEAR', 'DAMAGED_NEEDS_REPAIR', 'MISSING')),
    rack_verified TEXT NOT NULL,
    is_misplaced BOOLEAN NOT NULL DEFAULT FALSE,
    photo_url TEXT,
    notes TEXT,
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Extend props Table with Health & Inspection Tracking
ALTER TABLE public.props
ADD COLUMN IF NOT EXISTS last_inspected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_inspected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_condition TEXT DEFAULT 'GOOD',
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'AVAILABLE';

-- 4. Provide standard alias view "properties" if needed
CREATE OR REPLACE VIEW public.properties AS
SELECT * FROM public.props;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inspection_tasks_assigned ON public.inspection_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inspection_tasks_status ON public.inspection_tasks(status);
CREATE INDEX IF NOT EXISTS idx_inspection_tasks_due_date ON public.inspection_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_prop_audit_history_prop ON public.property_audit_history(prop_id);
CREATE INDEX IF NOT EXISTS idx_prop_audit_history_task ON public.property_audit_history(task_id);
CREATE INDEX IF NOT EXISTS idx_prop_audit_history_date ON public.property_audit_history(inspected_at);
CREATE INDEX IF NOT EXISTS idx_prop_audit_history_condition ON public.property_audit_history(condition);

-- 6. Storage Bucket for Audit Evidence Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-photos', 'audit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Row Level Security Policies
ALTER TABLE public.inspection_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_audit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to inspection_tasks"
ON public.inspection_tasks FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update access to inspection_tasks"
ON public.inspection_tasks FOR ALL USING (true);

CREATE POLICY "Allow public read access to property_audit_history"
ON public.property_audit_history FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to property_audit_history"
ON public.property_audit_history FOR ALL USING (true);
