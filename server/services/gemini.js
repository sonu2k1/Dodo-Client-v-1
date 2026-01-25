import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Gemini AI Service
 * Handles all interactions with Google Gemini API
 */

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get Gemini model instance
 */
function getModel(modelName = 'gemini-3-flash-preview') {
    return genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
        },
        safetySettings: [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
        ],
    });
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate AI response with retry logic
 * @param {string} prompt - The formatted prompt to send to Gemini
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<string>} - AI generated response
 */
export async function generateResponse(prompt, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const model = getModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return text;
        } catch (error) {
            lastError = error;
            console.error(`Gemini API Error (attempt ${attempt}/${maxRetries}):`, error.message);

            // Check if it's a retryable error (503, 429, etc.)
            if (error.status === 503 || error.status === 429) {
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                    console.log(`⏳ Retrying in ${delay / 1000}s...`);
                    await sleep(delay);
                    continue;
                }
            } else {
                // Non-retryable error, throw immediately
                throw new Error('Failed to generate AI response: ' + error.message);
            }
        }
    }

    throw new Error('Failed to generate AI response after ' + maxRetries + ' attempts: ' + lastError?.message);
}

/**
 * Generate streaming response (for future implementation)
 */
export async function generateStreamingResponse(prompt) {
    try {
        const model = getModel();
        const result = await model.generateContentStream(prompt);
        return result.stream;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate streaming response');
    }
}
