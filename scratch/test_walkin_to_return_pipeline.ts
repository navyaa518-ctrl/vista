import { ordersService } from '../src/lib/services/orders';
import { crewHubService } from '../src/lib/services/crewHub';

async function runVerification() {
  console.log('🚀 [TEST] Starting Walk-In Order to Return & Billing Pipeline Verification...');

  // 1. Get orders
  const orders = await ordersService.getOrders();
  console.log(`✅ Loaded ${orders.length} orders.`);
  if (orders.length === 0) {
    console.error('❌ No orders available to test.');
    process.exit(1);
  }

  const testOrder = orders[0];
  console.log(`\n📌 Testing with Order: ${testOrder.order_number} (${testOrder.id})`);
  console.log(`   Initial Shoot Days: ${testOrder.rental_days || 3}`);
  console.log(`   Initial Rent: ₹${testOrder.total_rent_amount}`);

  // 2. Test dynamic shooting days update (e.g. adjust to 5 days)
  console.log('\n--- Test 2: Dynamic Shooting Days Adjustment ---');
  const targetDays = 5;
  await ordersService.updateActualShootDays(testOrder.id, targetDays);
  const updatedOrderAfterDays = await ordersService.getOrderById(testOrder.id);
  console.log(`   Updated Shoot Days: ${updatedOrderAfterDays?.actual_shoot_days}`);
  console.log(`   Recalculated Rent: ₹${updatedOrderAfterDays?.total_rent_amount}`);
  console.log(`   Recalculated Final Payable: ₹${updatedOrderAfterDays?.final_payable}`);
  if (updatedOrderAfterDays?.actual_shoot_days !== targetDays) {
    throw new Error('Shoot days update failed');
  }

  // 3. Test inline advance payment recording
  console.log('\n--- Test 3: Record Advance Payment ---');
  const advanceToRecord = 25000;
  await ordersService.recordAdvancePayment(testOrder.id, {
    amount: advanceToRecord,
    payment_mode: 'UPI',
    reference_number: 'UPI-TEST-998822',
    notes: '50% Production Token Advance',
  });
  const updatedOrderAfterAdv = await ordersService.getOrderById(testOrder.id);
  console.log(`   Advance Recorded: ₹${updatedOrderAfterAdv?.advance_amount}`);
  console.log(`   Advance Paid Flag: ${updatedOrderAfterAdv?.advance_paid}`);
  if (updatedOrderAfterAdv?.advance_amount !== advanceToRecord) {
    throw new Error('Advance payment recording failed');
  }

  // 4. Test Step A: Field Crew Check
  console.log('\n--- Test 4: Step A Field Crew Check ---');
  const items = await ordersService.getOrderItems(testOrder.id);
  await ordersService.initiateFieldReturn(testOrder.id, {
    initiated_by: 'Ramesh Kumar (Lead Field Crew)',
    confirmed_count: items.length,
    total_count: items.length,
    has_damages: true,
    damage_notes: 'Minor scratch on vintage spotlight lens',
    damage_estimated_cost: 1500,
  });
  const orderAfterStepA = await ordersService.getOrderById(testOrder.id);
  console.log(`   Step A Crew Return Status: ${orderAfterStepA?.return_status_crew}`);
  console.log(`   Pipeline Lifecycle Status: ${orderAfterStepA?.lifecycle_status}`);
  console.log(`   Damage Deduction: ₹${orderAfterStepA?.damage_deduction_amount}`);
  if (orderAfterStepA?.lifecycle_status !== 'Return_Initiated') {
    throw new Error('Step A did not transition to Return_Initiated');
  }

  // 5. Test Step B: Warehouse Floor Sign-off & Strict Termination
  console.log('\n--- Test 5: Step B Warehouse Sign-Off & Strict Termination ---');
  await ordersService.confirmWarehouseReturn(testOrder.id, {
    verified_by: 'Ravi Kumar (Floor 1 Specialist)',
    warehouse_condition_rating: 'Good',
    warehouse_notes: 'Inspected and returned to stock racks. Lens scratch assessed at ₹1,500.',
  });
  const orderAfterStepB = await ordersService.getOrderById(testOrder.id);
  console.log(`   Step B Exec Return Status: ${orderAfterStepB?.return_status_exec}`);
  console.log(`   Final Order Status: ${orderAfterStepB?.status}`);
  console.log(`   Pipeline Lifecycle Status: ${orderAfterStepB?.lifecycle_status}`);
  if (orderAfterStepB?.lifecycle_status !== 'Verified_Closed' || orderAfterStepB?.status !== 'Returned') {
    throw new Error('Step B strict termination failed');
  }

  // 6. Test Final Invoice Generation
  console.log('\n--- Test 6: Final GST Tax Invoice Generation ---');
  const invoice = await ordersService.generateFinalInvoice(testOrder.id);
  console.log(`   Generated Invoice #: ${invoice.invoice_number}`);
  console.log(`   Base Rental Subtotal: ₹${invoice.base_rental_subtotal}`);
  console.log(`   Handling Labor: ₹${invoice.handling_labor_charges}`);
  console.log(`   Damage Penalties: ₹${invoice.damage_penalties}`);
  console.log(`   GST Tax: ₹${invoice.gst_tax_amount}`);
  console.log(`   Gross Total: ₹${invoice.gross_total}`);
  console.log(`   Advance Deduction: -₹${invoice.advance_deduction}`);
  console.log(`   Final Balance Due: ₹${invoice.final_balance_due}`);
  console.log(`   Line Items Count: ${invoice.items.length}`);

  if (!invoice.invoice_number || invoice.gross_total <= 0) {
    throw new Error('Invoice generation produced invalid amounts');
  }

  // 7. Test Crew Hub Labor Sheet & Wage Vouchers
  console.log('\n--- Test 7: Crew Hub Labor Sheet Entries ---');
  const laborEntries = await crewHubService.getLaborSheetEntries();
  console.log(`   Total Labor Sheet Entries: ${laborEntries.length}`);
  if (laborEntries.length > 0) {
    const firstEntry = laborEntries[0];
    console.log(`   Entry for: ${firstEntry.crew_name} (Order: ${firstEntry.order_number})`);
    console.log(`   Active Shoot Days: ${firstEntry.active_shoot_days}`);
    console.log(`   Daily Wage: ₹${firstEntry.daily_wage_rate}`);
    console.log(`   Total Earned: ₹${firstEntry.total_wages_earned}`);
    console.log(`   Initial Status: ${firstEntry.payment_status}`);

    // Update status to Approved
    await crewHubService.updateVoucherPaymentStatus(firstEntry.id, 'Approved');
    const updatedEntries = await crewHubService.getLaborSheetEntries();
    const updatedFirst = updatedEntries.find((e) => e.id === firstEntry.id);
    console.log(`   Updated Status: ${updatedFirst?.payment_status}`);
    if (updatedFirst?.payment_status !== 'Approved') {
      throw new Error('Voucher payment status update failed');
    }
  }

  console.log('\n🎉 [SUCCESS] All 7 Walk-In Order to Return & Billing Pipeline tests passed with 100% integrity!\n');
}

runVerification().catch((err) => {
  console.error('\n❌ Verification failed with error:', err);
  process.exit(1);
});
