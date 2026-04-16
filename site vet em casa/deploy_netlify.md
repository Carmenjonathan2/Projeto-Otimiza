# Como Hospedar seu Projeto na Netlify

Aqui estão duas maneiras simples de colocar seu site no ar usando a Netlify. Como seu projeto é composto de arquivos estáticos (HTML, CSS, JS), o processo é muito rápido.

## Opção 1: Arrastar e Soltar (Mais Fácil)

Este método não requer instalação de nada no seu computador.

1.  **Crie uma conta:** Se ainda não tiver, cadastre-se em [app.netlify.com](https://app.netlify.com/).
2.  **Faça Login:** Entre na sua conta.
3.  **Vá para "Sites":** No menu lateral, clique em "Sites".
4.  **Prepare a Pasta:** Localize a pasta do seu projeto no seu computador:
    *   `c:\Users\jonat\Downloads\flowith_oracle_U2RDGkv (1)\U2RDGkv`
5.  **Arraste e Solte:** Na página "Sites" da Netlify, você verá uma área pontilhada dizendo "Drag and drop your site output folder here". Arraste a pasta `U2RDGkv` inteira para dentro dessa área.
6.  **Aguarde:** A Netlify fará o upload e, em poucos segundos, lhe dará uma URL (ex: `blissful-babbage-123456.netlify.app`).
7.  **Pronto!** Seu site está online. Você pode clicar em "Site settings" -> "Change site name" para alterar o endereço para algo mais amigável.

## Opção 2: Usando a Linha de Comando (Para Desenvolvedores)

Se você preferir fazer tudo pelo terminal:

1.  **Instale a CLI da Netlify:**
    Abra seu terminal e rode:
    ```bash
    npm install -g netlify-cli
    ```

2.  **Login:**
    Conecte o terminal à sua conta:
    ```bash
    netlify login
    ```
    (Isso abrirá o navegador para você autorizar).

3.  **Deploy:**
    Estando na pasta do projeto, rode:
    ```bash
    netlify deploy --prod
    ```

4.  **Configuração:**
    *   Ele perguntará: "Create & configure a new site?" -> Escolha "Yes".
    *   "Team" -> Escolha seu time pessoal.
    *   "Site name" -> Pode deixar em branco para um aleatório ou digitar um nome único.
    *   "Publish directory" -> Digite `.` (ponto) para indicar a pasta atual.

5.  **Sucesso:** O terminal mostrará a "Website URL" onde seu site está ao vivo.
