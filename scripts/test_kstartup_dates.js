const axios = require('axios');
const key = '96df5cafd7d256bb4dec7aad96843c3f89d287221a786afa752d3dd90b316041';
const url1 = `https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01?serviceKey=${key}&returnType=json&page=1&perPage=1`;
const urlLAST = `https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01?serviceKey=${key}&returnType=json&page=200&perPage=1`;
async function run() {
    const p1 = await axios.get(url1);
    console.log("Page 1 Date:", p1.data.data[0].pbanc_rcpt_bgng_dt);
    try {
        const pLast = await axios.get(urlLAST);
        console.log("Page 200 Date:", pLast.data.data[0].pbanc_rcpt_bgng_dt);
    } catch (e) { }
}
run();
