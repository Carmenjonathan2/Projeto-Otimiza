# 📊 Configuração Google Sheets para Cadastro de Veterinários

## 🎯 Sistema Completo

```
Formulário Shopify → Google Sheets (registro) → WhatsApp (notificação)
                                ↓
                         Você aprova manualmente
                                ↓
                    Adiciona tag no Admin Shopify
```

---

## 📝 PARTE 1: Criar Planilha no Google Sheets

### 1.1 Criar Nova Planilha

1. Acesse: https://sheets.google.com
2. Clique em **"+ Novo"** > **"Planilha do Google"**
3. Renomeie para: **"Cadastro Veterinários - Otimiza"**

### 1.2 Configurar Cabeçalhos

Na primeira linha (linha 1), adicione os seguintes cabeçalhos:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| Data/Hora | Nome | Email | Telefone | CRMV | Estado | Especialidade | Clínica | Cidade | UF | Status |

**Dica**: Formate a linha 1 como cabeçalho (negrito, fundo cinza)

---

## 💻 PARTE 2: Criar Google Apps Script

### 2.1 Abrir Editor de Script

1. Na planilha, clique em **Extensões** > **Apps Script**
2. Apague o código padrão
3. Cole o código abaixo:

```javascript
function doPost(e) {
  try {
    // Abre a planilha ativa
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse dos dados recebidos
    var data = JSON.parse(e.postData.contents);
    
    // Adiciona nova linha com os dados
    sheet.appendRow([
      data.data,           // Data/Hora
      data.nome,           // Nome
      data.email,          // Email
      data.telefone,       // Telefone
      data.crmv,           // CRMV
      data.estado,         // Estado
      data.especialidade,  // Especialidade
      data.clinica,        // Clínica
      data.cidade,         // Cidade
      data.uf,             // UF
      'Pendente'           // Status (sempre começa como Pendente)
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'message': 'Dados salvos com sucesso'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Google Apps Script funcionando!");
}
```

4. Clique em **"Salvar"** (ícone de disquete)
5. Nomeie o projeto: **"Cadastro Veterinários API"**

### 2.2 Implantar como Web App

1. Clique em **"Implantar"** > **"Nova implantação"**
2. Clique no ícone de **engrenagem** ⚙️ > Selecione **"Aplicativo da Web"**
3. Configure:
   ```
   Descrição: API Cadastro Veterinários
   Executar como: Eu (seu email)
   Quem tem acesso: Qualquer pessoa
   ```
4. Clique em **"Implantar"**
5. **IMPORTANTE**: Copie a **URL do aplicativo da Web** (será algo como):
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
6. **GUARDE ESSA URL!** Você vai precisar dela

### 2.3 Autorizar Permissões

1. Na primeira implantação, clique em **"Autorizar acesso"**
2. Escolha sua conta Google
3. Clique em **"Avançado"** > **"Ir para [nome do projeto] (não seguro)"**
4. Clique em **"Permitir"**

---

## 🔧 PARTE 3: Configurar o Formulário Shopify

### 3.1 Editar snippet-registro-veterinario.liquid

Abra o arquivo e localize esta linha (aprox. linha 223):

```javascript
const GOOGLE_SCRIPT_URL = 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI';
```

**SUBSTITUA** pela URL que você copiou no Passo 2.2:

```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1Ctn6p7ePZMp7U185WDCaHajaUBDN8cSdJ9gvJhRr61Ok8Bv9Qae0woXDpTvFNdwx/exec';
```

### 3.2 Verificar número do WhatsApp

Na mesma seção, certifique-se que o número está correto:

```javascript
const WHATSAPP_NUMBER = '5531987936822';
```

---

## 📤 PARTE 4: Fazer Upload para Shopify

### 4.1 Via Shopify CLI (Recomendado)

```bash
shopify theme push --theme 185138479392 --allow-live --only snippets/snippet-registro-veterinario.liquid
```

### 4.2 Ou via Interface Manual

1. **Admin** > **Temas** > **Editar código**
2. Localize `snippets/snippet-registro-veterinario.liquid`
3. Cole o código atualizado
4. **Salvar**

---

## 🧪 PARTE 5: Testar o Sistema

### 5.1 Teste Completo

1. Acesse: `https://[sua-loja].myshopify.com/pages/cadastro-veterinario`
2. Preencha o formulário com dados de teste
3. Clique em **"Enviar Solicitação"**
4. Verifique:
   - ✅ Mensagem de sucesso aparece
   - ✅ Redirecionamento para WhatsApp acontece
   - ✅ Dados aparecem no Google Sheets
   - ✅ Mensagem no WhatsApp está formatada

### 5.2 Verificar Google Sheets

Abra sua planilha e veja se os dados apareceram:

| Data/Hora | Nome | Email | ... | Status |
|-----------|------|-------|-----|--------|
| 29/12/2024 15:30 | Dr. Teste | teste@email.com | ... | Pendente |

---

## 👥 PARTE 6: Processo de Aprovação

### 6.1 Quando Receber Solicitação

1. **WhatsApp chega** com dados do veterinário
2. **Abra Google Sheets** e localize o registro
3. **Verifique CRMV** em:
   - MG: https://www.crmv-mg.gov.br/
   - SP: https://www.crmvsp.gov.br/
   - (ou site do CRMV do estado correspondente)

### 6.2 Se Aprovado

1. **No Google Sheets**:
   - Mude coluna **"Status"** para: `Aprovado`
   - Adicione data de aprovação

2. **No Shopify Admin**:
   - **Admin** > **Clientes**
   - Busque pelo email ou crie novo cliente
   - Adicione tag: `veterinario`
   - **Salvar**

3. **Via WhatsApp**:
   - Envie mensagem de boas-vindas:
   ```
   Olá Dr. [Nome]! 🎉
   
   Seu cadastro foi APROVADO!
   
   ✅ Você já pode acessar o Portal Profissional
   
   Entre em: [URL-DA-SUA-LOJA]
   Faça login e será redirecionado automaticamente.
   
   Bem-vindo à Otimiza FarmaVet!
   ```

### 6.3 Se Reprovado

1. **No Google Sheets**:
   - Mude **"Status"** para: `Reprovado`
   - Adicione motivo na coluna ao lado

2. **Via WhatsApp**:
   - Explique o motivo educadamente

---

## 📊 PARTE 7: Dashboard no Google Sheets

### 7.1 Adicionar Fórmulas Úteis

Crie uma nova aba chamada **"Dashboard"** com:

#### Total de Cadastros
```
=COUNTA(Cadastros!A:A)-1
```

#### Pendentes
```
=COUNTIF(Cadastros!K:K;"Pendente")
```

#### Aprovados
```
=COUNTIF(Cadastros!K:K;"Aprovado")
```

#### Reprovados
```
=COUNTIF(Cadastros!K:K;"Reprovado")
```

### 7.2 Criar Filtros

1. Selecione toda a tabela (linha 1 até última linha com dados)
2. Clique em **Dados** > **Criar filtro**
3. Agora você pode filtrar por:
   - Status (Pendente, Aprovado, Reprovado)
   - Estado
   - Especialidade
   - etc.

---

## 🔔 PARTE 8: Notificações Automáticas (OPCIONAL)

### 8.1 Email de Notificação

Adicione ao Apps Script (após a função doPost):

```javascript
function enviarNotificacaoEmail(data) {
  var destinatario = "seuemail@otimiza.com"; // MUDE AQUI
  var assunto = "🩺 Novo Cadastro Veterinário - " + data.nome;
  var corpo = 
    "Nova solicitação de cadastro recebida!\n\n" +
    "Nome: " + data.nome + "\n" +
    "Email: " + data.email + "\n" +
    "CRMV: " + data.crmv + "/" + data.estado + "\n" +
    "Telefone: " + data.telefone + "\n" +
    "Cidade: " + data.cidade + "/" + data.uf + "\n\n" +
    "Acesse a planilha para verificar: [LINK DA PLANILHA]";
  
  MailApp.sendEmail(destinatario, assunto, corpo);
}
```

E adicione dentro da função `doPost`, após `sheet.appendRow([...]);`:

```javascript
// Envia email de notificação
enviarNotificacaoEmail(data);
```

### 8.2 Notificação no Telegram (OPCIONAL)

Se preferir usar Telegram em vez de email, me avise que faço a integração!

---

## 🛠️ PARTE 9: Manutenção

### 9.1 Backup Regular

1. **Todo mês**, faça backup da planilha:
   - **Arquivo** > **Fazer cópia**
   - Salve com nome: `Cadastros Vet - Backup [MÊS/ANO]`

### 9.2 Limpeza de Dados

1. **A cada 6 meses**, arquive registros antigos:
   - Crie aba: `Arquivo [ANO]`
   - Mova registros antigos para lá
   - Mantenha apenas 6 meses recentes na aba principal

---

## 📋 PARTE 10: Checklist de Configuração

### Checklist Completo:

- [ ] Planilha Google Sheets criada
- [ ] Cabeçalhos configurados
- [ ] Apps Script criado
- [ ] Apps Script implantado como Web App
- [ ] URL do Apps Script copiada
- [ ] snippet-registro-veterinario.liquid atualizado com URL
- [ ] Formulário testado
- [ ] Dados chegando no Sheets
- [ ] WhatsApp redirecionando corretamente
- [ ] Processo de aprovação documentado
- [ ] Equipe treinada

---

## 🆘 PARTE 11: Troubleshooting

### Erro: "Dados não aparecem no Sheets"

**Solução**:
1. Verifique se a URL do Apps Script está correta
2. Confirme que implantou com "Qualquer pessoa" tem acesso
3. Verifique o console do navegador (F12) por erros
4. Teste a URL do Apps Script diretamente no navegador

### Erro: "WhatsApp não abre"

**Solução**:
1. Confirme que `WHATSAPP_NUMBER` está no formato: `5531987936822`
2. Teste o link manualmente
3. Verifique se não há bloqueador de pop-up

### Erro: "Permissão negada" no Apps Script

**Solução**:
1. Reimplante o Apps Script
2. Autorize novamente as permissões
3. Certifique-se que está usando "Eu" em "Executar como"

---

## 📱 PARTE 12: Modelo de Planilha

Sua planilha deve ficar assim:

| Data/Hora | Nome | Email | Telefone | CRMV | Estado | Especialidade | Clínica | Cidade | UF | Status |
|-----------|------|-------|----------|------|--------|---------------|---------|--------|----|----- ---|
| 29/12/2024 14:30 | Dr. João Silva | joao@email.com | (31) 98765-4321 | 12345 | MG | Clínica Médica | Clínica Vet ABC | Belo Horizonte | MG | Pendente |
| 29/12/2024 15:45 | Dra. Maria Santos | maria@email.com | (11) 99876-5432 | 67890 | SP | Cirurgia | Hospital XYZ | São Paulo | SP | Aprovado |

---

## ✅ Resumo do Fluxo

```
1. Veterinário preenche formulário
   ↓
2. Dados salvos no Google Sheets (Status: Pendente)
   ↓
3. WhatsApp abre com mensagem pré-pronta
   ↓
4. Você recebe solicitação
   ↓
5. Verifica CRMV e dados
   ↓
6. Se aprovado:
   - Muda status no Sheets para "Aprovado"
   - Adiciona tag "veterinario" no Shopify
   - Notifica veterinário via WhatsApp
   ↓
7. Veterinário faz login
   ↓
8. Redirecionado automaticamente para portal
```

---

**Última Atualização**: 29/12/2024  
**Versão**: 1.0  
**Status**: ✅ Pronto para Implementação

---

## 📞 Suporte

Dúvidas sobre a configuração:
- WhatsApp: +55 31 98793-6822
- Google Sheets Help: https://support.google.com/docs

---

**Pronto!** Com este sistema você terá:
✅ Formulário profissional
✅ Dados organizados no Google Sheets
✅ Notificação via WhatsApp
✅ Controle manual de aprovações
✅ Tudo gratuito!
