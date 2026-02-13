const API_URL = 'http://localhost:5000/api/v1/auth/login';

async function testLogin(username, password) {
    console.log(`Testing login for ${username}...`);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: username, password: password })
        });
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login SUCCESS!');
            console.log('User:', data.user ? data.user.email : 'No user data', data.user ? data.user.role : 'No role');
        } else {
            console.log('❌ Login FAILED');
            console.log('Status:', response.status);
            console.log('Error:', data.error || data);
        }
    } catch (error) {
        console.log('❌ Login ERROR:', error.message);
    }
}

async function main() {
    await testLogin('nirmala', 'hodcog');
}
main();
