# Setup do Ambiente de Desenvolvimento — Bindex TCG

> Windows 10/11 · Testado sem Android Studio nem Xcode  
> Tempo estimado: ~20 minutos

---

## Passo 1 — Instalar Node.js

1. Acesse **https://nodejs.org**
2. Clique em **"LTS"** (botão verde da esquerda — versão estável)
3. Baixe e execute o instalador `.msi`
4. Aceite todas as opções padrão — marque **"Add to PATH"** se aparecer
5. Ao terminar, abra o **Terminal** (Win + R → `cmd` → Enter) e confirme:

```
node -v      → deve mostrar algo como v22.x.x
npm -v       → deve mostrar algo como v10.x.x
```

---

## Passo 2 — Verificar Git

No terminal:

```
git --version
```

Se aparecer `git version 2.x.x`, está ok. Se aparecer erro, baixe em **https://git-scm.com/download/win** e instale com as opções padrão.

---

## Passo 3 — Configurar VS Code

Abra o VS Code e instale estas extensões (Ctrl+Shift+X → pesquisar pelo nome):

| Extensão | Para que serve |
|----------|---------------|
| **ESLint** (Microsoft) | Aponta erros no código em tempo real |
| **Prettier - Code formatter** (Prettier) | Formata o código automaticamente ao salvar |
| **React Native Tools** (Microsoft) | Suporte a React Native / Expo |
| **MongoDB for VS Code** (MongoDB) | Visualizar o banco direto no editor |

**Configurar auto-save com Prettier:**
1. Ctrl+Shift+P → digite `Open User Settings (JSON)`
2. Adicione dentro das chaves `{}`:

```json
"editor.formatOnSave": true,
"editor.defaultFormatter": "esbenp.prettier-vscode",
"editor.tabSize": 2
```

---

## Passo 4 — Instalar Expo Go no celular

- **Android:** Play Store → buscar **"Expo Go"** → instalar
- **iPhone:** App Store → buscar **"Expo Go"** → instalar

Vai ser o "emulador" do app durante o desenvolvimento.

---

## Passo 5 — Instalar Expo CLI

No terminal:

```
npm install -g expo-cli
npx expo --version
```

Deve mostrar a versão do Expo CLI instalada.

---

## Passo 6 — Clonar o repositório

Escolha uma pasta no seu computador (ex: `C:\projetos`) e rode:

```
git clone https://github.com/SEU_USUARIO/bindex-tcg.git
cd bindex-tcg
```

> Substitua `SEU_USUARIO` pelo seu usuário do GitHub.

---

## Passo 7 — Instalar dependências

Dentro da pasta do projeto:

```
npm install
```

Aguarde baixar todos os pacotes (pode demorar 1-2 min na primeira vez).

---

## Passo 8 — Configurar variáveis de ambiente

Na raiz do projeto, crie um arquivo chamado `.env` (sem extensão):

```
# API
POKEMONTCG_API_KEY=sua_chave_aqui
EXCHANGERATE_API_KEY=sua_chave_aqui

# MongoDB
MONGODB_URI=sua_connection_string_aqui

# App
NODE_ENV=development
PORT=3000
```

> As chaves das APIs são gratuitas:
> - PokéTCG: https://dev.pokemontcg.io (criar conta → gerar API key)
> - ExchangeRate: https://exchangerate-api.com (plano grátis)
> - MongoDB: ver Passo 9

---

## Passo 9 — Criar banco no MongoDB Atlas (grátis)

1. Acesse **https://cloud.mongodb.com** e crie uma conta
2. Crie um **cluster M0** (grátis, sem cartão)
3. Em **Database Access**: crie um usuário com senha
4. Em **Network Access**: adicione `0.0.0.0/0` (acesso de qualquer IP, ok para dev)
5. Em **Connect → Drivers**: copie a connection string
   - Substitua `<password>` pela senha do usuário criado
   - Cole no `.env` no campo `MONGODB_URI`

---

## Passo 10 — Rodar o projeto

**Backend (Node.js):**
```
cd backend
npm install
npm run dev
```
Deve aparecer: `🚀 Server rodando na porta 3000`

**App (React Native / Expo) — em outro terminal:**
```
cd app
npm install
npx expo start
```
Vai abrir um QR code no terminal. Abra o **Expo Go** no celular, escaneie e o app abre!

> Celular e computador precisam estar na **mesma rede Wi-Fi**.

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| `node` não reconhecido após instalar | Fechar e reabrir o terminal |
| Expo Go não conecta | Verificar se está no mesmo Wi-Fi; tentar `npx expo start --tunnel` |
| Erro de CORS no backend | Normal em dev, será resolvido com a configuração do Express |
| `npm install` trava | Rodar `npm cache clean --force` e tentar novamente |

---

## Próximos passos após o setup

- [ ] Confirmar que o `npm run dev` do backend sobe sem erros
- [ ] Ver o app abrindo no Expo Go
- [ ] Testar uma chamada à PokéTCG API via Postman ou Thunder Client

