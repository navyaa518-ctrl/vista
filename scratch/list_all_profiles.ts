import { supabaseAdmin } from '../src/lib/supabase/admin';

async function listAllProfiles() {
  const { data, error } = await supabaseAdmin.from('profiles').select('*');
  if (error) console.error(error);
  else console.log('All profiles:', JSON.stringify(data, null, 2));
}

listAllProfiles();
