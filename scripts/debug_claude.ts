import { ChatAnthropic } from "@langchain/anthropic";
import * as dotenv from "dotenv";

dotenv.config();

const testClaude = async () => {
    console.log("Testing Claude with API Key:", process.env.ANTHROPIC_API_KEY?.substring(0, 15) + "...");

    const modelsToTest = [
        "claude-3-5-haiku-20241022",
        "claude-3-opus-20240229",
        "claude-2.1",
        "claude-instant-1.2"
    ];

    for (const modelName of modelsToTest) {
        try {
            console.log(`\n--- Attempting with ${modelName} ---`);
            const model = new ChatAnthropic({
                modelName: modelName,
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
            const res = await model.invoke("Hello");
            console.log("Result success for " + modelName);
        } catch (e: any) {
            console.error(`${modelName} Failed:`, e.message || e);
        }
    }
};

testClaude();
