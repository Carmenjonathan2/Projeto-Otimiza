require('dotenv').config();
const axios = require('axios');

const token = process.env.LINKEDIN_ACCESS_TOKEN;

if (!token || token === 'seu_token_aqui') {
    console.error('❌ ERRO: Você ainda não colocou o seu token no arquivo .env!');
    process.exit(1);
}

console.log('🔍 Buscando seu ID único no LinkedIn (OpenID flow)...');

axios.get('https://api.linkedin.com/openid/userinfo', {
  headers: { 
    'Authorization': `Bearer ${token}`
  }
})
.then(res => {
  console.log('\n✅ SUCESSO ENCONTRADO!');
  console.log('Seu URN para o .env é:');
  console.log('-------------------------------------------');
  console.log(`urn:li:person:${res.data.sub}`);
  console.log('-------------------------------------------');
  console.log('\nCopie a linha acima e cole no seu arquivo .env em LINKEDIN_AUTHOR_URN');
})
.catch(err => {
  console.error('\n❌ ERRO NA API DO LINKEDIN:');
  if (err.response) {
    console.error('Status:', err.response.status);
    console.error('Detalhe:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error(err.message);
  }
});
