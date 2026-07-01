# Instruções — Gargalos Restantes
**Projeto:** Otimiza FarmaVet  
**Para:** Antigravity (agente executor)  
**De:** Claude (arquiteto)  
**Data:** 2026-07-01  
**Branch:** `claude/whatsapp-automation-review-a922hj`

> Este documento cobre os gargalos que NÃO são da automação WhatsApp (coberta em `INSTRUCOES_ANTIGRAVITY.md`).  
> Executar apenas após as Fases 0 e 1 da automação estarem concluídas.

---

## `gm_001` — GMB Local Authority
**Projeto:** Marketing Visual & Social  
**Autonomia:** semi (requer aprovação do Mestre para publicar)

### Contexto
A Otimiza FarmaVet precisa de presença consolidada no Google Meu Negócio (GMB). A tarefa é migrar da postagem manual para a **API Oficial GMB v1** com posts automáticos semanais.

### O que fazer

**1. Verificar se há projeto Google Cloud ativo**  
A conta Google já está configurada (ver `painel-autoridade/google_calendar.js`). O mesmo projeto pode ser usado para GMB.

**2. Ativar a API `mybusinesspostingapi` no Google Cloud Console**  
- Acessar: console.cloud.google.com → APIs & Services → Enable APIs  
- Buscar: "My Business Posts API" e ativar

**3. Criar `src/marketing/gmb_poster.js`**

```js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/business.manage'];
const TOKEN_FILE = path.resolve(__dirname, '../../painel-autoridade/token_gmb.json');
const CREDS_FILE = path.resolve(__dirname, '../../painel-autoridade/credentials.json');

async function autenticar() {
    const creds = JSON.parse(fs.readFileSync(CREDS_FILE));
    const { client_id, client_secret, redirect_uris } = creds.installed;
    const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_FILE));
    auth.setCredentials(token);
    return auth;
}

async function listarLocais(auth) {
    const mybusiness = google.mybusinessaccountmanagement({ version: 'v1', auth });
    const accounts = await mybusiness.accounts.list();
    const accountName = accounts.data.accounts[0].name;
    const locations = google.mybusinessbusinessinformation({ version: 'v1', auth });
    const locs = await locations.accounts.locations.list({ parent: accountName });
    return locs.data.locations || [];
}

async function publicarPost(auth, locationName, texto, tipoPost = 'STANDARD') {
    // A API de posts usa endpoint diferente
    const { GoogleAuth } = require('google-auth-library');
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`;
    const token = await auth.getAccessToken();

    const body = {
        languageCode: 'pt-BR',
        summary: texto,
        topicType: tipoPost,
        media: [] // Adicionar mídia se necessário
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    return res.json();
}

module.exports = { autenticar, listarLocais, publicarPost };
```

**4. Criar template de post semanal**  
Os posts devem seguir o calendário de conteúdo existente (ver `Sala de Guerra do Notion`). Sugestão de estrutura:

```js
const TEMPLATES_GMB = [
    {
        topico: 'PRODUTO_SEMANA',
        texto: (produto, preco) =>
            `🐾 Produto da Semana: ${produto}\n\nProteja seu pet com o melhor da medicina veterinária.\nPreço especial: R$ ${preco}\n\nPeça pelo WhatsApp ou retire em nossa farmácia.\n\n📍 Otimiza FarmaVet — Belo Horizonte`,
    },
    {
        topico: 'DICA_SAUDE',
        texto: (dica) =>
            `💡 Dica de Saúde Animal\n\n${dica}\n\nDúvidas? Fale com nosso time de especialistas.\n\n🔗 otimizafarmavet.com.br`,
    }
];
```

**5. Commit:**  
`feat(gmb): integração com API GMB v1 para posts automáticos`

### Bloqueio a reportar ao Mestre
- A OAuth do Google precisa ser reautorizada após a revogação das credenciais (tarefa `seg_001`). Executar `node auth_whatsapp.js` ou equivalente para gerar novo `token_gmb.json` antes de rodar.

---

## `tk_001` — TikTok UGC Automation
**Projeto:** Marketing Visual & Social  
**Autonomia:** semi

### Contexto
Pipeline de vídeos curtos gerados por IA para o perfil TikTok da Otimiza. O foco é **UGC-style** (User Generated Content) — vídeos que parecem feitos por clientes, não por marca.

### O que fazer

**1. Criar `src/marketing/tiktok_pipeline.js`**

O pipeline tem 3 etapas: geração de roteiro → geração de áudio/vídeo → agendamento.

```js
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Etapa 1: Gerar roteiro UGC com Gemini
async function gerarRoteiro(produto, formato = 'REVIEW') {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `Você é um tutor de pet de BH gravando um vídeo espontâneo sobre ${produto}.

Formato: ${formato} (15-30 segundos, tom casual, primeira pessoa)
Regras:
- Começa com gancho forte nos primeiros 2 segundos
- Cita o produto naturalmente (não soa como propaganda)
- Finaliza com CTA sutil ("comprei na Otimiza FarmaVet")
- Máximo 60 palavras
- SEM hashtags no roteiro (serão adicionadas na legenda)

Gere apenas o texto falado, sem indicações de cena.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

// Etapa 2: Salvar roteiro para revisão humana
function salvarParaRevisao(roteiro, produto) {
    const FILA = path.resolve(__dirname, '../../tiktok_fila_revisao.jsonl');
    const registro = {
        id: `tk_${Date.now()}`,
        produto,
        roteiro,
        criado_em: new Date().toISOString(),
        aprovado: null,
        publicado: false
    };
    fs.appendFileSync(FILA, JSON.stringify(registro) + '\n');
    console.log(`[TIKTOK] Roteiro salvo para revisão: ${registro.id}`);
    return registro.id;
}

module.exports = { gerarRoteiro, salvarParaRevisao };
```

**2. Criar script de revisão `revisar_tiktok.js`** na raiz de `comercial-automacao/`:

```js
// node revisar_tiktok.js
const readline = require('readline');
const fs = require('fs');

const FILA = './tiktok_fila_revisao.jsonl';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function revisar() {
    const linhas = fs.readFileSync(FILA, 'utf8').split('\n').filter(Boolean);
    const registros = linhas.map(l => JSON.parse(l));
    const pendentes = registros.filter(r => r.aprovado === null);

    console.log(`\n🎬 ${pendentes.length} roteiros pendentes de revisão.\n`);

    for (const r of pendentes) {
        console.log('─'.repeat(50));
        console.log(`🆔 ${r.id} | Produto: ${r.produto}`);
        console.log(`\n📝 Roteiro:\n${r.roteiro}\n`);
        const resp = await new Promise(res => rl.question('Aprovar? (s/n/editar): ', res));
        if (resp === 's') r.aprovado = true;
        else if (resp === 'n') r.aprovado = false;
        else if (resp === 'editar') {
            const novo = await new Promise(res => rl.question('Novo roteiro: ', res));
            r.roteiro = novo;
            r.aprovado = true;
        }
    }

    fs.writeFileSync(FILA, registros.map(r => JSON.stringify(r)).join('\n') + '\n');
    console.log('\n✅ Revisão salva.');
    rl.close();
}

revisar();
```

**3. Geração de vídeo (bloqueio manual)**  
A geração do vídeo final (voz + imagens) requer integração com ferramentas externas como **ElevenLabs** (voz) ou **Runway/HeyGen** (vídeo). Estas integrações têm custo e precisam de aprovação do Mestre antes de implementar.

> Por ora, o pipeline para no roteiro aprovado. O Mestre grava ou delega a gravação manualmente com base nos roteiros aprovados.

**4. Commit:**  
`feat(tiktok): pipeline de geração e revisão de roteiros UGC`

---

## `sh_001` — Vitrine Virtual Semana
**Projeto:** Shopify & E-commerce  
**Autonomia:** semi

### Contexto
Geração automática de flyers promocionais para o WhatsApp Status da Aika toda semana. O conteúdo vem dos produtos em destaque no GestãoClick.

### O que fazer

**1. Localizar `aika_vitrine.js`** em `comercial-automacao/src/personas/aika/`.

**2. Verificar o que já funciona** — o script provavelmente já busca produtos do GestãoClick. Mapear:
- Quais produtos ele seleciona?
- Como gera o flyer (texto puro, HTML, imagem)?
- Como envia para o Status?

**3. Se o flyer for apenas texto**, criar geração de imagem via Canvas API ou Sharp:

```js
// Instalar: npm install sharp
const sharp = require('sharp');

async function gerarFlyerProduto({ nome, preco, desconto, imagemUrl }) {
    // Template SVG simples com as cores da Otimiza
    const svg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="800" fill="#1a1a2e"/>
        <rect x="40" y="40" width="720" height="720" rx="20" fill="#16213e" stroke="#e94560" stroke-width="3"/>
        <text x="400" y="120" font-family="Arial" font-size="28" fill="#e94560" text-anchor="middle">OTIMIZA FARMAVET</text>
        <text x="400" y="200" font-family="Arial" font-size="22" fill="#ffffff" text-anchor="middle">🐾 Produto da Semana</text>
        <text x="400" y="400" font-family="Arial" font-size="36" fill="#ffffff" text-anchor="middle" font-weight="bold">${nome}</text>
        <text x="400" y="500" font-family="Arial" font-size="28" fill="#00d2ff" text-anchor="middle">R$ ${preco}</text>
        ${desconto ? `<text x="400" y="560" font-family="Arial" font-size="22" fill="#e94560" text-anchor="middle">${desconto}% OFF</text>` : ''}
        <text x="400" y="700" font-family="Arial" font-size="18" fill="#aaaaaa" text-anchor="middle">Peça pelo WhatsApp ↓</text>
    </svg>`;

    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const fileName = `flyer_${Date.now()}.png`;
    require('fs').writeFileSync(`./flyers/${fileName}`, buffer);
    return fileName;
}

module.exports = { gerarFlyerProduto };
```

**4. Criar pasta `flyers/`** em `comercial-automacao/` e adicionar ao `.gitignore` (arquivos gerados não devem ir para o repo).

**5. Integrar no `aika_vitrine.js`:** após gerar o flyer, enviar via Z-API como imagem para o Status:

```js
// Enviar imagem para Status via Z-API
async function enviarParaStatus(imagemPath) {
    const base64 = fs.readFileSync(imagemPath, 'base64');
    const url = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-image-status`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: `data:image/png;base64,${base64}` })
    });
}
```

> Verificar na documentação Z-API o endpoint correto para Status antes de implementar.

**6. Commit:**  
`feat(vitrine): geração automática de flyer PNG semanal com envio para Status`

---

## `rt_003` — Automação Disparo Currículo Kyenner
**Projeto:** Prospecção Ativa  
**Autonomia:** semi

### Contexto
Automação para busca de vagas e candidatura automática para recolocação profissional do Kyenner (Jonathas). Fora do escopo da automação comercial da Otimiza.

### O que fazer

**1. Criar `src/personas/kyenner/kyenner_recolocacao.js`**

```js
const puppeteer = require('puppeteer');
const fs = require('fs');

const PLATAFORMAS = [
    { nome: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=farmácia+veterinária&location=Belo+Horizonte' },
    { nome: 'Gupy', url: 'https://portal.gupy.io/job-search/term=veterinário&city=Belo+Horizonte' }
];

const VAGAS_VISTAS = './kyenner_vagas_vistas.json';

async function buscarVagas() {
    const vistas = fs.existsSync(VAGAS_VISTAS) ? JSON.parse(fs.readFileSync(VAGAS_VISTAS)) : [];
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const novas = [];

    for (const plataforma of PLATAFORMAS) {
        try {
            const page = await browser.newPage();
            await page.goto(plataforma.url, { waitUntil: 'networkidle2', timeout: 30000 });
            // Extração específica por plataforma — implementar seletores após inspecionar o HTML
            // Exemplo genérico:
            const vagas = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.job-card, .job-item, [data-job-id]')).map(el => ({
                    titulo: el.querySelector('h3, .title')?.innerText || '',
                    empresa: el.querySelector('.company, .employer')?.innerText || '',
                    url: el.querySelector('a')?.href || ''
                })).filter(v => v.titulo && v.url);
            });
            novas.push(...vagas.filter(v => !vistas.includes(v.url)).map(v => ({ ...v, plataforma: plataforma.nome })));
            await page.close();
        } catch (e) {
            console.error(`[KYENNER] Erro em ${plataforma.nome}:`, e.message);
        }
    }

    await browser.close();
    return novas;
}

async function alertarVagasNovas(vagas) {
    if (!vagas.length) return;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = '868045878'; // Jonathas
    const texto = `🎯 *${vagas.length} vagas novas encontradas*\n\n` +
        vagas.map(v => `• *${v.titulo}* — ${v.empresa} (${v.plataforma})\n  ${v.url}`).join('\n\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' })
    });

    // Marcar como vistas
    const vistas = fs.existsSync(VAGAS_VISTAS) ? JSON.parse(fs.readFileSync(VAGAS_VISTAS)) : [];
    fs.writeFileSync(VAGAS_VISTAS, JSON.stringify([...vistas, ...vagas.map(v => v.url)], null, 2));
}

module.exports = { buscarVagas, alertarVagasNovas };
```

**2. Adicionar ao `comando_central.js`** com execução diária (ex: às 8h):

```js
// No comando_central.js, na lista de rotinas:
const { buscarVagas, alertarVagasNovas } = require('./src/personas/kyenner/kyenner_recolocacao');

// Dentro da função principal:
const vagas = await buscarVagas();
await alertarVagasNovas(vagas);
console.log(`[KYENNER] ${vagas.length} vagas novas alertadas no Telegram.`);
```

**3. Candidatura automática (fase futura)**  
O preenchimento automático de formulários de candidatura (LinkedIn Easy Apply, Gupy) é possível com Puppeteer mas requer:
- Currículo em PDF atualizado em `kyenner_curriculo.pdf`
- Mapeamento dos campos de cada plataforma
- Aprovação do Jonathas antes de cada candidatura (enviar lista via Telegram e aguardar confirmação `s/n`)

> Por ora, implementar apenas a **busca + alerta**. Candidatura manual a partir do link enviado no Telegram.

**4. Commit:**  
`feat(kyenner): busca automática de vagas com alerta Telegram`

---

## `snc_003` — Auditoria Semanal SNC (Crítico de Arte)
**Coluna:** cofre (ideia para desenhar, sem prazo)

### Contexto
Rotina semanal automatizada que consolida logs do bot, analisa com Gemini e gera relatório de saúde emocional/tom da Aika.

### Esboço (não implementar agora — aguardar Fase 1 concluída)

O script `src/aprendizado/analise_semanal.js` provavelmente já existe (ver `obs_003` em motor). Verificar o que já foi feito antes de criar algo novo.

Se não existir, o fluxo é:
1. Ler `sugestoes_bot.jsonl` da semana
2. Ler `validacoes_reprovadas.jsonl` do validador semântico
3. Montar prompt de auditoria para Gemini com amostra dos logs
4. Gemini avalia: tom, compliance, taxa de reprovação, padrões problemáticos
5. Gerar relatório em `relatorios/auditoria_snc_YYYY-WW.md`
6. Enviar resumo no Telegram para Carmen e Jonathas

> Mover de `cofre` para `gargalo` somente após a Fase 1 estar 100% em produção.

---

## Ordem de execução recomendada

```
1. INSTRUCOES_ANTIGRAVITY.md  ← Fase 0 + Fase 1 (automação WhatsApp) — PRIORIDADE MÁXIMA
2. sh_001  ← Vitrine (impacto imediato em vendas, depende de aika_vitrine.js já existente)
3. gm_001  ← GMB (requer reautorização Google após seg_001)
4. rt_003  ← Currículo Kyenner (independente, pode rodar em paralelo)
5. tk_001  ← TikTok (aguardar decisão sobre geração de vídeo)
6. snc_003 ← Auditoria SNC (aguardar Fase 1 em produção)
```

---

*Documento criado em 2026-07-01 pelo Claude (arquiteto). Versão 1.0.*
