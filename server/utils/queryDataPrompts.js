/**
 * Prompt templates for the QUERY_DATA intent.
 * Formats fetched app data into a Gemini follow-up prompt
 * so the AI can summarise the results in natural language.
 */

/**
 * Build a follow-up Gemini prompt that includes the raw query results
 * and asks for a natural-language summary.
 *
 * @param {string} userMessage - The original user message
 * @param {string} queryType  - e.g. RECENT_TRANSACTIONS
 * @param {object} queryResults - Data returned by dataQueryService
 * @returns {string} formatted prompt
 */
export function formatQueryDataPrompt(userMessage, queryType, queryResults) {
    return `You are the AI Concierge for DoDo Point Client Concierge.

The user asked: "${userMessage}"

I fetched the following ${queryResults.label || queryType} data from the system:

\`\`\`json
${JSON.stringify(queryResults, null, 2)}
\`\`\`

Instructions:
- Summarise the above data in a clear, friendly, natural-language response.
- Use bullet points or short lists for multiple items.
- Format currency amounts with a "$" or "₹" sign (match the data's currency field; default to "$").
- Format dates in a human-readable way (e.g. "Feb 10, 2026").
- If the data set is empty or not found, let the user know politely.
- Do NOT invent or guess any figures; only use the data provided above.
- Keep the response concise (3-6 sentences or a short list).
- Do NOT return JSON. Reply with plain text only.

AI:`;
}
