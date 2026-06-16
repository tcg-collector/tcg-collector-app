# TCG Bindex — Contexto para Claude Code

App para colecionadores brasileiros de Pokémon TCG físico. Binder digital com preços em BRL em tempo real, scan por IA e autenticação por conta.

**Tagline:** *"Seu binder digital — saiba exatamente o que você tem, o quanto vale e o que falta."*

---

## Comandos de desenvolvimento

```bash
# Backend
cd backend && npm run dev          # API na porta 3000 (nodemon + ts-node)
cd backend && npm run typecheck    # tsc --noEmit (não compila, só valida)
cd backend && npm run lint         # ESLint
cd backend && npm test             # todos os testes
cd backend && npm run test:unit    # só unitários
cd backend && npm run test:integration  # só integração (usa MongoDB in-memory)
cd backend && npm run test:coverage     # com relatório de cobertura

# Frontend
cd app && npm start                # Expo (QR code para Expo Go no iPhone)
cd app && npm run web              # Expo Web em localhost:8081
cd app && npm run typecheck        # tsc --noEmit
cd app && npm run lint             # ESLint

# Deploy
/ship "mensagem"                   # fluxo completo: commit → develop → CI → PR → main
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile/Web | React Native 0.81 + Expo SDK 54 + expo-router v6 |
| Web deploy | Vercel (static output) → **tcgbindex.app** |
| Backend | Node.js + Express + TypeScript → Railway |
| Banco | MongoDB Atlas M0 + Mongoose |
| Auth | Clerk (e-mail + Google OAuth) — instância **Production** (`pk_live_` / `sk_live_`) |
| IA scan | Claude Opus 4.5 via Anthropic API (vision) |
| Preços | PokéTCG API (pokemontcg.io) — ~12.000 cartas sincronizadas |
| Câmbio | open.er-api.com (cache 1h, fallback R$ 5,72) |
| Testes | Jest + ts-jest (backend) / jest-expo (frontend) + MongoDB in-memory |

---

## Estrutura do repositório

```
/
├── app/                        # Frontend React Native (Expo)
│   ├── app/                    # Rotas expo-router (file-based routing)
│   └── components/             # Componentes reutilizáveis
├── backend/
│   └── src/
│       ├── routes/             # binders, cards, collections, scan, sets, prices
│       ├── models/             # Mongoose: Card, Binder, Collection
│       ├── middleware/         # auth.ts, rateLimiter.ts, errorHandler.ts
│       ├── scripts/            # agent-tester.ts (E2E sintético)
│       └── __tests__/         # Testes de integração (MongoDB in-memory)
├── docs/                       # Documentação técnica completa
├── .claude/commands/           # ship.md, documentation-writer.md
└── .github/workflows/          # ci.yml, agent-tester.yml, health-check.yml
```

---

## URLs de produção

| Serviço | URL |
|---------|-----|
| App Web | https://tcgbindex.app |
| Backend | https://tcg-collector-app-production.up.railway.app |
| Health | https://tcg-collector-app-production.up.railway.app/health |

---

## API — 16 rotas

### Pública
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |

### Autenticadas (`Authorization: Bearer <clerk_jwt>`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cards` | Lista cartas (`name`, `setId`, `page`, `limit`) |
| GET | `/api/cards/:id` | Detalhe de carta |
| GET | `/api/sets` | Lista edições disponíveis |
| GET | `/api/collections` | Coleção do usuário |
| POST | `/api/collections` | Adiciona carta à coleção |
| DELETE | `/api/collections/:id` | Remove carta da coleção |
| GET | `/api/binders` | Lista binders do usuário |
| POST | `/api/binders` | Cria binder |
| GET | `/api/binders/:id` | Detalhe de binder com slots populados |
| DELETE | `/api/binders/:id` | Exclui binder |
| PATCH | `/api/binders/:id/slots/:position` | Coloca/move carta em slot |
| POST | `/api/binders/:id/pages` | Adiciona página ao binder |
| GET | `/api/prices/exchange` | Cotação USD→BRL atual |
| GET | `/api/prices/:cardId` | Preço de carta (TCGPlayer market) |
| POST | `/api/scan` | Scan IA por foto — **rate limit 10/min, timeout 45s** |

---

## Modelos de dados

**Card** — `_id` é o ID da PokéTCG API (ex: `"base1-4"`), **não** ObjectId gerado pelo Mongo.
Campos: `name`, `number`, `set{id,name,series,images}`, `images{small,large}`, `prices{normal?,holofoil?,reverseHolofoil?}` cada com `{low,mid,high,market}`, `lastPriceSyncAt`.

**Binder** — `userId` (Clerk ID), `name`, `coverImage`, `gridConfig` (`2x2|3x3|3x4|4x4`), `slots[]` com `position` (0-indexed), `cardId` (ref Card._id), `condition`.

**Collection** — `userId`, `cardId`, `condition`, `addedAt`.

**GridConfig válidos:** `2x2` | `3x3` | `3x4` | `4x4` — nunca inventar outros valores.

**Condições válidas:** `NM` | `LP` | `MP` | `HP` | `DMG`

**Multiplicadores de condição:** NM 100% · LP 80% · MP 60% · HP 40% · DMG 20%

---

## Regras críticas — evitam bugs e quebras de produção

### Auth
- Auth via `requireAuth` middleware (`backend/src/middleware/auth.ts`) — **nunca bypassar**
- Token Clerk expira em 60 min, renovado automaticamente pelo frontend a cada 50 min
- Clerk instância é **Production** (`pk_live_` / `sk_live_`) — nunca usar chaves Development em produção

### CORS
- Origins permitidas estão hardcoded em `backend/src/index.ts`: `tcgbindex.app`, `tcg-collector-app.vercel.app`, `localhost:8081`, `localhost:8083`
- Ao adicionar novo domínio (ex: domínio customizado), atualizar essa lista E fazer deploy no Railway

### Body/imagem
- Limite de payload: **15MB** (`express.json({ limit: '15mb' })`)
- Scan: imagem deve vir como base64 no body — nunca como multipart/form-data

### MongoDB
- `Card._id` é string (ID do PokéTCG), não ObjectId — nunca usar `new mongoose.Types.ObjectId()` para cartas
- Sempre popular slots com `.populate('cardId')` ao retornar binders com cartas

### Testes
- Testes de integração usam **MongoDB in-memory** (`mongodb-memory-server`) — nunca apontam para Atlas
- `npm run test:integration` requer `mongodb-memory-server` instalado no backend

### Scan IA
- Modelo: `claude-opus-4-5` — não trocar sem testar impacto na qualidade do OCR
- Rate limit: 10 req/min por userId (fallback: IP) — retorna 429 com `Retry-After`
- Timeout no Railway: 45s — o endpoint demora por chamar API externa

### Cron Railway
- Sync de preços: todo dia **06:00 UTC (03:00 BRT)** — não alterar horário sem verificar Railway timeout

---

## Fluxo de deploy — `/ship "mensagem"`

```
commit → push HEAD:develop → CI (typecheck+lint+tests backend+frontend) → PR develop→main → CI PR → merge squash
```

- CI roda em **paralelo**: backend job + frontend job simultaneamente
- `gh` CLI no Windows precisa de recarga de PATH — detalhes em `.claude/commands/ship.md`
- Railway e Vercel deployam automaticamente ao merge em `main`

---

## Adaptações web vs mobile

| Feature | Mobile | Web |
|---------|--------|-----|
| Token cache | `expo-secure-store` | `localStorage` |
| Câmera | `expo-camera` (CameraView) | `<input type="file">` + FileReader |
| Galeria | `expo-image-picker` | `<input type="file" accept="image/*">` |
| Alerts | `Alert.alert()` | `window.alert()` / `window.confirm()` |

Usar `Platform.OS === 'web'` para condicionais — nunca detectar por feature ou user agent.

---

## Pipeline de qualidade

| Camada | Ferramenta | Quando roda |
|--------|-----------|-------------|
| Typecheck | `tsc --noEmit` | CI + local antes de commitar |
| Lint | ESLint + @typescript-eslint | CI + local |
| Testes integração | Jest + MongoDB in-memory | CI |
| Health check | GitHub Actions cron 08h BRT | Diário |
| Code review IA | Claude Haiku | Cada PR |
| E2E sintético | `agent-tester.ts` (16 rotas) | Após CI passar em main |

---

## Variáveis de ambiente

### Backend (Railway — nunca commitar)
```
MONGODB_URI, CLERK_SECRET_KEY, ANTHROPIC_API_KEY, POKEMONTCG_API_KEY, PORT
CORS_EXTRA_ORIGINS  ← opcional, domínios adicionais separados por vírgula
```

### Frontend (app/.env local + Vercel env vars — nunca commitar)
```
EXPO_PUBLIC_API_URL=https://tcg-collector-app-production.up.railway.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

---

## Fase atual — Fase 2 (Produção & Web)

✅ Backend Railway · ✅ Vercel tcgbindex.app · ✅ Clerk Production · ✅ CI/CD  
⏳ App Store + Play Store (EAS Build — próximo passo da Fase 2)

**Fase 3 planejada:** alertas de preço, histórico de preços, comunidade, Sentry, Playwright E2E, planos pagos.

---

## ADRs (`docs/01 - Arquitetura/ADRs/`)

| ADR | Decisão |
|-----|---------|
| 001 | React Native + Expo (cross-platform sem nativo local) |
| 002 | MongoDB Atlas M0 (schema flexível + gratuito) |
| 003 | EAS Build sem nativo local (sem Mac necessário) |
| 004 | TypeScript strict em todo o projeto |
| 005 | expo-router para navegação file-based |
| 006 | Clerk Production Instance (não Development) |
| 007 | Sync de cartas via PokéTCG API com cron diário |
| 008 | CI + coverage + health check como estratégia de qualidade |
| 009 | Agent Tester sintético com JWT programático via Clerk Backend API |
