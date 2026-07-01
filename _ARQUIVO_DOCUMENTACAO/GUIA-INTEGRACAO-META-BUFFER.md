# Guia de Integração Meta API + Buffer
## Publicação automática para @kyenner_ e @otimizafarmavet

---

## PRÉ-REQUISITOS

Antes de começar, confirme que você tem:
- [ ] Conta Instagram **Professional** (Business ou Creator) nos dois perfis
- [ ] Facebook Page vinculada a cada conta Instagram
- [ ] Acesso ao Meta App existente em developers.facebook.com
- [ ] Python 3.8+ instalado no computador

---

## PARTE 1 — CONFIGURAR O META APP

### 1.1 Acessar o app
1. Acesse https://developers.facebook.com/apps/
2. Clique no seu app existente

### 1.2 Verificar permissões
No menu lateral: **App Review > Permissions and Features**

Confirme que estas permissões estão adicionadas:
- `instagram_business_basic`
- `instagram_business_content_publish`
- `pages_show_list`
- `pages_read_engagement`

Se alguma estiver faltando: clique em **Add** ao lado dela.

> Para uso nas próprias contas (modo Development), não precisa de App Review.
> App Review só é necessário se outros usuários forem usar o app.

### 1.3 Adicionar seu usuário como Tester
1. Menu lateral: **Roles > Test Users** (ou **Roles > Roles**)
2. Adicione o seu Facebook pessoal e o da Carmen como **Administrators** ou **Testers**

---

## PARTE 2 — OBTER AS CREDENCIAIS

### 2.1 App ID e App Secret
1. Menu lateral: **Configurações > Básico**
2. Copie o **App ID** e o **App Secret**
3. Cole em `automacao/config.env`:
   ```
   META_APP_ID=seu_app_id_aqui
   META_APP_SECRET=seu_app_secret_aqui
   ```

### 2.2 Gerar token de acesso
1. Acesse: https://developers.facebook.com/tools/explorer/
2. No topo direito, selecione **seu App**
3. Clique em **Generate Access Token**
4. Selecione as permissões:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
5. Clique em **Generate Access Token** — faça login quando pedir
6. Copie o token gerado (é de curta duração — válido por 1-2 horas)

### 2.3 Trocar por token de longa duração (60 dias)
```bash
cd /caminho/do/Projeto-Otimiza
pip3 install python-dotenv requests
python3 automacao/obter_token_meta.py --trocar TOKEN_CURTO_AQUI
```

Cole o token longo gerado em `config.env`:
```
META_ACCESS_TOKEN=token_longo_aqui
```

### 2.4 Descobrir os Instagram User IDs
```bash
python3 automacao/obter_token_meta.py --descobrir-ids
```

O output mostrará algo como:
```
Page: Otimiza FarmaVet (ID: 123...)
  → Instagram: @otimizafarmavet (ID: 456789...)
  Cole: INSTAGRAM_USER_ID_OTIMIZA=456789...

Page: Kyenner (ID: 789...)
  → Instagram: @kyenner_ (ID: 101112...)
  Cole: INSTAGRAM_USER_ID_KYENNER=101112...
```

Cole os IDs no `config.env`.

---

## PARTE 3 — CONFIGURAR O BUFFER

### 3.1 Criar conta
1. Acesse https://buffer.com e crie uma conta gratuita
2. Conecte os dois perfis do Instagram:
   - @kyenner_ (conta Creator/Business)
   - @otimizafarmavet (conta Business)

### 3.2 Obter o Access Token
1. Acesse: https://buffer.com/developers/api
2. Clique em **Create an App** ou acesse seu app existente
3. Em **Access Token**, copie o token
4. Cole em `config.env`:
   ```
   BUFFER_ACCESS_TOKEN=seu_token_buffer
   ```

### 3.3 Descobrir os Profile IDs
```bash
python3 automacao/buffer_listar_perfis.py
```

Cole os IDs no `config.env`.

---

## PARTE 4 — TESTAR A INTEGRAÇÃO

### 4.1 Instalar dependências
```bash
pip3 install requests python-dotenv
```

### 4.2 Testar conexão com Meta
```bash
python3 automacao/meta_publicar.py --testar
```

Output esperado:
```
@kyenner_ (kyenner): 2000 seguidores, 509 posts ✓
@otimizafarmavet (otimizafarmavet): 3070 seguidores, 509 posts ✓
```

### 4.3 Testar conexão com Buffer
```bash
python3 automacao/buffer_agendar.py --listar-perfis
```

---

## PARTE 5 — USO NO DIA A DIA

### Publicar um Reel de Teste (recomendado para novos conteúdos)
```bash
python3 automacao/meta_publicar.py \
  --perfil kyenner \
  --video "https://URL_DO_VIDEO.mp4" \
  --caption "Legenda do post" \
  --trial
```

### Publicar um Reel normal
```bash
python3 automacao/meta_publicar.py \
  --perfil kyenner \
  --video "https://URL_DO_VIDEO.mp4" \
  --caption "Legenda do post"
```

### Agendar via Buffer
```bash
python3 automacao/buffer_agendar.py \
  --perfil kyenner \
  --caption "Legenda do post" \
  --video "https://URL_DO_VIDEO.mp4" \
  --horario "2026-07-03T18:00:00"
```

### Publicar nos dois perfis ao mesmo tempo (captions diferentes)
```bash
python3 automacao/buffer_agendar.py \
  --perfil ambos \
  --caption "Esse momento com a Maria Fernanda me fez pensar..." \
  --caption-otimiza "Na Otimiza, a gente entende que urgência não espera. Fale com a gente." \
  --video "https://URL_DO_VIDEO.mp4" \
  --horario "2026-07-03T19:00:00"
```

---

## HOSPEDAGEM DE VÍDEO

A Meta API exige uma **URL pública** para o vídeo. Opções gratuitas:

### Cloudinary (recomendado — plano gratuito generoso)
1. Crie conta em https://cloudinary.com (gratuito)
2. Faça upload do vídeo editado
3. Copie a URL pública gerada (termina em .mp4)
4. Use essa URL no comando de publicação

### Google Drive (alternativa)
1. Faça upload do vídeo no Drive
2. Compartilhe como "Qualquer pessoa com o link"
3. Pegue o ID do arquivo na URL: `drive.google.com/file/d/[ID_AQUI]/view`
4. URL direta: `https://drive.google.com/uc?export=download&id=[ID_AQUI]`

> Aviso: URLs do Google Drive podem ser instáveis para a Meta API. Cloudinary é mais confiável.

---

## RENOVAÇÃO DO TOKEN (a cada 60 dias)

O token da Meta expira em 60 dias. Quando isso acontecer:
1. Volte ao Graph API Explorer e gere um novo token curto
2. Rode: `python3 automacao/obter_token_meta.py --trocar TOKEN_NOVO`
3. Atualize o `META_ACCESS_TOKEN` no `config.env`

---

## SOLUÇÃO DE PROBLEMAS

**Erro: "invalid token"**
→ Token expirou. Gere um novo no Graph API Explorer.

**Erro: "user not authorized"**
→ A conta Instagram não está no app como Tester. Adicione em Roles > Testers.

**Erro: "video processing failed"**
→ Verifique se o vídeo é MP4 com codec H.264 e duração entre 3s e 15min.

**Erro: "requires instagram professional account"**
→ A conta ainda está como Pessoal. Converta em Creator/Business no Instagram.
