require('dotenv').config();
const fetch = require('node-fetch');
const apiKey = process.env.DATA_GO_KR_API_KEY;
async function main() {
    const url1 = `https://apis.data.go.kr/B552735/kisedBizInfoService/getBizInfoList?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=10&startDate=20240101&endDate=20251231&type=json`;
    try {
        const res = await fetch(url1);
        const text = await res.text();
        console.log("With Dates:", text.substring(0, 1000));
    } catch(e) { console.error(e); }
    
    // Fallback new endpoint
    const url2 = `https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01?serviceKey=${encodeURIComponent(apiKey)}&returnType=json&page=1&perPage=10`;
    try {
        const res = await fetch(url2);
        const text = await res.text();
        console.log("\nNew Endpoint:", text.substring(0, 1000));
    } catch(e) { console.error(e); }
}
main();
