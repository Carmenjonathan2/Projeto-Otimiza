# 💬 Automação de WhatsApp Comercial (Chatwoot)

Esta pasta é dedicada ao projeto de integração do WhatsApp Comercial com a plataforma de atendimento multicanal **Chatwoot**.

## 🎯 Objetivos da Automação
* **Integração Real-Time:** Conectar o gateway do WhatsApp da Otimiza diretamente à caixa de entrada do Chatwoot.
* **Transbordo Inteligente (SNC):** Permitir que quando o robô de atendimento comercial (copiloto comercial) encontre uma pergunta de saúde complexa ou o cliente solicite atenção humana, a conversa seja transferida para um operador humano dentro do Chatwoot.
* **Histórico Centralizado:** Centralizar a leitura de conversas e logs de atendimento para monitoramento de satisfação e conversão de vendas.

## 🤖 Configurações e Limites da IA (Gemini Engine)
* **Modelo Principal (Chat):** `gemini-2.5-flash-lite` (reduz os custos em até 5x por token mantendo alta capacidade conversacional).
* **Modelos Auxiliares:** `gemini-2.5-flash-lite` para transcrição de áudio e `gemini-2.0-flash` com `maxOutputTokens: 250` para validação multimodal de receitas.
* **Limite Duro de Saída:** Configurado com `maxOutputTokens: 150` no chat principal para garantir respostas no tom "vendedor ocupado" (mediana <= 20 palavras).
* **Short-Circuit de Mensagens Triviais:** Mensagens curtas/triviais sem dúvida ativa ou receita pendente (ex: "ok", "valeu", "obrigado", "👍") ignoram a chamada à API do Gemini economizando custos. Despedidas triviais recebem saudações estáticas pré-programadas de acordo com a persona.

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

## ⚡ Otimizações e Hardening (Ciclo 4)

### 1. Context Caching (Gemini Context Caching)
O context caching armazena em cache o prompt estático (Regras Críticas + instruções da Persona ativa) por 1 hora na API do Gemini, reduzindo o custo de input em até 75%.
* **Ativação:** Defina `GEMINI_CACHE_ENABLED="true"` no arquivo `.env`.
* **Desativação (Debug/Desenvolvimento):** Defina `GEMINI_CACHE_ENABLED="false"`. O sistema cairá automaticamente no fallback tradicional recarregando todo o prompt estático a cada requisição.

### 2. Monitor de Custos (`custo_diario.json`)
Todas as chamadas faturáveis ao Gemini registram metadados de tokens e custos diários em `0-Central-SNC/custo_diario.json`.
* **Estrutura de campos:**
  * `chamadas`: Total de requisições enviadas ao modelo no dia corrente.
  * `input_tokens`: Soma de tokens enviados na entrada (não-cacheados).
  * `output_tokens`: Soma de tokens gerados na resposta pela IA.
  * `cached_tokens`: Soma de tokens recuperados a partir do Gemini Context Cache (custo ~4x menor).
  * `custo_usd_estimado`: Custo acumulado diário em USD (calculado com base em tabela fixa interna).
  * `modelo_predominante`: Nome do último modelo Gemini utilizado (`gemini-2.5-flash-lite`).
* **Configuração de Alertas e Kill-Switch:**
  * `CUSTO_ALERTA_TELEGRAM_USD`: Limite acumulado diário (USD) para emitir notificação de aviso no Telegram (default: `2.00`).
  * `CUSTO_KILL_SWITCH_USD`: Limite máximo diário (USD). Caso ultrapassado, o bot força a ativação do `MODO_SILENCIOSO="true"` na memória do servidor para cessar novas chamadas faturáveis de chat e envia um alerta crítico de emergência (default: `10.00`).

### 3. Rate-Limiting por Telefone
Previne abusos de flooding ou loops de bots na API.
* **RATE_LIMIT_JANELA_SEGUNDOS**: Tamanho da janela de monitoramento por telefone (default: `60` segundos).
* **RATE_LIMIT_MAX_MSG**: Quantidade máxima de mensagens permitida por cliente na janela (default: `8` mensagens). Caso excedido, as mensagens adicionais retornam imediatamente status `200` (no-reply) sem invocar o Gemini. O Chatwoot recebe uma nota privada de alerta na primeira mensagem excedente.

## ⚙️ Manutenção e Inteligência Conversacional (Ciclo 5)

### 1. Painel de Saúde e Integridade de Custos (`/saude`)
A Carmen e o RT FarmaVet podem monitorar a integridade financeira e a qualidade do atendimento do robô em tempo real.
* **Acesso:** `http://localhost:4000/saude` (Painel de Autoridade)
* **Funcionalidades:**
  * Cards de custos em tempo real (USD acumulado hoje e no mês) e status do Kill-Switch (com alertas visuais verde/amarelo/vermelho).
  * Gráfico SVG sparkline do volume de chamadas nos últimos 7 dias.
  * Estatísticas das últimas 24h: Taxa de Transbordo Humano, Short-Circuit de Triviais e Taxa de Erros.
  * Top 5 Clientes Únicos mais ativos nas últimas 24h.
  * Renderização inline e automática do último Relatório de Análise Semanal com IA.

### 2. Análise Semanal de Logs com IA
O bot possui uma rotina de auto-auditoria baseada em IA para avaliar a conformidade com as regras críticas e tom de voz.
* **Comando:**
  ```bash
  npm run analise-semanal
  ```
* **Funcionamento:** Lê as conversas de `conversas_log.jsonl` dos últimos 7 dias, agrupa-as em sessões cronológicas, filtra sessões irrelevantes, e invoca o Gemini (`gemini-2.5-flash-lite`) com tolerância a falhas (retry com backoff exponencial) para gerar um relatório em Markdown sob `0-Central-SNC/relatorios/analise_semanal_YYYY-MM-DD.md` com sugestões de melhoria.

### 3. Saneamento e Limpeza de Estados Inativos
Rotina periódica para evitar o crescimento desnecessário do banco local.
* **Comando:**
  ```bash
  npm run limpar-estado
  ```
* **Funcionamento:** Pruna o banco local `conversas_state.json` deletando conversas com inatividade superior ao limite (ex: `ESTADO_TTL_DIAS="60"` no `.env`), mantendo cópias automáticas de segurança na pasta raiz.

