import { inspectionService } from '../src/lib/services/inspectionService';

async function runQRAndReviewTests() {
  console.log('========================================================================');
  console.log('🧪 TESTING: UNIVERSAL QR LOOKUP & PROP HEALTH INSPECTION REVIEW FLOW');
  console.log('========================================================================\n');

  // Test 1: Serialized JSON Payload Parsing
  console.log('👉 [Test 1] Parsing Serialized JSON QR Payloads...');
  const jsonPayload1 = '{"itemCode":"ASH-ELEC-MOU-0005","propId":"prop-001","model":"M331-SILENT","loc":"G1-F0-RA-S01"}';
  const prop1 = await inspectionService.scanPropByCode(jsonPayload1);
  console.log(`   Scanned JSON: ${jsonPayload1}`);
  if (!prop1) throw new Error('Failed to resolve prop from JSON payload 1');
  console.log(`   ✅ Matched Prop: [${prop1.item_code}] ${prop1.prop_title}`);
  console.log(`      Location: ${prop1.current_rack}`);
  console.log(`      Is Misplaced: ${prop1.is_misplaced}\n`);

  // Test 2: Plain Barcode / SKU String
  console.log('👉 [Test 2] Resolving Plain Barcode String...');
  const plainBarcode = 'ASH-FURN-THR-0002';
  const prop2 = await inspectionService.scanPropByCode(plainBarcode);
  if (!prop2) throw new Error('Failed to resolve prop from plain barcode');
  console.log(`   Scanned Barcode: ${plainBarcode}`);
  console.log(`   ✅ Matched Prop: [${prop2.item_code}] ${prop2.prop_title}\n`);

  // Test 3: Universal Search Across Warehouse (Cross-floor item)
  console.log('👉 [Test 3] Cross-Floor Universal Search (Damascus Broadsword)...');
  const prop3 = await inspectionService.scanPropByCode('ancient-damascus-broadsword');
  if (!prop3) throw new Error('Failed to resolve prop by slug');
  console.log(`   Scanned Slug: ancient-damascus-broadsword`);
  console.log(`   ✅ Matched Prop: [${prop3.item_code}] ${prop3.prop_title}`);
  console.log(`      Current Location: ${prop3.current_rack}\n`);

  // Test 4: Inspection Review Entry with Evidence Photo Storage & History Log
  console.log('👉 [Test 4] Logging Inspection Review with Supabase Evidence Photo URL...');
  const testAuditId = 'b1000000-0000-0000-0000-000000000001';
  const evidenceUrl = 'https://ujxqffdfybsxalvkevqc.supabase.co/storage/v1/object/public/audit-evidence/test/test.txt';

  const logResult = await inspectionService.logInspectionEntry({
    audit_id: testAuditId,
    prop_id: prop1.prop_id,
    scanned_by: '27f304a0-1981-465f-bb00-4f50d7b5fdff',
    scanned_by_name: 'Ravi Kumar (Inspector)',
    health_status: 'PERFECT',
    rack_verified: 'Floor 1 > Rack A-01 > Bay 1',
    is_misplaced: false,
    notes: 'Verified via live QR scanner. Condition pristine, no optical or structural defects.',
    evidence_photos: [evidenceUrl],
    resolution_status: 'RESOLVED',
  });

  console.log(`   ✅ Log Entry Success: ${logResult.success}`);
  console.log(`      History Entry ID: ${logResult.historyEntry.id}`);
  console.log(`      Status: ${logResult.historyEntry.status}`);
  console.log(`      Evidence Photos: ${logResult.historyEntry.photo_urls.length} photo(s) attached\n`);

  // Test 5: Verify Prop Health History Timeline Retrieval
  console.log('👉 [Test 5] Verifying Chronological History Ledger for Prop...');
  const history = await inspectionService.getPropHealthHistory(prop1.prop_id);
  console.log(`   Found ${history.length} inspection log(s) for prop.`);
  if (history.length === 0) throw new Error('Failed to retrieve history timeline');
  const latest = history[0];
  console.log(`   Latest Log: ${latest.notes}`);
  console.log(`   Auditor: ${latest.inspected_by_name}`);
  console.log(`   Photo Attached: ${latest.photo_urls[0] || 'None'}\n`);

  console.log('========================================================================');
  console.log('🎉 ALL QR LOOKUP & INSPECTION REVIEW TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runQRAndReviewTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
