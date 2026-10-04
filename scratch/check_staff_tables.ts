import { supabaseAdmin } from '../src/lib/supabase/admin';

async function checkTables() {
  const staff = await supabaseAdmin.from('staff_profiles').select('*').limit(3);
  console.log('staff_profiles:', staff.error ? staff.error.message : staff.data?.length);

  const crew = await supabaseAdmin.from('crew_members').select('*').limit(3);
  console.log('crew_members:', crew.error ? crew.error.message : crew.data?.length);
}

checkTables();
