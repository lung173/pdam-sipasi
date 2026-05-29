async function testLogin() {
  try {
    // 1. Get CSRF token
    const csrfRes = await fetch('http://127.0.0.1:3000/api/auth/csrf');
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const cookies = csrfRes.headers.get('set-cookie');

    // 2. Perform Login
    const params = new URLSearchParams();
    params.append('email', 'agendaris@pdam.go.id');
    params.append('password', 'Agendaris@12345');
    params.append('csrfToken', csrfToken);
    params.append('json', 'true');

    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies || ''
      },
      body: params.toString()
    });

    const loginData = await loginRes.json();
    console.log("Login Response Status:", loginRes.status);
    console.log("Login Data:", loginData);
  } catch (err) {
    console.error("Test Error:", err);
  }
}

testLogin();
