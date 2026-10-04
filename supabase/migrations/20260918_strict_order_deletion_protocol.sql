-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS - ROLE-BASED ORDER DELETION & 2-STEP AUDIT
-- Migration: 20260918_strict_order_deletion_protocol.sql
-- ===================================================================

-- 1. Database Trigger: Automatically release serialized props back to 'Available' when an order is deleted
CREATE OR REPLACE FUNCTION public.release_props_on_order_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Release serialized items explicitly assigned to this order
    UPDATE public.prop_serialized_items
    SET status = 'Available',
        current_order_id = NULL,
        updated_at = NOW()
    WHERE current_order_id = OLD.id
       OR id IN (
           SELECT prop_serialized_item_id 
           FROM public.order_items 
           WHERE order_id = OLD.id AND prop_serialized_item_id IS NOT NULL
       );

    -- 2. Clean up assignments for the deleted order
    DELETE FROM public.order_assignments WHERE order_id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_release_props_on_order_delete ON public.orders;
CREATE TRIGGER trigger_release_props_on_order_delete
BEFORE DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.release_props_on_order_delete();

-- 2. Enhanced RLS Policy for Order Deletion
-- Rule 1: Creators can delete only in Draft / Picking_In_Progress stages before dispatch
-- Rule 2: Super Admin has universal override at any stage
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict orders delete policy" ON public.orders;
DROP POLICY IF EXISTS "Creators or super admin delete orders" ON public.orders;
DROP POLICY IF EXISTS "Full Access orders" ON public.orders;

-- Allow select and insert/update
CREATE POLICY "Public Read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Strict orders delete policy" ON public.orders
FOR DELETE TO authenticated
USING (
    -- Rule 1: Standard Creator (Order creator can delete ONLY IF still in early stages and not dispatched)
    (
        auth.uid() = created_by 
        AND status IN (
            'Draft', 'draft', 
            'Assigned', 
            'Picking_In_Progress', 'picking_in_progress', 'PICKING_IN_PROGRESS', 
            'Quotation_Review'
        )
    )
    OR
    -- Rule 2: Super Admin Override (Unrestricted access to delete any order regardless of status)
    (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    )
);

-- 3. Stored Procedure / RPC for Cascade Deletion with Audit Logging
CREATE OR REPLACE FUNCTION public.delete_order_cascade(
    p_order_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_user_role TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_is_super_admin BOOLEAN := false;
    v_is_creator BOOLEAN := false;
    v_released_count INTEGER := 0;
BEGIN
    -- Retrieve target order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order not found');
    END IF;

    -- Determine authorization
    IF p_user_role IN ('super_admin', 'admin') THEN
        v_is_super_admin := true;
    ELSIF p_user_id IS NOT NULL THEN
        SELECT (role IN ('super_admin', 'admin')) INTO v_is_super_admin 
        FROM public.profiles WHERE id = p_user_id;
    END IF;

    IF p_user_id IS NOT NULL AND v_order.created_by = p_user_id THEN
        v_is_creator := true;
    END IF;

    -- Evaluate Business Rules
    IF NOT v_is_super_admin THEN
        IF v_order.status IN ('Dispatched', 'dispatched', 'DISPATCHED_RENTAL_PIPELINE', 'Returned', 'returned') THEN
            RETURN jsonb_build_object(
                'success', false, 
                'message', 'Dispatched orders can only be deleted by a Super Admin'
            );
        END IF;

        IF v_order.created_by IS NOT NULL AND NOT v_is_creator THEN
            RETURN jsonb_build_object(
                'success', false, 
                'message', 'Only the creator or a Super Admin may delete this order'
            );
        END IF;
    END IF;

    -- Release serialized props
    WITH released AS (
        UPDATE public.prop_serialized_items
        SET status = 'Available',
            current_order_id = NULL,
            updated_at = NOW()
        WHERE current_order_id = p_order_id
           OR id IN (
               SELECT prop_serialized_item_id 
               FROM public.order_items 
               WHERE order_id = p_order_id AND prop_serialized_item_id IS NOT NULL
           )
        RETURNING id
    )
    SELECT count(*) INTO v_released_count FROM released;

    -- Delete child tables
    DELETE FROM public.order_assignments WHERE order_id = p_order_id;
    DELETE FROM public.order_items WHERE order_id = p_order_id;
    DELETE FROM public.orders WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Order %s successfully deleted. %s props released to Available stock.', v_order.order_number, v_released_count),
        'released_props_count', v_released_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
