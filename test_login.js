const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:8080/api/v1/auth/login', {
      email: 'nonexistent@example.com',
      password: 'password123'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error:', err.response?.data);
  }
}

testLogin();
