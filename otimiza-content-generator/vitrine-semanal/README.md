# Vitrine Semanal — Status WhatsApp

Gerador de pacotes diários de Status (imagem + caption + link Shopify com UTM)
seguindo 7 ângulos editoriais rotativos.

## Setup (uma vez)

1. Na **raiz do repo**, copiar `.env.example` para `.env`
2. Preencher `SHOPIFY_STORE` e `SHOPIFY_ADMIN_TOKEN`
3. Testar conexão:
   ```bash
   node otimiza-content-generator/vitrine-semanal/test_conexao.js
   ```
   Saída esperada: lista de produtos, coleções, e top 10 mais vendidos.

## Como gerar a Custom App no Shopify

1. Admin Shopify → `Settings` → `Apps and sales channels` → `Develop apps`
2. `Create an app` → nome: `Vitrine Otimiza`
3. `Configure Admin API scopes` → marcar:
   - `read_products`
   - `read_inventory`
   - `read_orders`
   - `read_discounts`
   - `write_price_rules` (necessário pra gerar cupons únicos)
4. `Install app` → copiar o `Admin API access token`
5. Colar no `.env` como valor de `SHOPIFY_ADMIN_TOKEN`

## Estrutura

```
vitrine-semanal/
├── shopify_client.js        Wrapper da Admin API (produtos, pedidos, cupons)
├── test_conexao.js          Valida token e mostra catálogo
├── angulos.json             7 ângulos editoriais (segunda a domingo)
├── selecionador.js          Lógica: qual produto escolher pra cada ângulo
├── gerador_vitrine.js       Orquestrador: gera o pacote semanal
└── saida/
    └── semana_YYYY-Www/
        ├── dia_1_segunda.png + .txt
        ├── dia_2_terca.png + .txt
        └── ...
```

## Status

- [x] `shopify_client.js` — wrapper da API
- [x] `test_conexao.js` — validação do token
- [ ] `angulos.json` — aguardando confirmação dos 7 ângulos
- [ ] `selecionador.js` — aguardando regras de prioridade
- [ ] `gerador_vitrine.js` — orquestrador final
- [ ] Pipeline de arte (reuso do `image_creator.py` do Pinterest)
