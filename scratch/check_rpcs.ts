import { supabaseAdmin } from '../src/lib/supabase/admin';

async function listRpcs() {
  // Try querying pg_proc or checking known rpc functions
  const rpcs = [
    'get_assigned_orders_for_executive',
    'delete_order_completely',
    'execute_order_deletion',
    'sync_order_totals',
    'get_order_details'
  ];
  for (const r of rpcs) {
    const res = await supabaseAdmin.rpc(r, {} as any);
    console.log(`RPC ${r}:`, res.error?.message || 'found');
  }
}

listRpcs();
