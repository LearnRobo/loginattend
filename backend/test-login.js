const axios = require('axios');

const testLogin = async () => {
  const credentials = {
    email: 'jane@edtech.com',
    password: 'emp123'
  };

  try {
    console.log(`Attempting login for ${credentials.email}...`);
    const response = await axios.post('http://localhost:5000/api/auth/login', credentials);
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
  }
};

testLogin();
