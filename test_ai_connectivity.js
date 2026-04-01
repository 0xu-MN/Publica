const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    console.log("Gemini Response:", response.text());
    return true;
  } catch (error) {
    console.error("Gemini Error:", error.message);
    return false;
  }
}

testGemini();
