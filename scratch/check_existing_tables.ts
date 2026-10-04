import { supabaseAdmin } from '../src/lib/supabase/admin';

async function listExistingTables() {
  const tables = ['profiles', 'props', 'orders', 'order_items', 'racks', 'floors', 'godowns', 'categories', 'audit_logs', 'app_users', 'users'];
  for (const t of tables) {
    const res = await supabaseAdmin.from(t).select('*', { count: 'exact', head: true });
    console.log(`Table '${t}':`, res.error ? `Error: ${res.error.message}` : `EXISTS (${res.count} records)`);
  }
}

listExistingTables();
