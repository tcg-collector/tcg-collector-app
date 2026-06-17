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

## Regras críticas — evitam bugs e quebras de produção

### Auth
- Auth via `requireAuth` middleware (`backend/src/middleware/auth.ts`) — **nunca bypassar**
- Token Clerk expira em 60 min, renovado automaticamente pelo frontend a cada 50 min
- Clerk instância é **Production** (`pk_live_` / `sk_live_`) — nunca usar chaves Development em produção

### CORS
- Origins permitidas estão hardcoded em `backend/src/index.ts`: `tcgbindex.app`, `tcg-collector-app.vercel.app`, `localhost:8081`, `localhost:8083`
- Ao adicionar novo domínio, atualizar essa lista E fazer deploy no Railway

### Body/imagem
- Limite de payload: **15MB** (`express.json({ limit: '15mb' })`)
- Scan: imagem deve vir como base64 no body — nunca como multipart/form-data

### MongoDB
- `Card._id` é string (ID do PokéTCG), não ObjectId — nunca usar `new mongoose.Types.ObjectId()` para cartas
- Sempre popular slots com `.populate('cardId')` ao retornar binders com cartas

### Modelos — valores válidos
- **GridConfig:** `2x2` | `3x3` | `3x4` | `4x4` — nunca inventar outros valores
- **Condições:** `NM` | `LP` | `MP` | `HP` | `DMG`
- **Multiplicadores:** NM 100% · LP 80% · MP 60% · HP 40% · DMG 20%

### Testes
- Testes de integração usam **MongoDB in-memory** (`mongodb-memory-server`) — nunca apontam para Atlas

### Scan IA
- Modelo: `claude-opus-4-5` — não trocar sem testar impacto na qualidade do OCR
- Rate limit: 10 req/min por userId (fallback: IP) — retorna 429 com `Retry-After`
- Timeout no Railway: 45s — o endpoint demora por chamar API externa

### Cron Railway
- Sync de preços: todo dia **06:00 UTC (03:00 BRT)** — não alterar horário sem verificar Railway timeout

### Web vs Mobile
- Usar `Platform.OS === 'web'` para condicionais — nunca detectar por feature ou user agent
- Detalhes das adaptações: `docs/03 - Frontend/Estrutura de Navegação.md`

---

## Fluxo de deploy — `/ship "mensagem"`

```
commit → push HEAD:develop → CI (typecheck+lint+tests backend+frontend) → PR develop→main → CI PR → merge squash
```

- CI roda em **paralelo**: backend job + frontend job simultaneamente
- `gh` CLI no Windows precisa de recarga de PATH — detalhes em `.claude/commands/ship.md`
- Railway e Vercel deployam automaticamente ao merge em `main`
- **Após merge:** atualizar a seção "Estado atual" abaixo para refletir o que entrou em produção

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

## Estado atual

### ✅ Em produção
Backend Railway · Vercel tcgbindex.app · Clerk Production · CI/CD · Agent Tester (21 rotas) · Histórico de preços · Inteligência de valor na coleção · Scan IA

### ⏳ Fase 2 — backlog
- Gráfico de histórico de preço na tela de carta (backend pronto)
- Sentry — monitoramento de erros
- UX/UI — auditoria e ciclo de melhorias contínuas
- Variantes e idiomas de cartas (foil, reverse, promo, JP/ZH) — depende de POC
- Sistema de agents: SWOT · Produteiro · Planner · Builder

### 🔭 Fase 3 — planejado
Wishlist + alertas de preço · Bindex Pro (monetização) · EAS Build + lojas · Google OAuth web · Comunidade/marketplace

---

## Documentação completa

| Tópico | Onde ler |
|--------|----------|
| API — 21 rotas | `docs/05 - Qualidade/Mapa de Rotas e Fluxos.md` |
| Modelos de dados | `docs/02 - Backend/Modelos de Dados.md` |
| Adaptações web vs mobile | `docs/03 - Frontend/Estrutura de Navegação.md` |
| Pipeline de qualidade | `docs/05 - Qualidade/` |
| ADRs | `docs/01 - Arquitetura/ADRs/` |
| Agents — backlog e spec | `docs/05 - Qualidade/Agents-Backlog.md` |
| Sentry — plano | `docs/05 - Qualidade/Sentry-Plan.md` |
| Análise competitiva | Notion — "Análise Competitiva" (via MCP) |
