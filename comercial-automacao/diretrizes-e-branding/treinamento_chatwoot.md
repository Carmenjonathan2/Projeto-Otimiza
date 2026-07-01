# Treinamento Chatwoot & Controle do Bot Comercial (Otimiza FarmaVet)

Este documento treina a equipe de atendimento comercial (incluindo estagiárias e atendentes) sobre como utilizar a plataforma **Chatwoot** em conjunto com a Inteligência Artificial.

---

## 1. O que é o Chatwoot na Otimiza?
O Chatwoot é a nossa central omnichannel de atendimento. Todas as mensagens que chegam no WhatsApp da Otimiza são exibidas nesse painel para que a equipe possa monitorar, intervir ou fechar vendas.

---

## 2. Como Funciona a Divisão de Controle (Bot vs. Humano)

A conversa pode estar em dois estados no sistema:
1. **Controlada pelo Bot (IA):** A IA (Aika no B2C ou Kyenner no B2B) responde automaticamente ao cliente.
2. **Controlada pelo Humano (Pausada):** O bot fica em "silêncio" e não responde mais. Apenas você pode enviar mensagens.

---

## 3. Como Pausar o Bot (Intervenção Humana)

Você pode pausar a automação a qualquer momento (por exemplo, para retirar a taxa de cartão de crédito de um cliente ou dar um desconto especial):

*   **Pausa Automática (Recomendada):** Basta **digitar e enviar qualquer mensagem pública** para o cliente no chat. O bot detecta que um humano assumiu e se pausa automaticamente.
*   **Pausa Manual:** Mude o responsável pela conversa na barra lateral direita do Chatwoot, atribuindo a conversa para o seu próprio nome.

> [!NOTE]
> Quando o bot é pausado por uma mensagem manual, ele entra em modo de observação silenciosa e gera apenas **Notas Privadas (em amarelo)** sugerindo respostas no painel de atendimento (Modo Copiloto).

---

## 4. Como Devolver o Controle para o Bot (Reativar a IA)

Quando terminar de falar com o cliente e quiser que a IA volte a responder de forma automática:

*   **Opção A: Resolver a Conversa (Recomendado ao concluir):**
    *   Clique no botão **"Resolver"** (ou *Resolve*) no canto superior direito do Chatwoot.
    *   **O que acontece:** O bot volta a ficar ativo para o cliente e o histórico de contexto é limpo para que, no próximo contato, o cliente inicie uma nova jornada limpa com a IA.
*   **Opção B: Reatribuir ao Bot (Para continuar o fluxo atual):**
    *   Na barra lateral direita do Chatwoot, mude o responsável (Assignee) da conversa de volta para o agente **`bot@otimizafarmavet.com.br`**.
    *   **O que acontece:** O bot assume o controle imediatamente sem limpar o histórico da conversa atual. É ideal se você apenas entrou para mandar um dado específico e quer que a IA continue guiando o cliente na mesma venda.

---

## 5. Entendendo as Notas Privadas (Amarelas) no Painel
O bot envia mensagens internas em formato de **Notas Privadas** (fundo amarelo) que o cliente final **não vê**. Fique atenta a elas:

1.  🤖 **[Sugestão da IA - Copiloto]:** Sugestões de texto geradas pela IA caso você queira apenas copiar e colar enquanto o bot estiver pausado.
2.  🚨 **[SNC] Transbordo / Urgência:** Avisos vermelhos indicando que o cliente apresentou uma urgência clínica ou se irritou, exigindo que você responda imediatamente.
3.  ✅ **[RECEITA APROVADA]:** Confirmação de que a Inteligência Artificial leu a foto da receita enviada pelo cliente, validou o CRMV do médico e o pet, e aprovou a venda de Librela ou controlados.
4.  ⚠️ **[CRM / CRMV Inválido]:** Notas informando que o cliente tentou se passar por veterinário mas o CRMV não consta no banco de dados do CFMV ou do GestãoClick.
