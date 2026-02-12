import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { convertToKanbanTask } from './services/taskService.js';
import Task from './models/Task.js';

dotenv.config();

const TEST_INPUTS = [
    {
        text: "Create an urgent task to review the legal contract for the new client complaint.",
        params: { title: "Review Contract", tags: [] },
        expectedTags: ["urgent", "legal", "client-risk"]
    },
    {
        text: "Fix the billing bug on the payment page asap.",
        params: { title: "Fix Billing Bug", tags: ["bug"] }, // Simulate AI finding one tag
        expectedTags: ["bug", "finance", "urgent"]
    },
    {
        text: "Schedule a meeting with the team.",
        params: { title: "Team Meeting", tags: [] },
        expectedTags: []
    }
];

async function runTest() {
    console.log("🔍 Testing Service Logic (Bypassing AI)...\n");

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB Connected");

        // Use a dummy user ID
        const userId = new mongoose.Types.ObjectId();

        for (const input of TEST_INPUTS) {
            console.log(`\n📝 Input: "${input.text}"`);

            const task = await convertToKanbanTask(userId, input.params, input.text, 'Tester');

            console.log(`✅ Task Created: "${task.title}"`);
            console.log(`   Result Tags: ${JSON.stringify(task.tags)}`);

            // Check if expected tags are present
            const missing = input.expectedTags.filter(t => !task.tags.includes(t));
            if (missing.length === 0) {
                console.log("   Status: PASS");
            } else {
                console.error(`   Status: FAIL (Missing: ${missing.join(', ')})`);
            }

            // Cleanup
            await Task.findByIdAndDelete(task.id);
        }

    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n🛑 MongoDB Disconnected");
    }
}

runTest();
