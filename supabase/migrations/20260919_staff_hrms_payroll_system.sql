-- ============================================================================
-- ASHWA MOVIE PROPERTY RENTALS: INTERNAL STAFF, AUDIT LOGS, LEAVES & PAYROLL
-- Migration Date: 2026-09-19
-- Target Group: Strictly Internal Staff (Sales, Billing, Logistics, Auditing)
-- Crew members are excluded (handled separately under Crew Hub)
-- ============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE staff_department AS ENUM (
        'RENTAL_SALES',
        'BILLING',
        'LOGISTICS_FLEET',
        'AUDITING_GOVERNANCE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE staff_employment_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'ON_LEAVE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE staff_leave_status AS ENUM (
        'PENDING',
        'APPROVED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE staff_payroll_status AS ENUM (
        'DRAFT',
        'PAID'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE: staff_profiles
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT UNIQUE NOT NULL, -- e.g. ASH-STF-001
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    department staff_department NOT NULL DEFAULT 'RENTAL_SALES',
    designation TEXT NOT NULL,
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 45000.00,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status staff_employment_status NOT NULL DEFAULT 'ACTIVE',
    emergency_contact TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLE: staff_activity_logs (Centralized System Action Interceptor)
CREATE TABLE IF NOT EXISTS public.staff_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    staff_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- ORDER_DISPATCHED, PROPERTY_INSPECTED, INVOICE_CREATED, RETURN_CLEARED, LEAVE_REQUESTED, PAYROLL_GENERATED
    target_entity TEXT NOT NULL, -- 'ORDER', 'INSPECTION', 'BILLING', 'LEAVE', 'PAYROLL'
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g. { "client": "Mythri Movie Makers", "propsCount": 14, "vehicleNo": "TS09-UB-4421" }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE: staff_leaves
CREATE TABLE IF NOT EXISTS public.staff_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL, -- 'Casual', 'Sick', 'Emergency', 'Annual'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL DEFAULT 1,
    is_paid BOOLEAN NOT NULL DEFAULT true,
    reason TEXT NOT NULL,
    status staff_leave_status NOT NULL DEFAULT 'PENDING',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLE: staff_payrolls
CREATE TABLE IF NOT EXISTS public.staff_payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    pay_month TEXT NOT NULL, -- 'January', 'September', etc.
    pay_year INT NOT NULL, -- 2026
    base_salary NUMERIC(12, 2) NOT NULL,
    total_days INT NOT NULL, -- 30, 31, etc.
    days_worked INT NOT NULL,
    unpaid_leave_days INT NOT NULL DEFAULT 0,
    allowances NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(12, 2) NOT NULL,
    payment_status staff_payroll_status NOT NULL DEFAULT 'DRAFT',
    payment_ref TEXT, -- e.g. NEFT-202609-0012, IMPS-9847291
    payment_mode TEXT DEFAULT 'NEFT', -- 'NEFT', 'IMPS', 'UPI', 'CASH'
    disbursed_at TIMESTAMPTZ,
    disbursed_by TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_staff_profiles_department ON public.staff_profiles(department);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_status ON public.staff_profiles(status);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_user_id ON public.staff_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_created_at ON public.staff_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_leaves_staff_id ON public.staff_leaves(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_leaves_status ON public.staff_leaves(status);
CREATE INDEX IF NOT EXISTS idx_staff_payrolls_staff_id ON public.staff_payrolls(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_payrolls_period ON public.staff_payrolls(pay_year, pay_month);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payrolls ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES (Strictly internal staff & managers)
CREATE POLICY "Allow read staff_profiles to all authenticated users"
ON public.staff_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all actions on staff_profiles to service role and admins"
ON public.staff_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read staff_activity_logs to authenticated users"
ON public.staff_activity_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert staff_activity_logs to authenticated users"
ON public.staff_activity_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow read and write staff_leaves to authenticated users"
ON public.staff_leaves FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read and write staff_payrolls to authenticated users"
ON public.staff_payrolls FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. SEED INITIAL INTERNAL STAFF DATA
INSERT INTO public.staff_profiles (id, staff_id, full_name, email, phone, department, designation, base_salary, joining_date, status, emergency_contact, notes)
VALUES
    ('stf-00000001-0000-0000-0000-000000000001', 'ASH-STF-001', 'Arun Reddy', 'arun.reddy@ashwaprops.com', '+91 98480 12345', 'BILLING', 'Billing & Commercial Operations Manager', 95000.00, '2024-03-15', 'ACTIVE', '+91 98480 99999', 'Oversees commercial invoicing, high-value deposit returns, and movie production clearances.'),
    ('stf-00000002-0000-0000-0000-000000000002', 'ASH-STF-002', 'Ravi Kumar', 'ravi.kumar@ashwaprops.com', '+91 98491 23456', 'RENTAL_SALES', 'Senior Rental Sales Executive (Floor 1 Lead)', 65000.00, '2024-06-01', 'ACTIVE', '+91 98491 88888', 'Leads walk-in quotations, studio consultations, and vintage prop packages.'),
    ('stf-00000003-0000-0000-0000-000000000003', 'ASH-STF-003', 'Vikram Singh', 'vikram.singh@ashwaprops.com', '+91 98492 34567', 'RENTAL_SALES', 'Senior Rental Sales Executive (Floor 2 Lead)', 65000.00, '2024-08-10', 'ACTIVE', '+91 98492 77777', 'In charge of Modern Armory, Sci-Fi sets, and digital production orders.'),
    ('stf-00000004-0000-0000-0000-000000000004', 'ASH-STF-004', 'Mohan Babu', 'mohan.babu@ashwaprops.com', '+91 98493 45678', 'LOGISTICS_FLEET', 'Fleet Dispatch Supervisor & Heavy Vehicle Lead', 48000.00, '2024-04-20', 'ACTIVE', '+91 98493 66666', 'Coordinates lorry dispatches, gate passes, driver documentation, and set deliveries.'),
    ('stf-00000005-0000-0000-0000-000000000005', 'ASH-STF-005', 'K. Sunita Devi', 'sunita.devi@ashwaprops.com', '+91 98494 56789', 'AUDITING_GOVERNANCE', 'Warehouse Property Auditor & QC Specialist', 52000.00, '2025-01-05', 'ACTIVE', '+91 98494 55555', 'Performs weekly zone audits, wear & tear gradings, rack reconciliations, and defect flagging.')
ON CONFLICT (staff_id) DO NOTHING;

-- 10. SEED INITIAL AUDIT ACTIVITY LOGS
INSERT INTO public.staff_activity_logs (id, user_id, staff_name, action_type, target_entity, entity_id, metadata, created_at)
VALUES
    ('act-00000001-0000-0000-0000-000000000001', 'stf-00000002-0000-0000-0000-000000000002', 'Ravi Kumar', 'ORDER_DISPATCHED', 'ORDER', 'ORD-2026-089', '{"client": "Mythri Movie Makers", "project": "Pushpa 3", "propsCount": 18, "vehicleNo": "TS09-UB-4421"}'::jsonb, NOW() - INTERVAL '2 days'),
    ('act-00000002-0000-0000-0000-000000000002', 'stf-00000005-0000-0000-0000-000000000005', 'K. Sunita Devi', 'PROPERTY_INSPECTED', 'INSPECTION', 'AUD-2026-003', '{"zone": "Floor 1 > Godown A", "propsAudited": 15, "accuracy": 93, "flaggedDamaged": 1}'::jsonb, NOW() - INTERVAL '1 day'),
    ('act-00000003-0000-0000-0000-000000000003', 'stf-00000001-0000-0000-0000-000000000001', 'Arun Reddy', 'INVOICE_CREATED', 'BILLING', 'INV-2026-041', '{"client": "Vyjayanthi Movies", "totalAmount": 185000, "depositAmount": 50000, "mode": "NEFT"}'::jsonb, NOW() - INTERVAL '4 hours'),
    ('act-00000004-0000-0000-0000-000000000004', 'stf-00000004-0000-0000-0000-000000000004', 'Mohan Babu', 'RETURN_CLEARED', 'ORDER', 'ORD-2026-085', '{"client": "Suresh Productions", "itemsReturned": 12, "transitStatus": "SAFE_UNLOADED"}'::jsonb, NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- 11. SEED INITIAL LEAVES
INSERT INTO public.staff_leaves (id, staff_id, leave_type, start_date, end_date, total_days, is_paid, reason, status, approved_by, approved_at)
VALUES
    ('lv-00000001-0000-0000-0000-000000000001', 'stf-00000002-0000-0000-0000-000000000002', 'Casual', CURRENT_DATE - 10, CURRENT_DATE - 9, 2, true, 'Family religious ceremony in hometown', 'APPROVED', 'Arun Reddy', NOW() - INTERVAL '12 days'),
    ('lv-00000002-0000-0000-0000-000000000002', 'stf-00000004-0000-0000-0000-000000000004', 'Emergency', CURRENT_DATE - 5, CURRENT_DATE - 4, 2, false, 'Vehicle maintenance and personal travel', 'APPROVED', 'Arun Reddy', NOW() - INTERVAL '6 days'),
    ('lv-00000003-0000-0000-0000-000000000003', 'stf-00000003-0000-0000-0000-000000000003', 'Sick', CURRENT_DATE + 2, CURRENT_DATE + 3, 2, true, 'Scheduled doctor visit and dental procedure', 'PENDING', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 12. SEED INITIAL HISTORICAL PAYROLL
INSERT INTO public.staff_payrolls (id, staff_id, pay_month, pay_year, base_salary, total_days, days_worked, unpaid_leave_days, allowances, deductions, net_salary, payment_status, payment_ref, payment_mode, disbursed_at, disbursed_by)
VALUES
    ('pay-00000001-0000-0000-0000-000000000001', 'stf-00000001-0000-0000-0000-000000000001', 'August', 2026, 95000.00, 31, 31, 0, 15000.00, 0.00, 110000.00, 'PAID', 'NEFT-202608-0011', 'NEFT', '2026-08-31 18:00:00+05:30', 'Managing Director'),
    ('pay-00000002-0000-0000-0000-000000000002', 'stf-00000002-0000-0000-0000-000000000002', 'August', 2026, 65000.00, 31, 31, 0, 18000.00, 0.00, 83000.00, 'PAID', 'NEFT-202608-0012', 'NEFT', '2026-08-31 18:00:00+05:30', 'Managing Director'),
    ('pay-00000003-0000-0000-0000-000000000003', 'stf-00000004-0000-0000-0000-000000000004', 'August', 2026, 48000.00, 31, 29, 2, 6000.00, 3096.77, 50903.23, 'PAID', 'IMPS-202608-0089', 'IMPS', '2026-08-31 18:00:00+05:30', 'Managing Director')
ON CONFLICT (id) DO NOTHING;
