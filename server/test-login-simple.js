async function testLogin() {
  try {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'student@test.com',
        password: 'TestPass123!'
      })
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);

    const data = JSON.parse(text);
    console.log('Success:', data.success);
    console.log('Message:', data.message);
    if (data.data) {
      console.log('User:', data.data.user?.email);
      console.log('Role:', data.data.user?.role);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
