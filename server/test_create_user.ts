const API_URL = 'http://localhost:5000/api/v1/users';
// We need a valid token to test this, so we first login as admin
const LOGIN_URL = 'http://localhost:5000/api/v1/auth/login';

async function testCreateUser() {
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin', password: 'admin123' })
    });
    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
        console.error('Login failed:', loginData);
        return;
    }

    const token = loginData.accessToken;
    console.log('Login success, got token.');

    console.log('2. Creating user "deepa_test" with role "hod"...');
    const createResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            username: 'deepa_test',
            password: 'password123',
            name: 'Deepa Test',
            role: 'hod', // Sending lowercase to test the fix
            department: 'Computer Science',
            email: 'deepa_test@example.com'
        })
    });

    const createData = await createResponse.json();

    if (createResponse.ok) {
        console.log('✅ User created successfully:', createData);
    } else {
        console.log('❌ User creation failed:', createData);
    }
}

testCreateUser();
