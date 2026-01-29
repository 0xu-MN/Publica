
const axios = require('axios');

const baseUrl = 'https://apis.data.go.kr/B552735/kisedKstartupService01';
const key = '96df5cafd7d256bb4dec7aad96843c3f89d287221a786afa752d3dd90b316041';
const op = '/getAnnouncementInformation01';

async function testEndpoints() {
    try {
        const url = `${baseUrl}${op}?serviceKey=${key}&returnType=json&page=1&perPage=1`;
        console.log(`Testing: ${url}`);
        const res = await axios.get(url);
        console.log(`✅ SUCCESS`);
        console.log('Full Item Structure:', JSON.stringify(res.data.data[0], null, 2));
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        if (err.response) {
            console.log('Error Data:', JSON.stringify(err.response.data));
        }
    }
}

testEndpoints();
