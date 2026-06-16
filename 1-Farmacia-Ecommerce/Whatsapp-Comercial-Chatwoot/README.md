# 💬 Automação de WhatsApp Comercial (Chatwoot)

Esta pasta é dedicada ao projeto de integração do WhatsApp Comercial com a plataforma de atendimento multicanal **Chatwoot**.

## 🎯 Objetivos da Automação
* **Integração Real-Time:** Conectar o gateway do WhatsApp da Otimiza diretamente à caixa de entrada do Chatwoot.
* **Transbordo Inteligente (SNC):** Permitir que quando o robô de atendimento comercial (copiloto comercial) encontre uma pergunta de saúde complexa ou o cliente solicite atenção humana, a conversa seja transferida para um operador humano dentro do Chatwoot.
* **Histórico Centralizado:** Centralizar a leitura de conversas e logs de atendimento para monitoramento de satisfação e conversão de vendas.

## 📂 Próximos Passos
* Adicionar scripts de Webhook do Chatwoot.
* Configurações de API e tokens de conexão.

## 📊 Monitoramento e Observabilidade (Modo Silencioso)

Para analisar as sugestões geradas pela IA e o status de transbordo durante o período em que a IA está operando em `MODO_SILENCIOSO=true`, você pode executar o painel CLI consolidado:

```bash
npm run revisar-logs
```

### Métricas Exibidas:
* **Total de Interações (Mensagens):** Quantidade total de mensagens processadas nas últimas 24 horas.
* **Total de Clientes Únicos:** Quantidade de números de telefone únicos que iniciaram conversas.
* **Distribuição por Persona:** Quantidade de clientes B2C (Aika) vs B2B (Kyenner).
* **Taxa de Transbordo Humano:** Percentual de conversas onde a última mensagem transferiu o cliente para o atendimento humano (`owner === 'human'`).
* **5 Conversas mais Longas:** Ranking de conversas mais extensas (maior engajamento) para fins de auditoria fina.
* **Erros de API:** Detalhes dos logs que apresentaram falhas de conexão/timeout com a API do Gemini.
