import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    try {
        console.log('Fetching available models...');
        // Note: The SDK might not expose listModels directly easily, 
        // but let's try a simple generation to a text model directly to see if it works.
        // Actually, let's try a direct REST call to list models if SDK fails.

        // Using direct fetch to list models
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        console.log('Available models:');
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods})`);
            });
        } else {
            console.log('No models found in response:', data);
        }

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
