import axios from 'axios';

async function test() {
    const API_URL = 'http://localhost:5000/api/v1';
    try {
        console.log('Logging in as HOD...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'hod',
            password: 'hod123'
        });
        const token = loginRes.data.accessToken;
        console.log('Login successful. Token:', token.substring(0, 20) + '...');

        console.log('Attempting DELETE /students/bulk-delete...');
        const deleteRes = await axios.delete(`${API_URL}/students/bulk-delete`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('Response:', deleteRes.data);
    } catch (error: any) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

test();
