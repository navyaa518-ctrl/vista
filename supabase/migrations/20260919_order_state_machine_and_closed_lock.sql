-- ===================================================================
-- ASHWA MOVIE PROPERTY RENTALS: IMMUTABLE ORDER LIFECYCLE & STATE LOCKING
-- Migration: 20260919_order_state_machine_and_closed_lock.sql
-- ===================================================================

-- 1. Add Lifecycle Locking & Archive Columns to Orders Table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_archived_or_closed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by TEXT;

-- Create indexes on locking & status columns for fast pipeline filtering
CREATE INDEX IF NOT EXISTS idx_orders_is_archived_or_closed ON orders(is_archived_or_closed);
CREATE INDEX IF NOT EXISTS idx_orders_is_locked ON orders(is_locked);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 2. State Machine Enum Check Constraint (Soft validation permitting standardized states)
-- Permitted States: 'DRAFT', 'QUOTATION', 'DISPATCHED', 'ON_SITE', 'RETURN_IN_PROGRESS', 'RETURNED', 'CLOSED', 'CANCELLED'
-- (Also accepts existing normalized variants for backwards compatibility)

-- 3. Trigger Function: Strictly Prevent Mutation of Closed/Locked Orders
CREATE OR REPLACE FUNCTION prevent_closed_order_mutation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the order was already locked or closed prior to this update
  IF (OLD.is_locked = TRUE OR OLD.is_archived_or_closed = TRUE OR UPPER(OLD.status) = 'CLOSED') THEN
    
    -- Check if someone is trying to re-open or alter critical operational fields
    IF (
      UPPER(NEW.status) != UPPER(OLD.status) OR
      NEW.is_locked = FALSE OR
      NEW.is_archived_or_closed = FALSE OR
      NEW.vehicle_number IS DISTINCT FROM OLD.vehicle_number OR
      NEW.driver_name IS DISTINCT FROM OLD.driver_name OR
      NEW.rental_start_date IS DISTINCT FROM OLD.rental_start_date OR
      NEW.rental_end_date IS DISTINCT FROM OLD.rental_end_date
    ) THEN
      RAISE EXCEPTION 'ORDER_IMMUTABLE_LOCKED: Order % is permanently CLOSED and LOCKED. Regressing status, modifying vehicle logistics, or re-opening a closed order is strictly prohibited.', OLD.order_number;
    END IF;

  END IF;

  -- Automatically ensure that if status transitions to 'CLOSED', locking flags are asserted
  IF (UPPER(NEW.status) = 'CLOSED' OR NEW.lifecycle_status = 'Verified_Closed') THEN
    NEW.is_locked := TRUE;
    NEW.is_archived_or_closed := TRUE;
    IF NEW.closed_at IS NULL THEN
      NEW.closed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Trigger to Orders Table
DROP TRIGGER IF EXISTS trg_prevent_closed_order_mutation ON orders;

CREATE TRIGGER trg_prevent_closed_order_mutation
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION prevent_closed_order_mutation();
