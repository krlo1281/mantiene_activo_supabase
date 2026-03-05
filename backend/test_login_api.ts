
import 'dotenv/config'

async function testLogin() {
    try {
        console.log('Attempting login to http://localhost:3000/api/auth/login...');
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "admin" }),
        });

        const status = response.status;
        const text = await response.text();

        console.log(`Status: ${status}`);
        console.log(`Body: ${text}`);

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testLogin();
