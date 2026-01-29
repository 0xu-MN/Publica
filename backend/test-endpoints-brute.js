
const axios = require('axios');

const baseUrl = 'https://apis.data.go.kr/B552735/kisedKstartupService01';
const key = '96df5cafd7d256bb4dec7aad96843c3f89d287221a786afa752d3dd90b316041'; // User provided hex key

// Try to convert hex key to base64 just in case
const hexToBase64 = (hex) => {
    return Buffer.from(hex, 'hex').toString('base64');
}
const base64Key = hexToBase64(key);

console.log('Original Key:', key);
console.log('Base64 Converted Key:', base64Key);

const operations = [
    '/getAnnouncementInformation01', // User provided correct endpoint
    '/getBusinessInformation01',
];

async function testEndpoints() {
    console.log('Testing with Original Key...');
    for (const op of operations) {
        try {
            // User specified parameters: returnType=json, page=1, perPage=10
            const url = `${baseUrl}${op}?serviceKey=${key}&returnType=json&page=1&perPage=10`;
            console.log(`Testing: ${url}`);
            const res = await axios.get(url);
            console.log(`✅ SUCCESS [${op}] - Status: ${res.status}`);
            console.log('Response:', JSON.stringify(res.data).substring(0, 200));
        } catch (err) {
            console.log(`❌ FAILED [${op}] - Status: ${err.response ? err.response.status : err.message}`);
            if (err.response) {
                console.log('Error Data:', JSON.stringify(err.response.data).substring(0, 200));
            }
        }
    }

    console.log('\nTesting with Base64 Key...');
    for (const op of operations) {
        try {
            const url = `${baseUrl}${op}?serviceKey=${encodeURIComponent(base64Key)}&returnType=json&page=1&perPage=10`;
            console.log(`Testing: ${url}`);
            const res = await axios.get(url);
            console.log(`✅ SUCCESS [${op}] - Status: ${res.status}`);
            console.log('Response:', JSON.stringify(res.data).substring(0, 200));
        } catch (err) {
            console.log(`❌ FAILED [${op}] - Status: ${err.response ? err.response.status : err.message}`);
            if (err.response) {
                console.log('Error Data:', JSON.stringify(err.response.data).substring(0, 200));
            }
        }
    }
}

testEndpoints();
