const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ujxqffdfybsxalvkevqc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeHFmZmRmeWJzeGFsdmtldnFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA1NTEzNCwiZXhwIjoyMTA0NjMxMTM0fQ.AHdNoHiLdarZ-Wulyt2Vn9We6Lus1NYgY21dwWNfK8Y';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  {
    email: 'superadmin@aswamovies.com',
    password: 'Nine@248588',
    fullName: 'Kiran Rao (Super Admin)',
    role: 'admin',
    phone: '+91 98480 45678',
    productionCompany: 'ASHWA Executive Board',
    floor: 1,
  },
  {
    email: 'admin@aswamovies.com',
    password: 'Nine@248588',
    fullName: 'Operations Lead (Admin)',
    role: 'admin',
    phone: '+91 98480 55678',
    productionCompany: 'ASHWA Operations Central',
    floor: 1,
  },
  {
    email: 'billing@aswamovies.com',
    password: 'Nine@248588',
    fullName: 'Arun Reddy (Billing & Warehouse Manager)',
    role: 'manager',
    phone: '+91 98480 34567',
    productionCompany: 'ASHWA Logistics & Commercial Division',
    floor: 1,
  },
  {
    email: 'sales@aswamovies.com',
    password: 'Nine@248588',
    fullName: 'Ravi Kumar (Senior Sales Executive - Floor 1)',
    role: 'executive',
    phone: '+91 98480 12345',
    productionCompany: 'ASHWA Field Picking Team',
    floor: 1,
  },
  {
    email: 'simonjones518@gmail.com',
    password: 'Nine@248588',
    fullName: 'Simon Jones',
    role: 'client',
    phone: '+91 98200 44556',
    productionCompany: 'Mythri Movie Makers & Jones VFX',
    floor: null,
  },
];

async function seed() {
  console.log('--- Initializing Supabase Storage & Demo Accounts ---');

  // 1. Create props-media bucket if not exists
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets && buckets.some((b) => b.name === 'props-media');
    if (!exists) {
      const { data, error } = await supabaseAdmin.storage.createBucket('props-media', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      if (error) console.error('Error creating bucket:', error.message);
      else console.log('✓ Created public bucket: props-media');
    } else {
      console.log('✓ Bucket props-media already exists');
    }
  } catch (err) {
    console.error('Bucket creation error:', err.message);
  }

  // 2. Create users
  for (const user of DEMO_USERS) {
    try {
      // Check if user already exists
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userList && userList.users.find((u) => u.email === user.email);

      let userId;
      if (!existingUser) {
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            role: user.role,
            production_company: user.productionCompany,
          },
        });
        if (createErr) {
          console.error(`Failed to create ${user.email}:`, createErr.message);
          continue;
        }
        userId = newUser.user.id;
        console.log(`✓ Created Supabase Auth user: ${user.email} (${user.role})`);
      } else {
        userId = existingUser.id;
        // Ensure password is updated to the user prompt specification
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            role: user.role,
            production_company: user.productionCompany,
          },
        });
        console.log(`✓ Updated existing Auth user: ${user.email} (${user.role})`);
      }

      // Upsert profiles record
      const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(
        {
          id: userId,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          phone: user.phone,
          production_company: user.productionCompany,
          floor_assigned: user.floor,
        },
        { onConflict: 'id' }
      );

      if (profileErr) {
        console.error(`Profile upsert error for ${user.email}:`, profileErr.message);
      } else {
        console.log(`✓ Synced profile record for: ${user.email}`);
      }
    } catch (err) {
      console.error(`Error processing ${user.email}:`, err);
    }
  }

  console.log('--- Completed Auth & Storage Setup ---');
}

seed();
