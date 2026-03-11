require('dotenv').config();
const fetch = require('node-fetch');
const apiKey = process.env.DATA_GO_KR_API_KEY;
async function main() {
    const url = `https://apis.data.go.kr/B552735/k-startup/bizAnnouncementList?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=10&type=json`;
    console.log("Testing:", url);
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("Response:", text.substring(0, 1000));
    } catch (e) { console.error(e); }
}
main();
