# Guia: Como Obter as Credenciais de API dos Bancos (Mercado Pago e C6 Bank)

Este guia orienta o time comercial/técnico da Otimiza FarmaVet a obter e configurar as chaves de API para faturamento automático de cartão e geração de Pix dinâmico.

---

## 1. Mercado Pago (Link de Pagamento / Cartão de Crédito)
O bot utiliza o Mercado Pago para gerar links de pagamento do Checkout Pro. Para obter as credenciais de produção:

1. **Acesse o Portal de Desenvolvedores:**
   * Vá para [Mercado Pago Developers](https://www.mercadopago.com.br/developers).
2. **Faça Login:**
   * Entre com a conta oficial do Mercado Pago da **Otimiza FarmaVet**.
3. **Crie uma Aplicação:**
   * Clique em "Suas Aplicações" > **Criar aplicação**.
   * Dê um nome como `Otimiza-Comercial-Bot`.
   * Em "Tipo de solução de pagamento", selecione **Pagamentos Online**.
   * Em "Qual produto você vai integrar?", selecione **Checkout Pro**.
4. **Obtenha as Credenciais:**
   * No menu lateral da sua aplicação, clique em **Credenciais de produção**.
   * Ative as credenciais (pode ser solicitado o preenchimento de dados de conformidade ou verificação de conta).
   * Localize o campo **Access Token** (ele começa com `APP_USR-...`).
5. **Configuração no Bot:**
   * Copie o token gerado e cole no arquivo `.env` do servidor:
     ```env
     MERCADOPAGO_ACCESS_TOKEN="APP_USR-SEU_TOKEN_AQUI"
     ```

---

## 2. C6 Bank (API Pix do Banco Central)
O C6 Bank utiliza o padrão de **API Pix do Banco Central (Bacen)**. Diferente do Mercado Pago, a autenticação requer um nível maior de segurança (via certificado mTLS).

1. **Solicite o Acesso ao Gerente/Portal Empresas:**
   * Acesse o Internet Banking do C6 Bank Empresas ou entre em contato com o gerente da conta da Otimiza.
   * Solicite a ativação da **API Pix para Desenvolvedores** para o seu CNPJ.
2. **Geração das Credenciais no C6:**
   * No painel da conta jurídica do C6 (C6 Empresas), vá na aba **API Pix / Desenvolvedores**.
   * Crie uma nova aplicação para obter o **Client ID** e o **Client Secret**.
3. **Geração do Certificado mTLS (Obrigatório):**
   * A API Pix exige segurança mTLS (Mutual TLS). O portal do C6 gerará um arquivo de certificado público (`.crt` ou `.pem`) e uma chave privada (`.key`).
   * Salve esses arquivos de forma segura.
4. **Configuração no Bot:**
   * Salve o **Client ID** no arquivo `.env`:
     ```env
     C6_CLIENT_ID="SEU_C6_CLIENT_ID_AQUI"
     ```
   * *Nota de desenvolvimento:* Para ativar o fluxo real (atualmente mocked no arquivo [integracao_pagamento.js](file:///C:/Users/jonat/OneDrive/Desktop/Otimiza/comercial-automacao/src/integracoes/integracao_pagamento.js#L11-L49)), você precisará carregar os arquivos de certificado gerados no C6 (`.key` e `.crt`) usando um HTTPS Agent no Node.js (via módulo `https` do Axios).
