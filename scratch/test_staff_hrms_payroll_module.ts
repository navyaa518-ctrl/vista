import { staffService } from '../src/lib/services/staffService';
import { auditLogService } from '../src/lib/services/auditLogService';
import { CreateStaffInput, SubmitLeaveInput, DisburseSalaryInput } from '../src/types/staff';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE TEST: STAFF HRMS & PAYROLL ENGINE');
  console.log('================================================================\n');

  // Test 1: Fetch Internal Staff Directory with Department Segmentation
  console.log('👉 [Test 1] Retrieving Internal Staff Directory (Strictly Salaried Staff)...');
  const allStaff = await staffService.getStaffMembers();
  console.log(`   Found ${allStaff.length} internal staff members.`);
  if (allStaff.length === 0) {
    throw new Error('Expected at least 1 internal staff profile');
  }

  const salesStaff = await staffService.getStaffMembers({ department: 'RENTAL_SALES' });
  console.log(`   Rental Sales Staff count: ${salesStaff.length}`);
  const billingStaff = await staffService.getStaffMembers({ department: 'BILLING' });
  console.log(`   Billing Staff count: ${billingStaff.length}`);
  const logisticsStaff = await staffService.getStaffMembers({ department: 'LOGISTICS_FLEET' });
  console.log(`   Logistics & Fleet Staff count: ${logisticsStaff.length}`);
  const auditStaff = await staffService.getStaffMembers({ department: 'AUDITING_GOVERNANCE' });
  console.log(`   Auditing & Governance Staff count: ${auditStaff.length}\n`);

  // Test 2: Onboard New Internal Staff Profile
  console.log('👉 [Test 2] Onboarding New Internal Staff Profile...');
  const newStaffInput: CreateStaffInput = {
    full_name: 'Dinesh Chandra',
    email: 'dinesh.chandra@ashwaprops.com',
    phone: '+91 98495 11223',
    department: 'RENTAL_SALES',
    designation: 'Junior Rental Consultant',
    base_salary: 45000,
    joining_date: '2026-09-01',
    status: 'ACTIVE',
    emergency_contact: '+91 98495 99887',
    notes: 'Manages walk-in prop consultations and photo booth cataloging.',
  };

  const createdStaff = await staffService.createStaff(newStaffInput);
  console.log(`   ✅ Staff Created: ${createdStaff.full_name} (${createdStaff.staff_id})`);
  console.log(`      Department: ${createdStaff.department}`);
  console.log(`      Base Salary: ₹${createdStaff.base_salary}\n`);

  // Test 3: Centralized User Action Audit Logging
  console.log('👉 [Test 3] Testing Centralized System Action Audit Logging...');
  const orderLog = await auditLogService.logOrderDispatched(
    createdStaff.id,
    createdStaff.full_name,
    'ORD-2026-099',
    'DVV Entertainment',
    24,
    'TS09-EA-7788'
  );
  console.log(`   ✅ Logged Dispatch Action: ${orderLog.action_type} for ${orderLog.entity_id}`);
  console.log(`      Metadata: ${JSON.stringify(orderLog.metadata)}`);

  const inspectLog = await auditLogService.logPropertyInspected(
    createdStaff.id,
    createdStaff.full_name,
    'AUD-2026-009',
    'Floor 2 > Rack B',
    10,
    'EXCELLENT'
  );
  console.log(`   ✅ Logged Inspection Action: ${inspectLog.action_type} for ${inspectLog.entity_id}`);

  const invoiceLog = await auditLogService.logInvoiceCreated(
    createdStaff.id,
    createdStaff.full_name,
    'INV-2026-088',
    'Geetha Arts',
    120000,
    30000
  );
  console.log(`   ✅ Logged Billing Action: ${invoiceLog.action_type} for ${invoiceLog.entity_id}`);

  const staffLogs = await auditLogService.getStaffActivityLogs(createdStaff.id);
  console.log(`   Staff activity logs recorded: ${staffLogs.length} entries.\n`);
  if (staffLogs.length < 3) {
    throw new Error('Expected at least 3 activity logs for created staff member');
  }

  // Test 4: Leave Workflow & Unpaid Leave Impact Tracking
  console.log('👉 [Test 4] Submitting Leave Request and Approving as Unpaid...');
  const leaveInput: SubmitLeaveInput = {
    staff_id: createdStaff.id,
    leave_type: 'Emergency',
    start_date: '2026-09-14',
    end_date: '2026-09-15',
    is_paid: false, // Unpaid leave
    reason: 'Personal travel and urgent banking',
  };

  const submittedLeave = await staffService.submitLeave(leaveInput);
  console.log(`   Submitted Leave: ${submittedLeave.leave_type} (${submittedLeave.total_days} days, Status: ${submittedLeave.status})`);

  const approvedLeave = await staffService.updateLeaveStatus(
    submittedLeave.id,
    'APPROVED',
    false, // approved as unpaid
    'Arun Reddy (Billing Manager)'
  );
  console.log(`   ✅ Leave Approved: ${approvedLeave?.status}, is_paid: ${approvedLeave?.is_paid}`);
  if (approvedLeave?.is_paid !== false) {
    throw new Error('Expected leave to be marked unpaid');
  }
  console.log('');

  // Test 5: Monthly Payroll Engine Math
  console.log('👉 [Test 5] Running Automated Monthly Pay Run Math (September 2026)...');
  const allowances = 5000;
  const extraDeductions = 1000;
  const payCalc = await staffService.calculateMonthlyPayroll(
    createdStaff.id,
    'September',
    2026,
    allowances,
    extraDeductions
  );

  console.log(`   Staff Base Salary: ₹${payCalc.base_salary}`);
  console.log(`   Total Month Days: ${payCalc.total_month_days}`);
  console.log(`   Unpaid Leave Days: ${payCalc.unpaid_leaves_count}`);
  console.log(`   Payable Days: ${payCalc.payable_days}`);
  console.log(`   Per-Day Rate: ₹${payCalc.per_day_rate}`);
  console.log(`   Earned Base Pay: ₹${payCalc.earned_base}`);
  console.log(`   Leave Deductions: ₹${payCalc.leave_deductions}`);
  console.log(`   Allowances: ₹${payCalc.allowances}`);
  console.log(`   Net Salary: ₹${payCalc.net_salary}\n`);

  // Verify math assertions
  if (payCalc.total_month_days !== 30) {
    throw new Error(`Expected 30 days in September, got ${payCalc.total_month_days}`);
  }
  if (payCalc.unpaid_leaves_count !== 2) {
    throw new Error(`Expected 2 unpaid leave days, got ${payCalc.unpaid_leaves_count}`);
  }
  if (payCalc.payable_days !== 28) {
    throw new Error(`Expected 28 payable days, got ${payCalc.payable_days}`);
  }

  const expectedEarnedBase = Number(((45000 / 30) * 28).toFixed(2)); // 42000
  if (Math.abs(payCalc.earned_base - expectedEarnedBase) > 1) {
    throw new Error(`Expected earned base ~${expectedEarnedBase}, got ${payCalc.earned_base}`);
  }

  // Test 6: Salary Disbursal & Pay Slip Generation
  console.log('👉 [Test 6] Executing Salary Disbursal & Recording Transaction...');
  const disburseInput: DisburseSalaryInput = {
    staff_id: createdStaff.id,
    month: 'September',
    year: 2026,
    base_salary: payCalc.base_salary,
    total_days: payCalc.total_month_days,
    days_worked: payCalc.payable_days,
    unpaid_leave_days: payCalc.unpaid_leaves_count,
    allowances: payCalc.allowances,
    deductions: payCalc.total_deductions,
    net_salary: payCalc.net_salary,
    payment_mode: 'NEFT',
    payment_ref: 'NEFT-202609-88772',
    disbursed_by: 'Finance Controller',
    remarks: 'September 2026 payroll settled via corporate banking',
  };

  const disbursedRecord = await staffService.disburseSalary(disburseInput);
  console.log(`   ✅ Disbursed Record ID: ${disbursedRecord.id}`);
  console.log(`      Status: ${disbursedRecord.payment_status}`);
  console.log(`      Payment Ref: ${disbursedRecord.payment_ref}`);
  console.log(`      Net Amount: ₹${disbursedRecord.net_salary}\n`);

  // Test 7: CSV Exports
  console.log('👉 [Test 7] Testing Staff & Payroll CSV Data Exporters...');
  const staffCSV = staffService.exportStaffCSV(allStaff);
  console.log(`   Staff CSV header: ${staffCSV.split('\n')[0]}`);
  if (!staffCSV.includes('Staff ID') || !staffCSV.includes('Department')) {
    throw new Error('Staff CSV missing expected headers');
  }

  const payrollsList = await staffService.getPayrolls();
  const payrollCSV = staffService.exportPayrollCSV(payrollsList);
  console.log(`   Payroll CSV header: ${payrollCSV.split('\n')[0]}`);
  if (!payrollCSV.includes('Payroll ID') || !payrollCSV.includes('Net Salary Paid')) {
    throw new Error('Payroll CSV missing expected headers');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL STAFF HRMS & PAYROLL ENGINE TESTS PASSED!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
