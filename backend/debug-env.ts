import 'dotenv/config';

console.log('Current directory:', process.cwd());
console.log('GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
if (process.env.GEMINI_API_KEY) {
    console.log('Key length:', process.env.GEMINI_API_KEY.length);
    console.log('Key starts with:', process.env.GEMINI_API_KEY.substring(0, 4));
}
