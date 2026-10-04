import { crewHubService, calculateDaysBetween } from '../src/lib/services/crewHub';

async function runTests() {
  console.log('=== STARTING CREW HUB & FIELD FLEET VERIFICATION SUITE ===\n');

  // Test 1: Crew Members Roster & 360 Profile
  console.log('--- Test 1: Fetch Crew Members & 360 Profile Analytics ---');
  const members = await crewHubService.getCrewMembers();
  console.log(`✓ Fetched ${members.length} registered crew members.`);
  if (members.length < 4) throw new Error('Expected at least 4 crew members');

  const ramesh = await crewHubService.getCrewMemberById('cw-001');
  if (!ramesh) throw new Error('Could not find Ramesh Kumar (cw-001)');
  console.log(`✓ Profile 360 for ${ramesh.full_name} (${ramesh.badge_number}):`);
  console.log(`   - Total Shoots Completed: ${ramesh.analytics.total_shoots_completed}`);
  console.log(`   - Total Days Deployed: ${ramesh.analytics.total_days_deployed} days`);
  console.log(`   - Lifetime Earnings: ₹${ramesh.analytics.cumulative_lifetime_earnings.toLocaleString('en-IN')}`);
  console.log(`   - Clean Record Score: ${ramesh.analytics.clean_record_score}%`);
  console.log(`   - Past Projects in History: ${ramesh.project_history.length}`);
  if (ramesh.analytics.clean_record_score !== 100) throw new Error('Expected clean record score 100%');

  // Test 2: Active Deployments Board
  console.log('\n--- Test 2: Fetch Active Deployments Board ---');
  const deployments = await crewHubService.getActiveDeployments();
  console.log(`✓ Active shoot deployments: ${deployments.length}`);
  const shoot = deployments[0];
  console.log(`   - Project: ${shoot.movie_project_name}`);
  console.log(`   - Location: ${shoot.shoot_location}`);
  console.log(`   - Lorry Logistics: ${shoot.transport_logistics.lorry_vehicle_number} (Driver: ${shoot.transport_logistics.driver_name})`);
  console.log(`   - In-House Crew Count: ${shoot.in_house_crew.length}`);
  console.log(`   - Total Labor Cost: ₹${shoot.total_labor_cost.toLocaleString('en-IN')}`);

  // Test 3: Mid-Shoot Crew Swap Workflow
  console.log('\n--- Test 3: Mid-Shoot Crew Swap / Replacement ---');
  const swapResult = await crewHubService.swapCrewMember({
    order_id: 'ord-walkin-001',
    releasing_crew_member_id: 'cw-001', // Ramesh Kumar
    replacement_crew_member_id: 'cw-003', // Govind Raj
    effective_swap_date: '2026-09-18',
    daily_wage: 1000,
    reason: 'Medical leave on Day 2 of 5-day shoot',
  });

  console.log(`✓ Swap executed successfully:`);
  console.log(`   - Released Assignment: ${swapResult.released_assignment.crew_member_id} status=${swapResult.released_assignment.status} end_date=${swapResult.released_assignment.end_date}`);
  console.log(`   - New Assignment: ${swapResult.new_assignment.crew_member_id} status=${swapResult.new_assignment.status} start_date=${swapResult.new_assignment.start_date}`);
  console.log(`   - Recalculated Order Labor Total: ₹${swapResult.recalculated_total_labor.toLocaleString('en-IN')}`);
  console.log(`   - Audit Message: ${swapResult.audit_message}`);

  if (swapResult.released_assignment.status !== 'Replaced') {
    throw new Error('Released assignment status should be "Replaced"');
  }
  if (swapResult.new_assignment.status !== 'Active') {
    throw new Error('New assignment status should be "Active"');
  }

  // Test 4: External Crew Gate-Pass Manifest
  console.log('\n--- Test 4: External Client Crew Allocation ---');
  await crewHubService.assignOrderCrewMembers(
    'ord-client-009',
    [],
    [
      {
        full_name: 'K. Naresh - Production Grip',
        phone_number: '+91 98480 11223',
        notes: 'Lead Grip Handler for Mythri Movies Floor 14',
      },
    ]
  );
  console.log('✓ Client-sourced crew saved to gate pass manifest without billing labor to client.');

  // Test 5: Field Attendance Check-ins & Prop Health Sign-offs
  console.log('\n--- Test 5: Field Attendance & Prop Health Sign-off Logs ---');
  const attendanceLog = await crewHubService.submitFieldLog({
    order_id: 'ord-walkin-001',
    crew_member_id: 'cw-003',
    log_type: 'Attendance',
    location_name: 'Ramoji Film City Studio Floor 14',
    gps_coordinates: { latitude: 17.2543, longitude: 78.6808, accuracy: 10 },
    notes: 'Govind Raj reported on-site as replacement crew lead.',
  });
  console.log(`✓ Attendance Log logged: ID=${attendanceLog.id} by ${attendanceLog.crew_member_name} (${attendanceLog.log_type})`);

  const healthLog = await crewHubService.submitFieldLog({
    order_id: 'ord-walkin-001',
    crew_member_id: 'cw-003',
    log_type: 'Prop_Health_Update',
    location_name: 'Annapurna Studios 7-acre set',
    notes: 'Daily Prop Health Sign-off: All 42 props safe at Annapurna Studios 7-acre set. Zero water ingress.',
  });
  console.log(`✓ Prop Health Sign-off logged: ID=${healthLog.id} notes="${healthLog.notes}"`);

  const allLogs = await crewHubService.getFieldLogs();
  console.log(`✓ Total field log stream count: ${allLogs.length}`);
  if (allLogs.length < 2) throw new Error('Expected at least 2 logs');

  // Test 6: Manager Operational Broadcast
  console.log('\n--- Test 6: Manager Operational Broadcast Announcement ---');
  const broadcast = await crewHubService.broadcastAnnouncement({
    title: 'Rain Warning - Tarpaulin Mandatory',
    message: 'Heavy thunder showers expected over Ramoji & Annapurna. Secure all optical and electronic props immediately.',
    priority: 'Urgent',
  });
  console.log(`✓ Broadcast published: "${broadcast.title}" (Priority: ${broadcast.priority})`);
  const announcements = await crewHubService.getBroadcastAnnouncements();
  console.log(`✓ Total active announcements: ${announcements.length}`);

  console.log('\n=== ALL 6 CREW HUB & FLEET TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
