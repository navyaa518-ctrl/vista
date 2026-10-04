import { supabaseAdmin } from '../src/lib/supabase/admin';

async function checkTables() {
  console.log('Checking Supabase connection and tables...');

  const tablesToCheck = [
    'profiles',
    'orders',
    'order_crew_assignments',
    'order_external_crew',
    'crew_field_logs',
    'order_field_crew',
    'prop_damage_incidents',
    'labor_vouchers',
    'crew_members',
    'staff_payroll_records',
    'security_roles',
    'teams',
    'props',
    'prop_serialized_items'
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table '${table}': ERROR/NOT FOUND (${error.code}) - ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': EXISTS (${data?.length || 0} sample rows)`);
      }
    } catch (e: any) {
      console.log(`⚠️ Table '${table}': Exception - ${e.message}`);
    }
  }
}

checkTables().catch(console.error);
