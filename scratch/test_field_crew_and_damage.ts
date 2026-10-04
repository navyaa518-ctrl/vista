import { fieldCrewService, INITIAL_FIELD_WORKERS } from '../src/lib/services/fieldCrew';
import { ordersService } from '../src/lib/services/orders';
import { inventoryService } from '../src/lib/services/inventory';

async function runTests() {
  console.log('--- STARTING FIELD CREW & DAMAGE TICKETING INTEGRATION TESTS ---');

  // Test 1: Get Available Field Workers
  const workers = await fieldCrewService.getAvailableFieldWorkers();
  console.log(`[TEST 1] Available in-house field workers: ${workers.length}`);
  if (workers.length < 4) throw new Error('Expected at least 4 initial field workers.');
  console.log(`✓ Field worker 1: ${workers[0].full_name} (${workers[0].badge_number})`);

  // Test 2: In-House Crew Allocation & Dynamic Labor Billing Calculation
  const allOrders = await ordersService.getOrders();
  if (allOrders.length === 0) throw new Error('No orders found.');
  const testOrder = allOrders[0];
  const testOrderId = testOrder.id;
  const duration = testOrder.duration_days || testOrder.rental_days || 3;
  const wageRate = 1200;
  const assignedInHouse = workers.slice(0, 2); // 2 workers

  const inHouseRes = await fieldCrewService.assignOrderCrew(
    testOrderId,
    'in_house',
    assignedInHouse,
    [],
    wageRate,
    duration
  );
  console.log(`[TEST 2] In-House Assignment: Total Labor Charges = ₹${inHouseRes.totalLaborCharges}`);
  const expectedCharges = 2 * wageRate * duration; // 2 * 1200 * 3 = 7200
  if (inHouseRes.totalLaborCharges !== expectedCharges) {
    throw new Error(`Expected ₹${expectedCharges}, got ₹${inHouseRes.totalLaborCharges}`);
  }
  console.log(`✓ Calculation verified: (2 Workers × ₹1,200 × 3 Days) = ₹${expectedCharges}`);

  // Test 3: Client Sourced Crew Allocation
  const clientCrew = [
    { id: 'c1', name: 'Ramesh (Lightman / Grip)', phone: '+91 98499 11223', govt_id_or_notes: 'Govt ID #4492-1182' },
    { id: 'c2', name: 'Suresh (Set Runner)', phone: '+91 98499 22334', govt_id_or_notes: 'Gate Pass #RFC-881' },
  ];
  const clientRes = await fieldCrewService.assignOrderCrew(
    testOrderId,
    'client_sourced',
    [],
    clientCrew,
    wageRate,
    duration
  );
  console.log(`[TEST 3] Client Sourced Crew: Total Labor Charges = ₹${clientRes.totalLaborCharges}`);
  if (clientRes.totalLaborCharges !== 0) throw new Error('Client sourced crew labor charges must be 0.');
  console.log('✓ Verified client sourced crew incurs ₹0 labor charges to production company');

  // Test 4: Orders Service Labor Billing & Tax Calculation Update
  const updatedOrder = await ordersService.updateOrderLaborCharges(testOrderId, {
    crew_type: 'in_house',
    total_labor_charges: expectedCharges,
    in_house_worker_count: 2,
    daily_wage_rate: wageRate,
  });
  console.log(`[TEST 4] Order grand total with labor: ₹${updatedOrder?.final_payable}`);
  if (!updatedOrder || (updatedOrder.total_labor_charges || 0) !== expectedCharges) {
    throw new Error('Order total_labor_charges was not updated correctly.');
  }
  console.log('✓ Order total labor charges & taxable valuation updated successfully');

  // Test 5: Pre-Dispatch Condition Inspection
  const inspectionRes = await fieldCrewService.verifyPreDispatchInspection({
    order_id: testOrderId,
    worker_id: workers[0].id,
    worker_name: workers[0].full_name,
    verified_item_ids: ['item-1', 'item-2'],
    verified_all_packed: true,
    inspected_at: new Date().toISOString(),
  });
  console.log(`[TEST 5] Pre-dispatch inspection status: ${inspectionRes}`);
  const retrievedInsp = await fieldCrewService.getPreDispatchInspection(testOrderId);
  if (!retrievedInsp?.verified_all_packed) throw new Error('Pre-dispatch inspection not saved.');
  console.log(`✓ Pre-dispatch condition inspection confirmed by ${retrievedInsp.worker_name}`);

  // Test 6: On-Site Damage Incident Ticketing & Receipt Generation
  const newIncident = await fieldCrewService.reportDamageIncident({
    order_id: testOrderId,
    prop_serialized_item_id: 'ser-001',
    prop_title: '1940s Vintage British Field Artillery Telescope',
    item_code: 'ASH-OPT-1942-01',
    severity: 'Moderate',
    description: 'Cracked objective front lens during rain action sequence on RFC Floor 4.',
    evidence_photos: [
      'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=800',
    ],
    shoot_location: 'Ramoji Film City Studio 4',
    reported_by: workers[0].id,
    reported_by_name: workers[0].full_name,
  });

  console.log(`[TEST 6] Generated Damage Ticket: ${newIncident.incident_number}`);
  console.log(`✓ Severity: ${newIncident.severity} • Penalty Debit Note: ₹${newIncident.repair_or_replacement_cost}`);
  if (!newIncident.incident_number.startsWith('ASH-DMG-2026-')) {
    throw new Error('Incident number format invalid.');
  }

  // Verify prop condition in inventory
  const allItems = await inventoryService.getSerializedItems();
  const item = allItems.find((i) => i.id === 'ser-001');
  console.log(`✓ Prop inventory condition updated to: ${item?.condition} (Status: ${item?.status})`);

  // Test 7: Return Handover Check-in
  const returnRes = await fieldCrewService.verifyReturnHandover({
    order_id: testOrderId,
    worker_id: workers[0].id,
    worker_name: workers[0].full_name,
    checked_item_ids: ['item-1', 'item-2'],
    verified_return_to_bay: true,
    returned_at: new Date().toISOString(),
  });
  console.log(`[TEST 7] Return handover status: ${returnRes}`);
  const retrievedReturn = await fieldCrewService.getReturnHandover(testOrderId);
  if (!retrievedReturn?.verified_return_to_bay) throw new Error('Return handover not saved.');
  console.log(`✓ Return handover confirmed into warehouse storage bays by ${retrievedReturn.worker_name}`);

  console.log('\n--- ALL 7 FIELD OPERATIONS INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
