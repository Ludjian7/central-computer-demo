async function pingProduction() {
  console.log('Logging in as karyawan.demo...');
  try {
    const loginRes = await fetch('https://central-computer-demo.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'karyawan.demo', password: 'password123' })
    });
    
    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }
    const loginData = await loginRes.json();
    const token = loginData.data?.token;

    console.log('Opening a new shift...');
    const openRes = await fetch('https://central-computer-demo.vercel.app/api/shifts/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ opening_cash: 50000 })
    });
    const openText = await openRes.text();
    console.log('Open Shift Status:', openRes.status, openText);

    console.log('Fetching https://central-computer-demo.vercel.app/api/shifts/current');
    const response = await fetch('https://central-computer-demo.vercel.app/api/shifts/current', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response body:', text);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

pingProduction();
