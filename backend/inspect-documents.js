
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
        // Log all keys to see if we missed anything useful
        const item = res.data.data[0];
        console.log('Available Keys:', Object.keys(item));
        console.log('Submission/Doc Fields:', {
            submit_doc: item.submit_doc,
            doc_info: item.doc_info,
            file_url: item.file_url,
            atch_file: item.atch_file,
            aply_mthd_etc_istc: item.aply_mthd_etc_istc
        });
        console.log('Full Item:', JSON.stringify(item, null, 2));
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
    }
}

testEndpoints();
