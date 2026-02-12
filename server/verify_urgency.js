
const BASE_URL = 'http://127.0.0.1:3001/api';

const TEST_MESSAGES = [
    // { text: "Hello, how are you?", expectedUrgency: "Low", expectedIntent: "GENERAL/GENERAL_RESPONSE" },
    { text: "My wallet has been hacked! I lost all my money!", expectedUrgency: "High", expectedIntent: "URGENT_ISSUE" },
    // { text: "I want to file a complaint about the last transaction.", expectedUrgency: "Medium", expectedIntent: "COMPLAINT" },
    // { text: "Great app, I love the new features!", expectedUrgency: "Low", expectedIntent: "FEEDBACK" }
];

async function testUrgency() {
    console.log("🔍 Testing Urgency and Intent Analysis...\n");

    try {
        // 1. Register/Login to get token
        console.log("🔑 Authenticating...");
        let token;
        const userCreds = {
            name: 'Test User',
            email: `test_${Date.now()}@example.com`,
            password: 'password123'
        };

        const registerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userCreds)
        });

        const registerData = await registerRes.json();
        console.log("Register Response Status:", registerRes.status);
        console.log("Register Response Data:", JSON.stringify(registerData, null, 2));

        if (registerData.token || registerData.accessToken) {
            token = registerData.token || registerData.accessToken;
        } else {
            // If already exists or fails, try login (though unique email should prevent this)
            // simplified for this script
            if (!token) throw new Error("Authentication failed: " + JSON.stringify(registerData));
        }
        console.log("✅ Authenticated.\n");


        // 2. Test Chat
        for (const msg of TEST_MESSAGES) {
            console.log(`\n📤 Sending: "${msg.text}"...`);
            const response = await fetch(`${BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: msg.text })
            });

            console.log("📥 Status:", response.status);
            const text = await response.text();
            console.log("📥 Raw Response:", text.substring(0, 500)); // Log first 500 chars

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("❌ Failed to parse JSON response:", e.message);
                continue;
            }

            if (data.error) {
                console.error(`❌ Error response:`, data.error);
                continue;
            }

            const urgency = data.data?.urgencyScore;
            const intentType = data.data?.intentType;

            console.log(`   Expected: ${msg.expectedUrgency} Urgency, ${msg.expectedIntent}`);
            console.log(`   Result:   Urgency Score: ${urgency}, Intent Type: ${intentType}`);
            console.log('---');
        }

    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

testUrgency();
