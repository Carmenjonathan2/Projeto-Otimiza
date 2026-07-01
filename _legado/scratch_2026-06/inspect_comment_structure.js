const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TOKEN = process.env.TOKEN;
const post_id = "18344713021172206";

console.log("Inspecting raw comment structure for post:", post_id);

axios.get(`https://graph.instagram.com/v19.0/${post_id}/comments`, {
    params: {
        fields: 'id,text,timestamp,username',
        access_token: TOKEN
    }
})
.then(res => {
    console.log("✅ RAW RESPONSE:");
    console.log(JSON.stringify(res.data, null, 2));
})
.catch(err => {
    console.error("❌ ERROR:");
    if (err.response) {
        console.error(err.response.status, err.response.data);
    } else {
        console.error(err.message);
    }
});
