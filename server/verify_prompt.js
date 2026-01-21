import { formatPrompt } from './utils/prompts.js';

const mockContext = {
    userData: {
        balance: 1000,
        transactions: [
            { id: 1, type: 'purchase', amount: -45.00, merchant: 'Test Merchant', date: '2024-03-15' }
        ]
    }
};

const prompt = formatPrompt("How much did I spend?", mockContext);

console.log("Generated Prompt:");
console.log(prompt);

// Check for formatted amount because logic uses Math.abs and parenthesis
// Format: - 2024-03-15: Test Merchant ($45.00) [purchase]
if (prompt.includes("Test Merchant") && prompt.includes("($45.00)")) {
    console.log("\n✅ SUCCESS: Transaction data found in prompt.");
} else {
    console.error("\n❌ FAILURE: Transaction data MISSING from prompt.");
    process.exit(1);
}
