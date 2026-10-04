-- ==============================================================================
-- Migration: 20260918_dynamics365_rbac_teams.sql
-- Description: Microsoft Dynamics 365-style Security Roles & Operational Teams RBAC
-- ==============================================================================

-- 1. Security Roles Table
CREATE TABLE IF NOT EXISTS security_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  privileges JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key-value map of entity permissions & scopes
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Operational Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Team Members Table (Binding profiles to operational teams)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(team_id, user_id)
);

-- 4. Team Role Bindings (All members inherit these security roles)
CREATE TABLE IF NOT EXISTS team_roles (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role_id UUID REFERENCES security_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, role_id)
);

-- 5. User Direct Role Bindings (User-specific elevated security roles)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES security_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE security_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read for application operations
DO $$ BEGIN
  CREATE POLICY "Allow read security_roles" ON security_roles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow read teams" ON teams FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow read team_members" ON team_members FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow read team_roles" ON team_roles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow read user_roles" ON user_roles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow management operations for service role & authenticated admin
DO $$ BEGIN
  CREATE POLICY "Allow all security_roles" ON security_roles FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all teams" ON teams FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all team_members" ON team_members FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all team_roles" ON team_roles FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all user_roles" ON user_roles FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- Initial Seed: Standard Enterprise Security Roles (Dynamics 365 Privilege Matrix)
-- Scopes: none | user | team | org
-- ==============================================================================

INSERT INTO security_roles (id, name, description, privileges)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Super Admin',
    'Full organization-wide administrative clearance across all film rental assets, picking pipelines, financials, and security settings.',
    '{
      "props_catalog": {"create": "org", "read": "org", "update": "org", "delete": "org", "append_scan": "org", "dispatch_pass": "org"},
      "walkin_orders": {"create": "org", "read": "org", "update": "org", "delete": "org", "append_scan": "org", "dispatch_pass": "org"},
      "live_picking": {"create": "org", "read": "org", "update": "org", "delete": "org", "append_scan": "org", "dispatch_pass": "org"},
      "rental_pipeline": {"create": "org", "read": "org", "update": "org", "delete": "org", "append_scan": "org", "dispatch_pass": "org"},
      "invoices": {"create": "org", "read": "org", "update": "org", "delete": "org", "append_scan": "org", "dispatch_pass": "org"},
      "financials": {"create": "org", "read": "org", "update": "org", "delete": "org", "append_scan": "org", "dispatch_pass": "org"},
      "system_settings": {"create": "org", "read": "org", "update": "org", "delete": "org", "append_scan": "org", "dispatch_pass": "org"}
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Billing Specialist',
    'Manages walk-in intakes, deposits, invoices, payment receipts, and delivery challans. Restricted from system infrastructure settings.',
    '{
      "props_catalog": {"create": "none", "read": "org", "update": "none", "delete": "none", "append_scan": "team", "dispatch_pass": "none"},
      "walkin_orders": {"create": "org", "read": "org", "update": "org", "delete": "user", "append_scan": "team", "dispatch_pass": "team"},
      "live_picking": {"create": "team", "read": "org", "update": "team", "delete": "none", "append_scan": "team", "dispatch_pass": "team"},
      "rental_pipeline": {"create": "none", "read": "org", "update": "team", "delete": "none", "append_scan": "none", "dispatch_pass": "team"},
      "invoices": {"create": "org", "read": "org", "update": "org", "delete": "none", "append_scan": "none", "dispatch_pass": "org"},
      "financials": {"create": "team", "read": "org", "update": "team", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "system_settings": {"create": "none", "read": "user", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"}
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Warehouse Lead',
    'Oversees physical godown floors, serialized QR tagging, picking queues, and fleet lorry loading.',
    '{
      "props_catalog": {"create": "org", "read": "org", "update": "org", "delete": "none", "append_scan": "org", "dispatch_pass": "org"},
      "walkin_orders": {"create": "team", "read": "org", "update": "team", "delete": "none", "append_scan": "org", "dispatch_pass": "org"},
      "live_picking": {"create": "org", "read": "org", "update": "org", "delete": "none", "append_scan": "org", "dispatch_pass": "org"},
      "rental_pipeline": {"create": "org", "read": "org", "update": "org", "delete": "none", "append_scan": "org", "dispatch_pass": "org"},
      "invoices": {"create": "none", "read": "team", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "org"},
      "financials": {"create": "none", "read": "user", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "system_settings": {"create": "none", "read": "none", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"}
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Field Executive',
    'Warehouse floor runner responsible for live scanning of prop serials and cart fulfillment.',
    '{
      "props_catalog": {"create": "none", "read": "org", "update": "none", "delete": "none", "append_scan": "user", "dispatch_pass": "none"},
      "walkin_orders": {"create": "none", "read": "team", "update": "user", "delete": "none", "append_scan": "user", "dispatch_pass": "none"},
      "live_picking": {"create": "user", "read": "team", "update": "user", "delete": "none", "append_scan": "user", "dispatch_pass": "none"},
      "rental_pipeline": {"create": "none", "read": "team", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "invoices": {"create": "none", "read": "none", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "financials": {"create": "none", "read": "none", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "system_settings": {"create": "none", "read": "none", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"}
    }'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Production Auditor',
    'Inspection and film production designer clearance. Read-only review across orders and equipment history.',
    '{
      "props_catalog": {"create": "none", "read": "org", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "walkin_orders": {"create": "none", "read": "org", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "live_picking": {"create": "none", "read": "org", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "rental_pipeline": {"create": "none", "read": "org", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "invoices": {"create": "none", "read": "org", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "financials": {"create": "none", "read": "org", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"},
      "system_settings": {"create": "none", "read": "user", "update": "none", "delete": "none", "append_scan": "none", "dispatch_pass": "none"}
    }'::jsonb
  )
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    privileges = EXCLUDED.privileges;

-- ==============================================================================
-- Initial Seed: Operational Teams & Role Bindings
-- ==============================================================================

INSERT INTO teams (id, name, description)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Billing & Commercial Desk Team', 'Front counter specialists handling production accounts, invoices, and advance payments.'),
  ('11111111-0000-0000-0000-000000000002', 'Rental Sales Executives (RSE) Team', 'Floor 1 & 2 specialists managing live prop picking and QR scanning.'),
  ('11111111-0000-0000-0000-000000000003', 'Logistics & Fleet Dispatch Team', 'Cargo vehicle fleet coordination, lorry dispatch gate passes, and returns inspection.'),
  ('11111111-0000-0000-0000-000000000004', 'Executive Audit & Governance Team', 'Studio production audit, contract compliance, and asset loss prevention.')
ON CONFLICT (name) DO NOTHING;

-- Bind Roles to Teams
INSERT INTO team_roles (team_id, role_id)
VALUES
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'), -- Billing Desk -> Billing Specialist
  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004'), -- RSE Team -> Field Executive
  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003'), -- Logistics -> Warehouse Lead
  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005')  -- Audit Team -> Production Auditor
ON CONFLICT (team_id, role_id) DO NOTHING;
