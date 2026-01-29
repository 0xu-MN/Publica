
const axios = require('axios');

const baseUrl = 'https://apis.data.go.kr/B552735/kisedKstartupService01';
const key = '96df5cafd7d256bb4dec7aad96843c3f89d287221a786afa752d3dd90b316041';
const op = '/getBusinessInformation01';

async function testEndpoints() {
    try {
        const url = `${baseUrl}${op}?serviceKey=${key}&returnType=json&page=1&perPage=1`;
        console.log(`Testing: ${url}`);
        const res = await axios.get(url);
        console.log(`✅ SUCCESS`);
        const item = res.data.data[0];
        console.log('Available Keys:', Object.keys(item));
        console.log('Details:', {
            biz_supt_ctnt: item.biz_supt_ctnt, // Check for support content
            biz_supt_bdgt_info: item.biz_supt_bdgt_info,
            file_url: item.file_url,
            atch_file: item.atch_file
        });
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        if (err.response) {
            console.log('Error Data:', JSON.stringify(err.response.data).substring(0, 200));
        }
    }
}

testEndpoints();
