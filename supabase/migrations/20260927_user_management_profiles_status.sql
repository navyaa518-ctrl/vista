-- ==============================================================================
-- ASHWA MOVIE PROPERTY RENTALS - ENTERPRISE USER MANAGEMENT & SECURITY SCHEMA
-- Migration: 20260927_user_management_profiles_status.sql
-- Description: Adds status, department, and deletion flags to public.profiles.
-- ==============================================================================

-- 1. Extend profiles table with security lifecycle columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Operations',
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- 2. Create index on status, department, and role for rapid lookup
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Ensure Super Admin role is permitted to manage profiles
CREATE POLICY "Allow super_admin full access to profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);
