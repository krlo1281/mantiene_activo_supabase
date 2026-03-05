
import fetch from 'node-fetch';

async function test() {
    try {
        const response = await fetch('http://localhost:3000/api/companies');
        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }
        const data = await response.json();
        console.log('Companies count:', Array.isArray(data) ? data.length : 'Not an array');
        console.log('First company:', Array.isArray(data) && data.length > 0 ? data[0] : 'None');
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

test();
