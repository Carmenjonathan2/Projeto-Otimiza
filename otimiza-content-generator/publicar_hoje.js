require('dotenv').config();
const axios = require('axios');

const LINKEDIN_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_URN   = process.env.LINKEDIN_AUTHOR_URN;

// TEXTO LIMPO (Sem os rótulos de backend)
const textToPost = `ENVELHECER NÃO É DESCULPA PARA A CONFUSÃO MENTAL DOS SEUS PACIENTES.

Muitos clínicos, e a maioria dos tutores, ainda tratam a desorientação do pet sênior como "coisa da idade". Ignorar a Síndrome de Disfunção Cognitiva (SDC) é deixar o paciente em um limbo de ansiedade; uma perda de dignidade por pura falta de diagnóstico ambulatorial precoce.

A SDC é uma patologia neurodegenerativa progressiva: embora não tenha cura, o manejo multimodal transforma o prognóstico. O segredo está em tirar o pet do estado de inércia cognitiva antes que a degeneração proteica seja irreversível.

• Melhora imediata no ciclo sono-vigília com suporte nutricional.
• Redução drástica da ansiedade noturna e perambulação.
• Resgate do engajamento social do animal com a família.

Como RT, reforço que o uso de nutracêuticos como a S-adenosilmetionina (SAMe) e a fosfatidilserina, aliados a uma dieta rica em TCMs (Triglicerídeos de Cadeia Média), não é luxo: é medicina de precisão para blindar o encéfalo contra o acúmulo de proteínas b-amiloides.

1. Realize check-ups geriátricos rigorosos a cada 6 meses.
2. Aplique questionários específicos de diagnóstico (escala DISHA).
3. Implemente protocolos de enriquecimento ambiental focado em faro.
4. Substitua a dieta comum por suporte neurológico de alta performance.

A pergunta que fica para os colegas de profissão: estamos realmente fazendo geriatria ou apenas esperando o tempo passar em nossas clínicas? Qual é o seu protocolo de primeira escolha para pacientes senis desorientados?`;

async function publish() {
    if (!LINKEDIN_TOKEN || !LINKEDIN_URN) {
        console.error("❌ Erro: Tokens do LinkedIn não encontrados no .env");
        return;
    }

    console.log("🚀 Publicando versão LIMPA no LinkedIn...");
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    const payload = {
        "author": LINKEDIN_URN,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": textToPost
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    try {
        const res = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${LINKEDIN_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        console.log("🎉 POST LIMPO PUBLICADO COM SUCESSO!");
        console.log("ID da publicação:", res.data.id);
    } catch (err) {
        // Log simplificado do erro para facilitar leitura
        const errorData = err.response?.data;
        if (errorData) {
            console.error("❌ Erro 422 - O LinkedIn rejeitou o post.");
            console.error("Possível motivo: Post duplicado ou limite de frequência atingido.");
            console.error("Detalhes:", JSON.stringify(errorData, null, 2));
        } else {
            console.error("❌ Erro inesperado:", err.message);
        }
    }
}

publish();
