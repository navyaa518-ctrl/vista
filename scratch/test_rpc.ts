import { supabaseAdmin } from '../src/lib/supabase/admin';

async function testRpc() {
  const rpcs = ['exec_sql', 'execute_sql', 'exec', 'run_sql'];
  for (const rpc of rpcs) {
    try {
      const { data, error } = await supabaseAdmin.rpc(rpc, { sql: 'SELECT 1;' });
      console.log(`RPC ${rpc}:`, error ? error.message : 'SUCCESS', data);
    } catch (e: any) {
      console.log(`RPC ${rpc} exception:`, e.message);
    }
  }
}

testRpc();
