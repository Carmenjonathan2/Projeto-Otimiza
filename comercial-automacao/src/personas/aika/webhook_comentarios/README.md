# Aika IG Comment Bot — Deploy no Render.com

## O que este serviço faz
Servidor Express que recebe notificações de novos comentários no Instagram via Meta Webhooks
e responde automaticamente usando Gemini com a personalidade da Aika (Otimiza FarmaVet).

## Variáveis de ambiente obrigatórias (configurar no Render)
- `TOKEN` — Instagram Graph API access token (long-lived)
- `ID_Instagram` — ID numérico da conta Instagram (1604063458394244)
- `GEMINI_API_KEY` — Chave da API do Google Gemini
- `IG_WEBHOOK_VERIFY_TOKEN` — Token secreto que você define (qualquer string, ex: otimiza_webhook_2026)
- `IG_APP_SECRET` — App Secret do seu app no Meta Developer Dashboard
- `PORT` — Render define automaticamente

## Como iniciar localmente (para testes)
```
node src/personas/aika/webhook_comentarios/server.js
```
