# Estratégia de Prospecção Otimiza FarmaVet 🐾

Este documento descreve as diretrizes e ferramentas para a prospecção de leads.

## 1. Prospecção de Condomínios (B2B)
**Objetivo**: Oferecer o serviço **VET EM CASA** (Vacinação em Domicílio e atendimento veterinário no condomínio).

### Canais de Contato:
1.  **WhatsApp (Aika)**: 
    *   Foco em administradoras de condomínio em BH.
    *   Mensagem: Oferece parceria para vacinação em domicílio com **preço social de R$ 20,00 por pet** (sem custo para a administradora).
    *   Script: `GIO-CENTRAL/executors/direct_sales/b2b_whatsapp.js`
2.  **E-mail (Cold Email)**:
    *   Utilizado quando o número de telefone é fixo ou não possui WhatsApp.
    *   Fila de envios alimentada automaticamente pelo script `upload_condominios_email.py`.

## 2. Prospecção de Petshops e Clínicas (RT)
**Objetivo**: Oferecer suporte de **Responsabilidade Técnica (RT)** e blindagem contra fiscalizações do CRMV.

### Canais de Contato:
1.  **WhatsApp (Kyenner)**:
    *   Foco em Petshops e Clínicas Veterinárias.
    *   Mensagem: Valida o suporte de RT atual e oferece blindagem técnica especializada.
    *   Script: `GIO-CENTRAL/executors/direct_sales/rt_petshops_prospect.js`

---

## 3. Fluxo de Trabalho
1.  **Scraping**: Coleta de dados no Google Maps (`scraper-condominios-bh`).
2.  **Enriquecimento**: Busca de e-mails nos sites dos leads (`enriquecedor_condominios.js`).
3.  **Disparo**: WhatsApp (imediato) ou E-mail (agendado).
