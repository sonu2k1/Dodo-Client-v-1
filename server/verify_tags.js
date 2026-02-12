
const BASE_URL = 'http://127.0.0.1:3001/api';

const TEST_INPUTS = [
    { text: "Create an urgent task to review the legal contract for the new client complaint.", expectedTags: ["urgent", "legal", "client-risk"] },
    { text: "Fix the billing bug on the payment page asap.", expectedTags: ["bug", "finance", "urgent"] },
    { text: "Schedule a meeting with the team.", expectedTags: [] }
];

async function testTags() {
    console.log("🔍 Testing Auto-Tagging...\n");

    try {
        // 1. Register/Login to get token
        console.log("🔑 Authenticating...");
        let token;
        const userCreds = {
            name: 'Tag Tester',
            email: `tag_tester_${Date.now()}@example.com`,
            password: 'password123'
        };

        const registerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userCreds)
        });

        const registerData = await registerRes.json();

        if (registerData.token || registerData.accessToken) {
            token = registerData.token || registerData.accessToken;
        } else {
            if (!token) throw new Error("Authentication failed: " + JSON.stringify(registerData));
        }
        console.log("✅ Authenticated.\n");

        // 2. Test Tags
        for (const input of TEST_INPUTS) {
            console.log(`\n📤 Sending: "${input.text}"...`);
            const response = await fetch(`${BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: input.text })
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("❌ Failed to parse JSON response:", e.message);
                continue;
            }

            if (data.error) {
                console.error(`❌ Error response:`, data.error);
                console.error(`   Message:`, data.message);
                continue;
            }

            const task = data.data?.task;

            if (task) {
                console.log(`✅ Task Created: "${task.title}"`);
                console.log(`   Tags: ${JSON.stringify(task.tags)}`);
                console.log(`   Expected Tags (approx): ${JSON.stringify(input.expectedTags)}`);
            } else {
                console.log(`⚠️ No task created in response data.`);
                console.log(`Response: ${data.message}`);
            }

            console.log('---');
        }

    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

testTags();
