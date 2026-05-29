# 🏗️ Visão Geral do Sistema

#arquitetura

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo SDK 54 + expo-router v6 |
| Web | Expo Web + Vercel (static output) — `tcgbindex.app` (Production) |
| Backend | Node.js + Express + TypeScript |
| Banco de dados | MongoDB Atlas (M0 free) |
| Auth | Clerk (e-mail + Google OAuth) |
| IA / Vision | Anthropic Claude claude-opus-4-5 |
| Dados TCG | PokéTCG API (pokemontcg.io) |
| Câmbio | open.er-api.com (free, sem chave) |
| Deploy backend | Railway — `tcg-collector-app-production.up.railway.app` |
| Deploy frontend web | Vercel — `tcgbindex.app` ✅ (Production) |

---

## Diagrama de fluxo

```
Browser (Vercel Web) ──┐
                       │
iPhone (Expo Go) ──────┼─── Auth: Clerk JWT ──────────────────────┐
                       │                                           │
                       └─── HTTPS requests ──► Railway (backend)  │
                                                   │               │
                                                   ├── MongoDB Atlas (cartas, binders, câmbio)
                                                   ├── PokéTCG API (busca de cartas)
                                                   ├── Anthropic API (scan IA)
                                                   ├── ExchangeRate API (USD→BRL)
                                                   └── Clerk SDK (verifica JWT) ◄──┘
```

---

## Variáveis de ambiente

### Backend (Railway)
```
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_...
ANTHROPIC_API_KEY=sk-ant-...
POKEMONTCG_API_KEY=...
PORT=(injetado pelo Railway)
```

### Frontend (app/.env — não commitado)
```
EXPO_PUBLIC_API_URL=https://tcg-collector-app-production.up.railway.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### Frontend (Vercel — Environment Variables)
```
EXPO_PUBLIC_API_URL=https://tcg-collector-app-production.up.railway.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

---

## Adaptações Web (Platform.OS === 'web')

| Feature | Mobile | Web |
|---------|--------|-----|
| Token cache | `expo-secure-store` | `localStorage` |
| Câmera/scan | `expo-camera` (CameraView) | `<input type="file">` + FileReader |
| Galeria | `expo-image-picker` | `<input type="file" accept="image/*">` |
| Alerts | `Alert.alert()` | `window.alert()` / `window.confirm()` |
| SPA routing | expo-router nativo | `vercel.json` rewrites → `index.html` |

---

## Endpoints principais

| Rota | Método | Auth | Descrição |
|------|--------|------|-----------|
| `/health` | GET | ❌ | Health check |
| `/api/cards` | GET | ❌ | Lista cartas — filtros: `name`, `setId`, `page`, `limit` |
| `/api/cards/:id` | GET | ❌ | Detalhe de carta |
| `/api/sets` | GET | ❌ | Lista edições disponíveis no banco |
| `/api/binders` | GET/POST | ✅ | Listar / criar binders |
| `/api/binders/:id` | GET/DELETE | ✅ | Detalhe / excluir binder |
| `/api/binders/:id/slots/:pos` | PATCH | ✅ | Adicionar/remover carta de slot |
| `/api/scan` | POST | ✅ | Scan IA (Claude Vision) |

---

*Veja também: [[../02 - Backend/API Reference]] · [[../04 - Produto/Visão do Produto]]*


---

## ⏰ Cron Jobs (Railway)

| Job | Horário | Ação |
|-----|---------|------|
| Sync de preços | Todo dia 06:00 UTC (03:00 BRT) | `syncPricesOnly()` — atualiza preços TCGPlayer de todas as ~12k cartas |

O sync completo inicial (`syncAllCards`) foi executado manualmente via Railway SSH e populou o banco com **12.032 cartas**. Novos cards lançados são pegos no sync diário.

---

## 🔬 Pipeline de Qualidade

| Camada | Ferramenta | Cobertura |
|--------|-----------|-----------|
| Typecheck | `tsc --noEmit` | 100% do código TypeScript |
| Lint | ESLint + @typescript-eslint | Backend e Frontend |
| Testes unitários | Jest + ts-jest (backend) / jest-expo (frontend) | Endpoints e funções críticas |
| Cobertura | jest --coverage → artefato GitHub Actions | Por run, 14 dias retidos |
| Health check | GitHub Actions cron 08h BRT | Backend Railway + Frontend Vercel |
| Code review IA | Claude Haiku via Anthropic API | Diff de cada PR |
| Monitoramento runtime | ⏳ Sentry (Fase 3) | Exceções em produção |
| Testes E2E | ⏳ Playwright (Fase 3) | Fluxos completos de usuário |

