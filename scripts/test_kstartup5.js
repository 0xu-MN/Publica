require('dotenv').config();
const fetch = require('node-fetch');
const apiKey = process.env.DATA_GO_KR_API_KEY;
async function main() {
    const url = `https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01?serviceKey=${encodeURIComponent(apiKey)}&returnType=json&page=1&perPage=10`;
    console.log("Testing:", url);
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("Response:", text.substring(0, 500));
    } catch (e) { console.error(e); }
}
main();
