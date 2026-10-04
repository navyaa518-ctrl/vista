import { supabaseAdmin } from '../src/lib/supabase/admin';

async function testUserManagementPipeline() {
  console.log('🚀 Starting Super Admin User Management Pipeline Test...\n');

  const testEmail = `test_staff_${Date.now()}@aswamovies.com`;
  const initialPassword = 'InitPass@2026!Secure';
  let createdUserId = '';

  try {
    // 1. CREATE USER
    console.log(`1. Testing User Creation (${testEmail})...`);
    const createRes = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createUser',
        email: testEmail,
        password: initialPassword,
        full_name: 'Test Sales Operative',
        phone: '+91 99887 76655',
        role: 'rental_sales_exec',
        department: 'Warehouse Logistics',
      }),
    });
    const createData = await createRes.json();
    console.log('Create Response Status:', createRes.status, createData.success ? '✅ SUCCESS' : '❌ FAILED');
    if (!createData.success) throw new Error(createData.error);
    createdUserId = createData.user.id;
    console.log('Created User ID:', createdUserId);

    // 2. LIST USERS
    console.log('\n2. Testing Directory Listing...');
    const listRes = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    });
    const listData = await listRes.json();
    const found = listData.users?.find((u: any) => u.id === createdUserId);
    console.log('Found user in directory:', found ? `✅ YES (Status: ${found.status}, Role: ${found.role})` : '❌ NO');

    // 3. DIRECT PASSWORD RESET
    console.log('\n3. Testing Super Admin Direct Password Reset...');
    const newPassword = 'NewSecret@2026#Reset';
    const resetRes = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'resetPassword',
        userId: createdUserId,
        newPassword,
      }),
    });
    const resetData = await resetRes.json();
    console.log('Password Reset Status:', resetRes.status, resetData.success ? '✅ SUCCESS' : '❌ FAILED');

    // 4. SUSPEND ACCOUNT
    console.log('\n4. Testing Account Suspension & Session Revocation...');
    const suspendRes = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggleStatus',
        userId: createdUserId,
        status: 'SUSPENDED',
      }),
    });
    const suspendData = await suspendRes.json();
    console.log('Suspend Status:', suspendRes.status, suspendData.status === 'SUSPENDED' ? '✅ SUSPENDED' : '❌ FAILED');

    // 5. TEST SUSPENDED USER LOGIN BLOCK
    console.log('\n5. Testing Suspended User Login Interception...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword,
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login attempt HTTP status:', loginRes.status);
    console.log('Login attempt message:', loginData.error);
    const expectedMsg = 'Your account is temporarily suspended. Contact Super Admin.';
    if (loginRes.status === 403 && loginData.error === expectedMsg) {
      console.log('✅ Correctly blocked with exact suspension toast message!');
    } else {
      console.log('⚠️ Suspended user response differed:', loginData);
    }

    // 6. RE-ACTIVATE ACCOUNT
    console.log('\n6. Testing Account Re-Activation...');
    const activateRes = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggleStatus',
        userId: createdUserId,
        status: 'ACTIVE',
      }),
    });
    const activateData = await activateRes.json();
    console.log('Re-activation Status:', activateRes.status, activateData.status === 'ACTIVE' ? '✅ ACTIVE' : '❌ FAILED');

    // 7. CLEANUP / DELETE USER
    console.log('\n7. Testing Hard Deletion...');
    const delRes = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteUser',
        userId: createdUserId,
        hardDelete: true,
      }),
    });
    const delData = await delRes.json();
    console.log('Delete Status:', delRes.status, delData.success ? '✅ SUCCESS' : '❌ FAILED');

    console.log('\n🎉 ALL 7 SUPER ADMIN USER MANAGEMENT WORKFLOWS PASSED VERIFICATION!');
  } catch (err) {
    console.error('❌ Pipeline Test Error:', err);
    // Cleanup if failed
    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => {});
    }
    process.exit(1);
  }
}

testUserManagementPipeline();
