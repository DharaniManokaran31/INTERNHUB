const axios = require('axios');

async function testRoutes() {
    const baseURL = 'http://localhost:5000/api/hr';
    // We need a token. Let's assume we can get one or the server is running without auth for now (unlikely).
    // Better: I'll check the server logs if available.
    
    // For now, let's just see if the routes are registered by checking a non-existent route vs these.
    try {
        const res = await axios.get(baseURL + '/dashboard');
        console.log('Dashboard:', res.status);
    } catch (e) {
        console.log('Dashboard Error:', e.response?.status || e.message);
    }

    try {
        const res = await axios.get(baseURL + '/reports/overview');
        console.log('Reports Overview:', res.status);
    } catch (e) {
        console.log('Reports Overview Error:', e.response?.status || e.message);
    }
}

testRoutes();
