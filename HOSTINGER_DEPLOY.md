# Guia de Implantação na Hostinger via GitHub

Este guia explica como implantar a aplicação **Ninho — Clínica Psicopedagógica** na Hostinger a partir do seu repositório GitHub.

---

## Opção 1: Hostinger Painel Node.js (Recomendado)

Se você contratou hospedagem com suporte a **Node.js** (hPanel da Hostinger):

1. **Suba as alterações para o seu repositório no GitHub:**
   ```bash
   git add .
   git commit -m "Preparar projeto para deploy na Hostinger"
   git push origin main
   ```

2. **No painel da Hostinger (hPanel):**
   - Acesse **Avançado** > **Gerenciador de Aplicativos Node.js** (ou pesquise por *Node.js*).
   - Clique em **Criar Aplicativo**.

3. **Preencha as configurações do aplicativo:**
   - **Versão do Node.js:** Selecione `20.x` (ou `22.x` / `18.x`).
   - **Modo do aplicativo:** `Produção` (`production`).
   - **Diretório raiz da aplicação:** `/` (ou a pasta onde o repositório foi clonado).
   - **Arquivo de inicialização (Startup File):** `dist/server.cjs`
   - **URI do aplicativo:** Deixe a raiz `/` ou o subdomínio desejado.

4. **Conectar ao GitHub (Deploy Automático):**
   - No menu **Git** do hPanel, conecte sua conta do GitHub e selecione o repositório.
   - Ative o **Webhook de Deploy Automático** (sempre que fizer `git push`, a Hostinger atualiza).

5. **Executar a compilação:**
   - No terminal SSH da Hostinger ou na aba de comandos do hPanel, execute:
     ```bash
     npm install
     npm run build
     ```
   - Inicie o aplicativo clicando em **Iniciar** no hPanel (ou `npm start`).

---

## Opção 2: Hostinger VPS com PM2

Se você utiliza um servidor VPS na Hostinger:

1. **Clone o repositório no seu VPS:**
   ```bash
   cd /var/www
   git clone <URL_DO_SEU_REPOSITORIO_GITHUB> ninho-clinica
   cd ninho-clinica
   ```

2. **Instale as dependências e compile:**
   ```bash
   npm install
   npm run build
   ```

3. **Inicie com o PM2 usando o arquivo já configurado:**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

4. **Configurar Nginx como Proxy Reverso:**
   Encaminhe as requisições da porta 80/443 para `http://localhost:3000`.

---

## Opção 3: Hospedagem Compartilhada / Cloud (Apenas Frontend Estático)

Se você estiver utilizando hospedagem compartilhada tradicional da Hostinger (apenas Apache/LiteSpeed sem Node.js ativo):

1. O arquivo `.htaccess` já foi criado automaticamente na pasta `public/` (com regras de reescrita para Single Page Application).
2. Basta compilar o projeto:
   ```bash
   npm run build
   ```
3. O conteúdo gerado na pasta `dist/` (incluindo `index.html`, pasta `assets` e `.htaccess`) pode ser enviado diretamente para a pasta `public_html` da sua hospedagem na Hostinger via Git Deploy ou Gerenciador de Arquivos.
4. Toda a sincronização em nuvem e autenticação continuará funcionando em tempo real através do **Firebase Firestore** configurado em `firebase-applet-config.json`.

---

## Configuração do Banco de Dados MariaDB (Hostinger)

A aplicação está configurada para gravar os cadastros de clientes/pacientes diretamente no banco MariaDB existente da Hostinger:

* **Banco:** `u395389377_liraapp`
* **Usuário:** `u395389377_lirauser`
* **Host:** `127.0.0.1`
* **Porta:** `3306`
* **Tabela:** `clientes` (colunas: `id`, `nome`, `email`, `telefone`)

### Variáveis de Ambiente no Painel da Hostinger:
Adicione no painel Node.js / Gerenciador de Variáveis:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=u395389377_liraapp
DB_USER=u395389377_lirauser
DB_PASSWORD=SUA_SENHA_DO_USUARIO_DO_BANCO
NODE_ENV=production
```
*(Nota: Nunca salve a senha real no código ou no GitHub)*.

---

## Sincronização em Tempo Real na Nuvem

- O banco de dados **Firebase Firestore** já está configurado no arquivo `firebase-applet-config.json` (`ai-studio-eaclinoca-b40440f0-3b82-4346-894f-2b9c526d781d`).
- Todas as alterações feitas pelos celulares e computadores conectados na Hostinger sincronizam automaticamente na nuvem em tempo real.

