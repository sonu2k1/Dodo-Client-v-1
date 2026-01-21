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
function getModel() {
    return genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
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
 * Generate AI response
 * @param {string} prompt - The formatted prompt to send to Gemini
 * @returns {Promise<string>} - AI generated response
 */
export async function generateResponse(prompt) {
    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate AI response');
    }
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
