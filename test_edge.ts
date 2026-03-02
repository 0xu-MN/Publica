const apiKey = process.env.GEMINI_API_KEY;
const LLM_MODEL = 'gemini-2.5-flash';
const SYSTEM_PROMPT = "You are a KOREAN AI Agent.";
const finalPrompt = "\n[Input]: Hello\n";

const payload = {
    contents: [{
        role: "user",
        parts: [{ text: SYSTEM_PROMPT + "\n\n" + finalPrompt }]
    }],
    generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
    }
};

fetch(`https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
.then(res => res.text())
.then(console.log);
