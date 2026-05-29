async function testLoginJson() {
  try {
    const csrfRes = await fetch('http://127.0.0.1:3000/api/auth/csrf');
    const csrfData = await csrfRes.json();
    const cookies = csrfRes.headers.get('set-cookie');

    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        email: 'agendaris@pdam.go.id',
        password: 'Agendaris@12345',
        csrfToken: csrfData.csrfToken,
        json: true
      })
    });

    const text = await loginRes.text();
    console.log("Login Response Status:", loginRes.status);
    console.log("Login Data:", text);
  } catch (err) {
    console.error("Test Error:", err);
  }
}

testLoginJson();
