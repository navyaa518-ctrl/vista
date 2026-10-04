import { supabaseAdmin } from '../src/lib/supabase/admin';

async function checkProfiles() {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(3);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Sample profiles:', data);
  }
  const { data: users, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
  if (userErr) {
    console.error('Error listing auth users:', userErr);
  } else {
    console.log('Total auth users:', users?.users?.length);
    console.log('Sample auth user:', users?.users?.[0]);
  }
}

checkProfiles();
