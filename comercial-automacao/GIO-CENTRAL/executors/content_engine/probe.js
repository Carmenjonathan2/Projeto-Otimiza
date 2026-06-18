require('dotenv').config();
const axios = require('axios');
const STORE_URL = process.env.SHOPIFY_STORE_URL; 
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; 

const q = `
  query {
    __type(name: "Article") {
      fields {
        name
      }
    }
  }
`;

axios.post(`https://${STORE_URL}/admin/api/2024-01/graphql.json`, {query: q}, {headers: {'X-Shopify-Access-Token': SHOPIFY_TOKEN}})
.then(r => console.log(r.data.data.__type.fields.map(f=>f.name).join(', ')))
.catch(e => console.error(e));
