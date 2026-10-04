import { supabaseAdmin } from '../src/lib/supabase/admin';

async function checkColumns() {
  const { data, error } = await supabaseAdmin.rpc('get_table_columns', { table_name: 'profiles' });
  if (error) {
    // If RPC doesn't exist, test inserting/selecting status and department
    const test = await supabaseAdmin.from('profiles').select('id, status, department, is_deleted').limit(1);
    console.log('Testing column selection:', test);
  } else {
    console.log('Columns:', data);
  }
}

checkColumns();
