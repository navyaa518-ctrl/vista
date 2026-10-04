-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS - GUARANTEED ORDER DELETION & CASCADE
-- Migration: 20260918_delete_order_completely.sql
-- ===================================================================

-- 1. Ensure Foreign Keys have ON DELETE CASCADE
ALTER TABLE IF EXISTS public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
  ADD CONSTRAINT order_items_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.order_assignments 
  DROP CONSTRAINT IF EXISTS order_assignments_order_id_fkey,
  ADD CONSTRAINT order_assignments_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.prop_rental_history 
  DROP CONSTRAINT IF EXISTS prop_rental_history_order_id_fkey,
  ADD CONSTRAINT prop_rental_history_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- 2. Create a Transactional RPC Function for Clean, Guaranteed Super Admin Deletion
CREATE OR REPLACE FUNCTION public.delete_order_completely(target_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to ensure clean cleanup
AS $$
DECLARE
  v_role TEXT;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  -- Get current user's role from profiles
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;

  -- Verify permissions: Must be super_admin/admin or creator of draft order
  IF v_role != 'super_admin' AND v_role != 'admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = target_order_id 
        AND (created_by = v_user_id OR created_by IS NULL)
        AND LOWER(status) IN ('draft', 'picking_in_progress')
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Only Super Admin can delete active or dispatched orders.';
    END IF;
  END IF;

  -- Step A: Release all serialized props back to 'Available' status
  UPDATE public.prop_serialized_items
  SET status = 'Available',
      current_order_id = NULL
  WHERE current_order_id = target_order_id
     OR id IN (
       SELECT prop_serialized_item_id 
       FROM public.order_items 
       WHERE order_id = target_order_id AND prop_serialized_item_id IS NOT NULL
     );

  -- Step B: Clean up child tables explicitly if cascade is not triggered
  DELETE FROM public.order_items WHERE order_id = target_order_id;
  DELETE FROM public.order_assignments WHERE order_id = target_order_id;
  DELETE FROM public.prop_rental_history WHERE order_id = target_order_id;
  
  -- Step C: Delete the main order
  DELETE FROM public.orders WHERE id = target_order_id;

  RETURN jsonb_build_object('success', true, 'deleted_order_id', target_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.delete_order_completely(UUID) TO authenticated, service_role, anon;
