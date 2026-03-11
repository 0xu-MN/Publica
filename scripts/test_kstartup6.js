const axios = require('axios');
const key = '96df5cafd7d256bb4dec7aad96843c3f89d287221a786afa752d3dd90b316041';
const url = `https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01?serviceKey=${key}&returnType=json&page=1&perPage=1`;
axios.get(url).then(res => {
    const item = res.data.data[0];
    console.log(item);
}).catch(console.error);
