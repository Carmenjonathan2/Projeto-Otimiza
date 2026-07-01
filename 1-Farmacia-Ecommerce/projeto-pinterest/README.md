# Automação Pinterest - Projeto Vet em Casa

Este projeto é um módulo de automação de marketing focado em gerar conteúdo para o Pinterest, divulgando os serviços do projeto **Vet em Casa**.

## ⚠️ Contexto Importante
- O domínio principal **otimizafarmavet.com.br** atualmente hospeda a loja (Shopify).
- O projeto **Vet em Casa** (que está sendo desenvolvido na pasta `../vet_em_casa`) é um site separado/complementar (focado em serviços e agendamentos).
- **Para que o Pinterest funcione**, o conteúdo gerado por este script no projeto `Vet em Casa` precisa estar acessível publicamente na internet.

## Como funciona a integração (Fluxo RSS)

Devido a limitações da API do Pinterest, usamos uma estratégia de **RSS Feed**.

### ⚠️ Importante: Formato do Feed

O Pinterest **NÃO aceita feeds Atom** (formato padrão do Shopify). É necessário usar **RSS 2.0**.

- ❌ **Não funciona**: `https://otimizafarmavet.com.br/blogs/blog-para-tutores.atom`
- ✅ **Solução**: Criar um feed RSS 2.0 customizado no Shopify

**📖 Veja o guia completo**: [`SHOPIFY_RSS_SETUP.md`](./SHOPIFY_RSS_SETUP.md)

### Fluxo de Integração

#### Opção 1: Blog Shopify (Recomendado para Marketing)

1. **Configure o RSS 2.0 no Shopify** seguindo o guia `SHOPIFY_RSS_SETUP.md`
2. **URL do feed**: `https://otimizafarmavet.com.br/pages/blog-rss-feed`
3. **Configure no Pinterest Business**:
   - Settings → Bulk create Pins → Auto-publish
   - Cole a URL do feed RSS
   - Selecione o board de destino

#### Opção 2: Projeto Vet em Casa (Geração Automatizada)

1.  **Geração Local (Seu PC)**: 
    - O script `main.py` roda e cria uma nova "Dica" (imagem + texto).
    - Ele salva essa dica como uma página HTML e uma imagem dentro da pasta do projeto `vet_em_casa`.
    - Ele atualiza o arquivo `feed.xml` dentro da pasta `vet_em_casa`.

2.  **Publicação (Necessário)**:
    - Como o `vet_em_casa` está no seu computador, o Pinterest não consegue ver o `feed.xml` ainda.
    - Você precisa colocar o projeto `vet_em_casa` online (Hospedagem).
    - *Sugestão*: Usar um subdomínio (ex: `servicos.otimizafarmavet.com.br`) ou hospedagem gratuita (Vercel/Netlify) para o projeto Vet em Casa.

3.  **Consumo (Pinterest)**:
    - O Pinterest acessa o endereço online do seu feed (ex: `https://servicos.otimizafarmavet.com.br/feed.xml`).
    - Ele identifica os posts novos e cria os Pins automaticamente.

## Configuração do Projeto

### 1. Pré-requisitos
- Python instalado.
- Projeto `vet_em_casa` localizado na pasta ao lado (`../vet_em_casa`).

### 2. Instalação
```bash
pip install -r requirements.txt
```

### 3. Ajuste de URL (Importante!)
Antes de subir o site, edite o arquivo `config.py`:
- Mude `WEBSITE_URL` para o endereço real onde o projeto Vet em Casa será hospedado (ex: `https://vet-em-casa-demo.vercel.app` ou `https://servicos.otimizafarmavet.com.br`).
- Atualmente está como: `https://otimizafarmavet.com.br` (o que pode conflitar com a Shopify se os arquivos não estiverem lá).

## Comandos

**Gerar um Post de Teste:**
```bash
python main.py --single
```
*Isso vai criar os arquivos na pasta `vet_em_casa`. Verifique se a imagem e o HTML foram criados corretamente lá.*

**Rodar Agendador:**
```bash
python main.py
```
*Gera posts automaticamente 3x ao dia (09h, 14h, 19h).*

## Resumo da Operação
1. Rode o script.
2. Faça o deploy (upload) do projeto `vet_em_casa` atualizado para sua hospedagem.
3. O Pinterest fará o resto.
