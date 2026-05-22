const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ETAPAS_VALIDAS = ['novo', 'interessado', 'negociacao', 'fechado', 'perdido'];
const TEMPERATURAS_VALIDAS = ['frio', 'morno', 'quente'];

const SYSTEM_PROMPT = `Você é um analista de CRM especializado em vendas veterinárias B2B e B2C.
Analise o histórico de conversas de WhatsApp e retorne uma classificação em JSON.

Produtos vendidos: Bravecto, Nexgard, Simparic, Credeli, Seresto, Scalibor, Frontmax, Leevre, vacinas, consultas veterinárias.
Contexto B2B: Prospecção de condomínios em Belo Horizonte para campanhas de vacinação.

Responda SOMENTE com JSON válido no formato:
{
  "etapa": "novo|interessado|negociacao|fechado|perdido",
  "temperatura": "frio|morno|quente",
  "proxima_acao": "texto curto com a próxima ação recomendada para o comercial",
  "resumo_ia": "resumo de 1-2 frases do estágio atual deste lead"
}

Critérios de etapa:
- novo: primeiro contato, sem resposta ainda ou resposta genérica
- interessado: demonstrou interesse, pediu informações, perguntou preço/produto
- negociacao: está avançando, pediu orçamento formal, discutindo condições
- fechado: confirmou pedido, enviou pix, fez pagamento, confirmou entrega
- perdido: disse não obrigado, bloqueou, sem resposta há mais de 7 dias

Critérios de temperatura:
- quente: respondeu hoje ou ontem, perguntou preço/produto, está negociando
- morno: respondeu nos últimos 3 dias, demonstrou algum interesse
- frio: não responde há mais de 3 dias ou deu respostas vagas`;

async function classificarLead(interacoes, nomeLead) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return {
            etapa: 'novo',
            temperatura: 'morno',
            proxima_acao: 'Configurar ANTHROPIC_API_KEY para ativar IA',
            resumo_ia: 'Classificação automática desativada — chave de API não configurada.'
        };
    }

    const historicoTexto = interacoes
        .slice(0, 15)
        .reverse()
        .map(i => `[${i.timestamp}] ${i.quem}: ${i.mensagem || '(áudio)'}`)
        .join('\n');

    try {
        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system: SYSTEM_PROMPT,
            messages: [{
                role: 'user',
                content: `Lead: ${nomeLead}\n\nÚltimas interações:\n${historicoTexto || 'Nenhuma interação ainda.'}`
            }]
        });

        const texto = response.content[0].text.trim();
        const json = JSON.parse(texto);

        return {
            etapa: ETAPAS_VALIDAS.includes(json.etapa) ? json.etapa : 'novo',
            temperatura: TEMPERATURAS_VALIDAS.includes(json.temperatura) ? json.temperatura : 'morno',
            proxima_acao: json.proxima_acao || '',
            resumo_ia: json.resumo_ia || ''
        };
    } catch (err) {
        console.error('[IA] Erro na classificação:', err.message);
        return {
            etapa: 'novo',
            temperatura: 'morno',
            proxima_acao: 'Revisar manualmente — erro na classificação automática',
            resumo_ia: 'Erro ao processar com IA.'
        };
    }
}

module.exports = { classificarLead };
