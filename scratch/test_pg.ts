import { Client } from 'pg';

async function testPgPooler() {
  const host = 'aws-0-ap-south-1.pooler.supabase.com';
  const user = 'postgres.ujxqffdfybsxalvkevqc';
  const passwords = [process.env.PG_PASSWORD || '', 'postgres'];

  for (const password of passwords) {
    const client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      console.log(`Trying pooler host ${host} with user ${user}...`);
      await client.connect();
      console.log('✅ Connected to Postgres pooler successfully!');
      const res = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
      console.log('Tables in database:', res.rows.map(r => r.table_name));
      await client.end();
      return true;
    } catch (err: any) {
      console.log(`❌ Failed with password "${password}":`, err.message);
      try { await client.end(); } catch {}
    }
  }
  return false;
}

testPgPooler();
