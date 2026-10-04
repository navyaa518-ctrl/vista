/**
 * ASHWA Movie Property Rentals - Order Lifecycle State Machine
 * Pure functions enforcing immutable states, DAG transitions, and strict terminal locking.
 */

export type CanonicalOrderState =
  | 'DRAFT'
  | 'QUOTATION'
  | 'DISPATCHED'
  | 'ON_SITE'
  | 'RETURN_IN_PROGRESS'
  | 'RETURNED'
  | 'CLOSED'
  | 'CANCELLED';

/**
 * Permitted State Transitions Directed Acyclic Graph (DAG)
 * CLOSED and CANCELLED are strictly terminal with ZERO outgoing transitions.
 */
export const ORDER_STATE_TRANSITIONS: Record<CanonicalOrderState, readonly CanonicalOrderState[]> = {
  DRAFT: ['QUOTATION', 'CANCELLED'],
  QUOTATION: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['ON_SITE', 'RETURN_IN_PROGRESS', 'CANCELLED'],
  ON_SITE: ['RETURN_IN_PROGRESS'],
  RETURN_IN_PROGRESS: ['RETURNED'],
  RETURNED: ['CLOSED'],
  CLOSED: [], // Terminal / Immutable state
  CANCELLED: [], // Terminal state
};

/**
 * Custom Error for State Regression or Mutating Locked Orders
 */
export class OrderLockedError extends Error {
  constructor(orderNumber: string, action = 'modify') {
    super(
      `ORDER_IMMUTABLE_LOCKED: Order ${orderNumber} is permanently CLOSED and LOCKED. Attempting to ${action} or regress its status is strictly prohibited.`
    );
    this.name = 'OrderLockedError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(fromState: string, toState: string, orderNumber?: string) {
    super(
      `INVALID_STATE_TRANSITION: Cannot transition order ${orderNumber || ''} from '${fromState}' to '${toState}'. Permitted transitions from '${fromState}': [${(ORDER_STATE_TRANSITIONS[fromState as CanonicalOrderState] || []).join(', ')}]`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Normalizes legacy, mixed-case, and UI status strings to CanonicalOrderState
 */
export function normalizeOrderState(rawStatus?: string | null): CanonicalOrderState {
  if (!rawStatus) return 'DRAFT';
  const s = rawStatus.trim().toUpperCase();

  if (s === 'CLOSED' || s === 'VERIFIED_CLOSED' || s === 'CLOSED_ARCHIVED') return 'CLOSED';
  if (s === 'RETURNED') return 'RETURNED';
  if (s === 'RETURN_IN_PROGRESS' || s === 'RETURN_INITIATED') return 'RETURN_IN_PROGRESS';
  if (s === 'ON_SITE' || s === 'ON_SITE_ACTIVE') return 'ON_SITE';
  if (s === 'DISPATCHED' || s === 'DISPATCHED_RENTAL_PIPELINE') return 'DISPATCHED';
  if (s === 'QUOTATION' || s === 'QUOTATION_REVIEW' || s === 'CONFIRMED' || s === 'PICKED_VERIFIED') return 'QUOTATION';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  if (s === 'DRAFT' || s === 'PICKING_IN_PROGRESS' || s === 'ASSIGNED') return 'DRAFT';

  return 'DRAFT';
}

/**
 * Check if an order is in a permanently locked / immutable state
 */
export function isOrderLocked(
  order?: {
    status?: string;
    lifecycle_status?: string;
    is_locked?: boolean;
    is_archived_or_closed?: boolean;
  } | null
): boolean {
  if (!order) return false;

  if (order.is_locked === true) return true;
  if (order.is_archived_or_closed === true) return true;

  const canon = normalizeOrderState(order.status);
  if (canon === 'CLOSED' || canon === 'RETURNED') return true;

  if (order.lifecycle_status === 'Verified_Closed') return true;

  return false;
}

/**
 * Throws an OrderLockedError if the order is locked
 */
export function assertOrderNotLocked(
  order: {
    order_number?: string;
    status?: string;
    lifecycle_status?: string;
    is_locked?: boolean;
    is_archived_or_closed?: boolean;
  },
  action = 'modify'
): void {
  if (isOrderLocked(order)) {
    throw new OrderLockedError(order.order_number || 'UNKNOWN', action);
  }
}

/**
 * Validates whether transition from currentState to nextState is permitted
 */
export function isValidStateTransition(
  currentState: string,
  nextState: string
): boolean {
  const from = normalizeOrderState(currentState);
  const to = normalizeOrderState(nextState);

  // If already in that state, it's an idempotent no-op
  if (from === to) return true;

  const allowedNext = ORDER_STATE_TRANSITIONS[from];
  if (!allowedNext) return false;

  return allowedNext.includes(to);
}

/**
 * Asserts that the transition is permitted, otherwise throws an error
 */
export function assertCanTransition(
  order: {
    order_number?: string;
    status?: string;
    lifecycle_status?: string;
    is_locked?: boolean;
    is_archived_or_closed?: boolean;
  },
  targetState: string
): void {
  // If order is locked, no outgoing transition is permitted under any circumstance
  if (isOrderLocked(order)) {
    throw new OrderLockedError(
      order.order_number || 'UNKNOWN',
      `transition to '${targetState}'`
    );
  }

  const currentCanonical = normalizeOrderState(order.status);
  const targetCanonical = normalizeOrderState(targetState);

  if (!isValidStateTransition(currentCanonical, targetCanonical)) {
    throw new InvalidStateTransitionError(
      currentCanonical,
      targetCanonical,
      order.order_number
    );
  }
}

/**
 * Checks if an order can be dispatched
 */
export function canDispatchOrder(order?: {
  status?: string;
  is_locked?: boolean;
  is_archived_or_closed?: boolean;
  lifecycle_status?: string;
}): { allowed: boolean; reason?: string } {
  if (!order) return { allowed: false, reason: 'Order does not exist' };
  if (isOrderLocked(order)) {
    return {
      allowed: false,
      reason: 'Order is permanently closed and archived. Re-dispatch is prohibited.',
    };
  }
  const canon = normalizeOrderState(order.status);
  if (canon === 'DISPATCHED' || canon === 'ON_SITE') {
    return { allowed: false, reason: 'Order is already dispatched and on rent.' };
  }
  if (canon === 'RETURNED' || canon === 'CLOSED') {
    return { allowed: false, reason: 'Order has already completed its rental lifecycle.' };
  }
  return { allowed: true };
}

/**
 * Checks if an order's props can be edited (added or removed)
 */
export function canEditOrderProps(order?: {
  status?: string;
  is_locked?: boolean;
  is_archived_or_closed?: boolean;
}): { allowed: boolean; reason?: string } {
  if (!order) return { allowed: false, reason: 'Order does not exist' };
  if (isOrderLocked(order)) {
    return { allowed: false, reason: 'Order is closed and locked. Modifying props is prohibited.' };
  }
  const canon = normalizeOrderState(order.status);
  if (canon !== 'DRAFT' && canon !== 'QUOTATION') {
    return { allowed: false, reason: 'Props cannot be altered after lorry dispatch.' };
  }
  return { allowed: true };
}
