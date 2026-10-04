async function testApiUsers() {
  const res = await fetch('http://localhost:3000/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list' }),
  });
  const data = await res.json();
  console.log('List users result status:', res.status);
  console.log('Total users returned:', data.users?.length);
  console.log('Sample user:', data.users?.[0]);
}

testApiUsers().catch(console.error);
