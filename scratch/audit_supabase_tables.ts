import { supabaseAdmin } from '../src/lib/supabase/admin';

async function listPublicTables() {
  const candidateTables = [
    'profiles',
    'props',
    'prop_items',
    'prop_serialized_items',
    'orders',
    'order_items',
    'inventory_logs',
    'warehouse_godowns',
    'warehouse_floors',
    'warehouse_racks',
    'warehouse_rows',
    'warehouse_audits',
    'audit_assignees',
    'audit_inspection_items',
    'prop_health_history',
    'security_roles',
    'teams',
    'team_roles',
    'team_members',
    'order_crew_assignments',
    'order_external_crew',
    'crew_field_logs',
    'order_field_crew',
    'prop_damage_incidents',
    'labor_vouchers',
    'crew_members',
    'staff_payroll_records',
    'staff_leave_requests',
    'staff_activity_logs',
    'delivery_challans',
    'invoices',
    'expenses'
  ];

  console.log('=== SUPABASE TABLE AUDIT ===\n');
  const existing: string[] = [];
  const missing: string[] = [];

  for (const t of candidateTables) {
    const { data, error } = await supabaseAdmin.from(t).select('*').limit(1);
    if (!error) {
      existing.push(t);
    } else {
      missing.push(t);
    }
  }

  console.log('✅ EXISTING TABLES IN SUPABASE:');
  existing.forEach(t => console.log(`   - ${t}`));

  console.log('\n❌ MISSING TABLES IN SUPABASE:');
  missing.forEach(t => console.log(`   - ${t}`));
}

listPublicTables();
