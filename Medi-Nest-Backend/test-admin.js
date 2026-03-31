const axios = require('axios');

async function test() {
  // Step 1: Login as admin
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'admin@medinest.com',
    password: 'admin123'
  });
  const token = loginRes.data.token;
  const role = loginRes.data.user?.role;
  console.log('Admin login OK | role:', role, '| token present:', !!token);

  // Step 2: Get all doctors
  const docRes = await axios.get('http://localhost:5000/api/admin/doctors', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Doctors status:', docRes.status, '| Count:', docRes.data.length);
  if (docRes.data.length > 0) {
    console.log('Sample doctor:', JSON.stringify(docRes.data[0], null, 2).substring(0, 300));
  }
}

test().catch(err => {
  console.log('Error:', err.response?.status, err.response?.data || err.message);
});
