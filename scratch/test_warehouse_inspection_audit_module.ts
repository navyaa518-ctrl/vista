import { inspectionService } from '../src/lib/services/inspectionService';
import { CreateWarehouseAuditInput, SubmitAuditBatchInput } from '../src/types/audits';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE TEST: WAREHOUSE PROPERTY AUDIT MODULE');
  console.log('================================================================\n');

  // Test 1: Staff Retrieval
  console.log('👉 [Test 1] Retrieving Available Staff & Inspectors...');
  const staff = await inspectionService.getActiveInspectors();
  console.log(`   Found ${staff.length} staff members.`);
  if (staff.length < 2) {
    throw new Error('Expected at least 2 staff members');
  }
  const inspector = staff[0];
  console.log(`   Assigned primary inspector: ${inspector.name} (${inspector.role})\n`);

  // Test 2: Task Creation with Scoping
  console.log('👉 [Test 2] Creating an Inspection Task with Floor & Multi-Assignee Scope...');
  const taskInput: CreateWarehouseAuditInput = {
    title: 'Floor 1 Godown A - Weekly Prop Health Audit',
    audit_type: 'WEEKLY',
    floor_level: 'Floor 1',
    rack_range: 'Rack A-01 to A-08',
    assignee_ids: [inspector.id],
    scheduled_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    notes: 'Prioritize checking wood lacquer and metal joints on vintage props.',
  };

  const createdTask = await inspectionService.createWarehouseAudit(taskInput);
  console.log(`   ✅ Task Created: ${createdTask.audit_code} (${createdTask.id})`);
  console.log(`      Floor & Rack: ${createdTask.floor_level} • ${createdTask.rack_range}`);
  console.log(`      Initial Items Count: ${createdTask.total_items_count}`);
  console.log(`      Status: ${createdTask.status}\n`);

  // Test 3: Resolving Items Scoped to the Task
  console.log('👉 [Test 3] Resolving Checklist Items for Task...');
  const checklistItems = await inspectionService.resolvePropsForAuditScope(
    createdTask.floor_level,
    createdTask.rack_range,
    createdTask.category_id
  );
  console.log(`   Fetched ${checklistItems.length} checklist items.`);
  if (checklistItems.length === 0) {
    throw new Error('Expected checklist items to be resolved for task scope');
  }
  const sampleProp = checklistItems[0];
  console.log(`   Sample Prop for Audit: [${sampleProp.item_code}] ${sampleProp.prop_title} at ${sampleProp.expected_rack}\n`);

  // Test 4: Submitting Inspection Checklist Batch with Wear & Defect Photos
  console.log('👉 [Test 4] Executing & Submitting Audit Batch (Atomic Transition)...');
  const batchSubmission: SubmitAuditBatchInput = {
    audit_id: createdTask.id,
    auditorId: inspector.id,
    auditorName: inspector.name,
    auditorRole: inspector.role,
    items: [
      {
        prop_id: sampleProp.prop_id,
        item_code: sampleProp.item_code,
        verified_rack: sampleProp.expected_rack,
        is_misplaced: false,
        health_status: 'PERFECT',
        condition: 'EXCELLENT',
        defect_notes: 'Inspected front surface and legs. Structural integrity intact.',
        photo_evidence_urls: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
        ],
      },
      ...(checklistItems.length > 1
        ? [
            {
              prop_id: checklistItems[1].prop_id,
              item_code: checklistItems[1].item_code,
              verified_rack: 'Floor 1 > Bay 09 (Found misplaced from Rack 02)',
              is_misplaced: true,
              health_status: 'MAJOR_DAMAGE' as const,
              condition: 'DAMAGED_NEEDS_REPAIR' as const,
              defect_notes: 'Loose joint and hairline crack detected on side frame. Sent maintenance flag.',
              photo_evidence_urls: [],
            },
          ]
        : []),
    ],
  };

  const submitResult = await inspectionService.submitAuditBatch(batchSubmission);
  console.log(`   ✅ Submit result: ${submitResult.message}`);
  console.log(`   Updated Task Status: ${submitResult.audit?.status}`);
  console.log(`   Audited Count: ${submitResult.auditedCount}\n`);

  // Test 5: Verify Property Audit History Log Sync
  console.log('👉 [Test 5] Verifying Property Health History Timeline...');
  const propHistory = await inspectionService.getPropHealthHistory(sampleProp.prop_id);
  console.log(`   Found ${propHistory.length} audit history entries for prop [${sampleProp.item_code}].`);
  if (propHistory.length === 0) {
    throw new Error('Audit history was not recorded for inspected prop!');
  }
  const latestEntry = propHistory[0];
  console.log(`   Latest Audit Log:`);
  console.log(`      Status: ${latestEntry.status}`);
  console.log(`      Auditor: ${latestEntry.inspected_by_name}`);
  console.log(`      Notes: ${latestEntry.notes}`);
  console.log(`      Timestamp: ${latestEntry.timestamp}\n`);

  // Test 6: Verify Metrics Calculation
  console.log('👉 [Test 6] Calculating Live Audit Metrics & Accuracy...');
  const metrics = await inspectionService.getAuditOverviewMetrics();
  console.log(`   Total Inspected This Week: ${metrics.totalInspectedThisWeek}`);
  console.log(`   Flagged Damaged Count: ${metrics.flaggedDamagedCount}`);
  console.log(`   Rack Accuracy: ${metrics.rackAccuracyPercent}%`);
  console.log(`   Completed Batches: ${metrics.completedBatchesCount}`);
  console.log(`   Active Batches: ${metrics.activeBatchesCount}`);
  console.log(`   Total Pending: ${metrics.totalPendingCount}\n`);

  // Test 7: CSV Export Generation
  console.log('👉 [Test 7] Testing CSV Export Generator...');
  const logs = await inspectionService.getAuditHistoryLog();
  const csv = inspectionService.exportAuditLogsToCSV(logs);
  console.log(`   Generated CSV output with ${csv.split('\n').length} rows.`);
  console.log(`   First row (Header): ${csv.split('\n')[0]}`);
  console.log('\n================================================================');
  console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY WITH SUPABASE INTEGRATION!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
