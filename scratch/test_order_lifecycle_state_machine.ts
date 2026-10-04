/**
 * Comprehensive Automated Test Suite: Order Lifecycle State Machine & Terminal Lock Protection
 * 
 * Verifies:
 * 1. State machine transition DAG integrity.
 * 2. Terminal immutable locking for CLOSED orders.
 * 3. Prevention of illegal transitions (e.g., CLOSED -> DISPATCHED, CLOSED -> ON_SITE).
 * 4. Full End-to-End Order Lifecycle (Create -> Add Props -> Dispatch -> Return & Close -> Locked Verification).
 * 5. Prevention of service mutations (dispatchOrder, updateActualShootDays, recordAdvancePayment, scanAndAddOrderItem, deleteOrderItem) on locked orders.
 * 6. Active pipeline vs Completed/Locked archive filtering.
 */

// Setup window/localStorage environment for Node testing
const mockStorage: Record<string, string> = {};
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

import {
  ORDER_STATE_TRANSITIONS,
  normalizeOrderState,
  isValidStateTransition,
  assertCanTransition,
  isOrderLocked,
  assertOrderNotLocked,
  canDispatchOrder,
  canEditOrderProps,
  OrderLockedError,
  InvalidStateTransitionError,
} from '../src/lib/services/orderStateMachine';
import { ordersService } from '../src/lib/services/orders';
import { WalkInOrder } from '../src/types/orders';

async function runTestSuite() {
  console.log('🚀 [TEST SUITE START]: Order Lifecycle State Machine & Terminal Lock Protection\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: State Machine Constants & Canonicalization
  console.log('--- TEST GROUP 1: Canonical State Normalization & DAG Transitions ---');
  assert(ORDER_STATE_TRANSITIONS.CLOSED.length === 0, 'CLOSED state is terminal (0 outgoing transitions)');
  assert(ORDER_STATE_TRANSITIONS.RETURNED.includes('CLOSED'), 'RETURNED allows transition to CLOSED');
  assert(normalizeOrderState('Dispatched') === 'DISPATCHED', 'Normalizes "Dispatched" to "DISPATCHED"');
  assert(normalizeOrderState('returned') === 'RETURNED', 'Normalizes "returned" to "RETURNED"');
  assert(normalizeOrderState('Closed') === 'CLOSED', 'Normalizes "Closed" to "CLOSED"');
  assert(normalizeOrderState('Verified_Closed') === 'CLOSED', 'Normalizes "Verified_Closed" to "CLOSED"');

  // TEST 2: Valid vs Invalid Transitions
  console.log('\n--- TEST GROUP 2: State Machine Allowed vs Forbidden Transitions ---');
  assert(isValidStateTransition('DRAFT', 'QUOTATION'), 'DRAFT -> QUOTATION allowed');
  assert(isValidStateTransition('QUOTATION', 'DISPATCHED'), 'QUOTATION -> DISPATCHED allowed');
  assert(isValidStateTransition('DISPATCHED', 'ON_SITE'), 'DISPATCHED -> ON_SITE allowed');
  assert(isValidStateTransition('ON_SITE', 'RETURN_IN_PROGRESS'), 'ON_SITE -> RETURN_IN_PROGRESS allowed');
  assert(isValidStateTransition('RETURN_IN_PROGRESS', 'RETURNED'), 'RETURN_IN_PROGRESS -> RETURNED allowed');
  assert(isValidStateTransition('RETURNED', 'CLOSED'), 'RETURNED -> CLOSED allowed');

  // Forbidden regressions
  assert(!isValidStateTransition('CLOSED', 'DISPATCHED'), 'FORBIDDEN: CLOSED -> DISPATCHED is blocked');
  assert(!isValidStateTransition('CLOSED', 'DRAFT'), 'FORBIDDEN: CLOSED -> DRAFT is blocked');
  assert(!isValidStateTransition('CLOSED', 'ON_SITE'), 'FORBIDDEN: CLOSED -> ON_SITE is blocked');
  assert(!isValidStateTransition('CLOSED', 'RETURN_IN_PROGRESS'), 'FORBIDDEN: CLOSED -> RETURN_IN_PROGRESS is blocked');
  assert(!isValidStateTransition('CLOSED', 'QUOTATION'), 'FORBIDDEN: CLOSED -> QUOTATION is blocked');

  // Exception assertions
  let threwExpected = false;
  try {
    assertCanTransition({ order_number: 'ORD-LOCK-TEST', status: 'CLOSED', is_locked: true }, 'DISPATCHED');
  } catch (err: any) {
    if (err instanceof OrderLockedError || err instanceof InvalidStateTransitionError) {
      threwExpected = true;
    }
  }
  assert(threwExpected, 'assertCanTransition throws OrderLockedError or InvalidStateTransitionError when attempting to re-dispatch a CLOSED order');

  // TEST 3: isOrderLocked detection
  console.log('\n--- TEST GROUP 3: Order Locking Detection ---');
  const openOrder: Partial<WalkInOrder> = {
    id: 'ord-open-1',
    order_number: 'ORD-2026-OPEN',
    status: 'DISPATCHED_RENTAL_PIPELINE',
    lifecycle_status: 'On_Site_Active',
    is_locked: false,
    is_archived_or_closed: false,
  };

  const closedOrderA: Partial<WalkInOrder> = {
    id: 'ord-closed-1',
    order_number: 'ORD-2026-CLOSED-1',
    status: 'CLOSED',
    lifecycle_status: 'Verified_Closed',
    is_locked: true,
    is_archived_or_closed: true,
    closed_at: new Date().toISOString(),
  };

  const legacyReturnedOrder: Partial<WalkInOrder> = {
    id: 'ord-returned-legacy',
    order_number: 'ORD-2026-LEGACY-RET',
    status: 'Returned',
    is_locked: false,
    is_archived_or_closed: false,
  };

  assert(!isOrderLocked(openOrder), 'Open dispatched order is not locked');
  assert(isOrderLocked(closedOrderA), 'Order with is_locked=true, status=CLOSED is locked');
  assert(isOrderLocked(legacyReturnedOrder), 'Legacy order with status="Returned" is safely detected as locked');

  assert(canDispatchOrder(openOrder).allowed === false, 'Cannot re-dispatch already dispatched order');
  assert(canDispatchOrder(closedOrderA).allowed === false, 'Cannot dispatch closed order');
  assert(canEditOrderProps(openOrder).allowed === false, 'Cannot edit props of dispatched order');
  assert(canEditOrderProps(closedOrderA).allowed === false, 'Cannot edit props of closed order');

  // TEST 4: Full End-to-End Order Creation, Props Attachment, Dispatch, Return & Terminal Lock
  console.log('\n--- TEST GROUP 4: Full End-to-End Lifecycle & Terminal Lock Verification ---');
  const newOrder = await ordersService.createWalkInOrder({
    production_company_name: 'Mythri Movie Makers',
    client_contact_number: '+91 98490 11223',
    client_email_address: 'mythri@productions.com',
    movie_project_name: 'VFX Action Thriller',
    estimated_start_date: '2026-09-20',
    estimated_return_date: '2026-09-25',
    duration_days: 5,
    shoot_location: 'Ramoji Film City',
    assigned_executives: [],
  });

  assert(Boolean(newOrder && newOrder.id), 'Successfully created new walk-in order');
  assert(newOrder.status === 'PICKING_IN_PROGRESS', 'New order starts in PICKING_IN_PROGRESS');
  assert(!isOrderLocked(newOrder), 'New order is not locked');

  // Attach prop items to order
  mockStorage['ashwa_walkin_order_items_v1'] = JSON.stringify([
    {
      id: 'item-demo-1',
      order_id: newOrder.id,
      prop_id: 'prop-alexa',
      prop_title: 'Arri Alexa Mini LF Camera Kit',
      item_code: 'CAM-001',
      daily_rent_price: 15000,
      rental_days: 5,
      quantity: 1,
      line_total: 75000,
      replacement_value: 3500000,
      scanned_at: new Date().toISOString(),
      status: 'picked',
    },
  ]);

  // Dispatch order
  const dispatchRes = await ordersService.dispatchOrder(newOrder.id, {
    vehicle_number: 'TS 09 UA 9999',
    driver_name: 'Venkat',
    driver_phone: '+91 98888 77777',
    crew_type: 'in_house',
    in_house_workers: [{ id: 'crew-1' }, { id: 'crew-2' }],
    client_crew: [],
    daily_wage: 750,
    total_labor_charges: 7500,
  });
  assert(dispatchRes.success === true, 'Successfully dispatched order to rental pipeline');

  const dispatchedOrder = await ordersService.getOrderById(newOrder.id);
  assert(
    dispatchedOrder?.status === 'DISPATCHED_RENTAL_PIPELINE' || dispatchedOrder?.status === 'Dispatched',
    'Order is marked as DISPATCHED in pipeline'
  );
  assert(!isOrderLocked(dispatchedOrder), 'Dispatched order is active (not locked)');

  // Confirm warehouse return sign-off -> Transitions to CLOSED & LOCKED
  const returnRes = await ordersService.confirmWarehouseReturn(newOrder.id, {
    verified_by: 'Floor Manager Rajesh',
    warehouse_condition_rating: 'Pristine',
    warehouse_notes: 'All props returned in pristine condition. Floor inspected and signed off.',
  });
  assert(Boolean(returnRes), 'Successfully confirmed return verification');

  const closedOrder = await ordersService.getOrderById(newOrder.id);
  assert(closedOrder?.status === 'CLOSED', 'Order status is canonical CLOSED');
  assert(closedOrder?.lifecycle_status === 'Verified_Closed', 'Order lifecycle_status is Verified_Closed');
  assert(closedOrder?.is_locked === true, 'Order is_locked is true');
  assert(closedOrder?.is_archived_or_closed === true, 'Order is_archived_or_closed is true');
  assert(isOrderLocked(closedOrder), 'isOrderLocked returns true for returned and closed order');

  // TEST 5: Assert Mutation Prevention on the Closed Order
  console.log('\n--- TEST GROUP 5: Mutation Prevention on Closed Order ---');
  
  // Re-dispatch attempt
  const reDispatchRes = await ordersService.dispatchOrder(newOrder.id, {
    vehicle_number: 'TS 09 UA 8888',
    driver_name: 'Intruder',
    driver_phone: '+91 99999 99999',
    crew_type: 'client_sourced',
    client_crew: [],
    daily_wage: 0,
    total_labor_charges: 0,
  });
  assert(reDispatchRes.success === false, 'dispatchOrder rejects re-dispatch on closed order');
  assert(reDispatchRes.message.includes('closed') || reDispatchRes.message.includes('locked'), 'dispatchOrder returns locked order error message');

  // Shoot days adjustment attempt
  try {
    await ordersService.updateActualShootDays(newOrder.id, 10);
    assert(false, 'updateActualShootDays should throw OrderLockedError on closed order');
  } catch (err) {
    assert(err instanceof OrderLockedError, 'updateActualShootDays throws OrderLockedError on closed order');
  }

  // Advance payment recording attempt
  try {
    await ordersService.recordAdvancePayment(newOrder.id, 50000, 'Bank Transfer');
    assert(false, 'recordAdvancePayment should throw OrderLockedError on closed order');
  } catch (err) {
    assert(err instanceof OrderLockedError, 'recordAdvancePayment throws OrderLockedError on closed order');
  }

  // Adding prop attempt
  try {
    await ordersService.scanAndAddOrderItem(newOrder.id, 'PROP-101', 'EXEC-1', 'Ravi Kumar');
    assert(false, 'scanAndAddOrderItem should throw OrderLockedError on closed order');
  } catch (err) {
    assert(err instanceof OrderLockedError, 'scanAndAddOrderItem throws OrderLockedError on closed order');
  }

  // Deleting prop attempt
  try {
    await ordersService.deleteOrderItem(newOrder.id, 'item-demo-1');
    assert(false, 'deleteOrderItem should throw OrderLockedError on closed order');
  } catch (err) {
    assert(err instanceof OrderLockedError, 'deleteOrderItem throws OrderLockedError on closed order');
  }

  // TEST 6: Pipeline & Completed Archive Partitioning
  console.log('\n--- TEST GROUP 6: Active Pipeline vs Completed Archive Query Partitioning ---');
  const activeOrders = await ordersService.getActiveOrders();
  assert(!activeOrders.some(o => o.id === newOrder.id), 'Active pipeline query strictly EXCLUDES closed order');
  assert(activeOrders.every(o => !isOrderLocked(o)), 'All active pipeline orders are non-locked');

  const completedOrders = await ordersService.getCompletedOrders();
  assert(completedOrders.some(o => o.id === newOrder.id), 'Completed archive query strictly INCLUDES closed order');
  assert(completedOrders.every(o => isOrderLocked(o)), 'All completed archive orders are permanently locked');

  console.log(`\n======================================================`);
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
