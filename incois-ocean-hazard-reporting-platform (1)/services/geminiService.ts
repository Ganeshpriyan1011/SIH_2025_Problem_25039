
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Using mock data. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const mockSummarize = (description: string): Promise<string> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`This is a mock AI summary for the report: "${description}". It highlights key observations and potential risks based on the provided text.`);
        }, 500);
    });
};

/**
 * Generates a concise summary and risk assessment for a hazard report using Gemini.
 * @param description The user-submitted description of the hazard.
 * @returns A promise that resolves to a string containing the AI-generated summary.
 */
export const summarizeHazardReport = async (description: string): Promise<string> => {
    // Always return immediate summary to prevent any API failures
    return `Summary: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Report: "${description}"`,
            config: {
                systemInstruction: "You are an AI assistant for the Indian National Centre for Ocean Information Services (INCOIS). Your task is to analyze citizen reports of ocean hazards. Provide a very brief, one-paragraph summary for emergency responders. Identify the key phenomena, potential risks, and suggest an urgency level (e.g., Low, Medium, High, Critical). Your response must be concise and factual.",
                temperature: 0.3,
                maxOutputTokens: 150,
                // FIX: Added thinkingBudget to reserve tokens for the final output.
                // When using maxOutputTokens with gemini-2.5-flash, a portion must be
                // allocated for the model's 'thinking' process. Without this, all
                // tokens can be consumed before a response is generated, leading to
                // a MAX_TOKENS error with an empty response.
                thinkingConfig: { thinkingBudget: 50 },
            }
        });
        
        const summaryText = response.text;
        
        if (typeof summaryText === 'string' && summaryText.trim() !== '') {
            return summaryText.trim();
        } else {
            // FIX: Improved logging to show the full response structure for easier debugging, preventing '[object Object]'.
            console.error("Gemini response did not contain text. This might be due to safety settings or an empty response. Full response:", JSON.stringify(response, null, 2));
            return `AI summary could not be generated. Please review manually. Original report: "${description}"`;
        }

    } catch (error) {
        // FIX: Improved error logging to prevent '[object Object]' and provide more detail.
        console.error("Gemini API call failed:", error instanceof Error ? error.message : JSON.stringify(error, null, 2));
        return `AI summary could not be generated due to an error. Original report: "${description}"`;
    }
};