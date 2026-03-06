import dotenv from 'dotenv';
dotenv.config();

const API_KEY = "96df5cafd7d256bb4dec7aad96843c3f89d287221a786afa752d3dd90b316041";
// Using the first UDDI found in the OpenAPI spec
const BASE_URL = "https://api.odcloud.kr/api/3034791/v1/uddi:f76639a7-27ea-48da-a4f4-c7dca8032a49_201710261128";

async function testBizinfo() {
    try {
        const url = `${BASE_URL}?page=1&perPage=5&serviceKey=${API_KEY}`;
        console.log("Fetching:", url);

        const res = await fetch(url);
        const data = await res.json();

        console.log("Status:", res.status);
        if (data.data) {
            console.log("Data structure (first item):", JSON.stringify(data.data[0], null, 2));
        } else {
            console.log("Full data:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testBizinfo();
