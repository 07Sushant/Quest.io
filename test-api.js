const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    const response = await axios.post('http://localhost:3001/api/chat/completion', {
      model: 'azure',
      messages: [
        { role: 'user', content: 'Hello, how are you?' }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('API Response:', response.data);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testAPI();
