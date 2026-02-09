import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as dotenv from "dotenv";

dotenv.config();

const testGemini = async () => {
    console.log("Testing Gemini with API Key:", process.env.GOOGLE_API_KEY?.substring(0, 8) + "...");

    // Testing the core Pro versions confirmed in models.json
    const modelsToTest = ["gemini-3-pro-preview", "gemini-2.5-pro", "gemini-pro-latest"];

    for (const modelName of modelsToTest) {
        try {
            console.log(`\n--- Attempting with ${modelName} ---`);
            const model = new ChatGoogleGenerativeAI({
                model: modelName,
                apiKey: process.env.GOOGLE_API_KEY,
            });
            const res = await model.invoke("Hello, say 'Model " + modelName + " works'");
            console.log("Result:", res.content);
        } catch (e: any) {
            console.error(`${modelName} Failed:`, e.message);
        }
    }
};

testGemini();
