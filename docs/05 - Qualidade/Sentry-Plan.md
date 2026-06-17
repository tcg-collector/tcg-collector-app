# Sentry — Plano de Implementação

**Status:** backlog — não iniciado. Puxar quando estiver pronto para executar.

---

## Objetivo

Monitoramento de erros e performance em produção para:
- Backend (Railway — Node.js/Express)
- Frontend Web (Vercel — Expo Web)
- Frontend Mobile (React Native — Expo Go / builds nativos)

---

## Decisões de arquitetura

| Questão | Decisão |
|---------|---------|
| Projetos no Sentry | **2 projetos separados**: `tcgbindex-backend` e `tcgbindex-frontend` |
| Plano | Free tier (5k erros/mês, 10k performance transactions) — suficiente para fase atual |
| Alertas | Email para erros críticos (5xx, crashes) + digest diário |
| Escopo inicial | Erros não tratados + crashes — performance só na Fase 3 |

---

## Escopo de captura

### Backend
- Erros 5xx não tratados (Express error handler)
- Exceções não capturadas (`unhandledRejection`, `uncaughtException`)
- Falhas de conexão MongoDB
- Timeout da API Anthropic (scan > 45s)
- Erros de auth (Clerk token inválido → log, não alerta)

### Frontend
- Crashes e erros de JS não capturados
- Erros de rede (API down, timeout)
- Erros de auth (token expirado sem renovação)

### Fora do escopo (por ora)
- Performance (slow queries, Core Web Vitals)
- User sessions / replays
- Alertas de Slack (adicionar na Fase 3)

---

## Implementação — Backend

### Pacote
```bash
cd backend && npm install @sentry/node @sentry/profiling-node
```

### Onde inicializar
`backend/src/index.ts` — antes de qualquer outro import

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0,   // desabilita performance por ora
});
```

### Integração com Express
- `Sentry.setupExpressErrorHandler(app)` após todas as rotas, antes do `errorHandler` customizado
- Captura automática de erros passados via `next(err)`

### Variável de ambiente a adicionar no Railway
```
SENTRY_DSN=https://...@sentry.io/...
```

---

## Implementação — Frontend

### Pacote
```bash
cd app && npx expo install @sentry/react-native
```

### Onde inicializar
`app/app/_layout.tsx` — no topo, antes do `<ClerkProvider>`

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0,
});
```

### Variável de ambiente a adicionar
```
# app/.env e Vercel env vars
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Adaptação web vs mobile
Usar `Platform.OS` se algum comportamento diferir — o SDK do Sentry para Expo já lida com ambos automaticamente.

---

## Configuração de alertas no Sentry

### Alertas imediatos (email)
- Qualquer erro 5xx no backend
- Crash no frontend (erro JS não capturado)
- Novo tipo de erro nunca visto antes

### Digest diário
- Resumo de erros das últimas 24h
- Volume por tipo de erro
- Tendência (aumentou/diminuiu)

---

## Integração com o Agent Planner

Quando o Agent Planner for construído, ele deve:
1. Buscar os erros mais frequentes da semana via Sentry API
2. Incluir na priorização da sprint itens com alto volume de erros
3. Linkar o erro Sentry no PRD gerado (para contexto do Builder)

---

## Checklist de execução (quando puxar do backlog)

- [ ] Criar conta Sentry + 2 projetos (backend + frontend)
- [ ] Instalar SDK no backend
- [ ] Instalar SDK no frontend
- [ ] Configurar variáveis de ambiente (Railway + Vercel + `.env` local)
- [ ] Testar captura local com erro simulado
- [ ] Configurar alertas de email
- [ ] Fazer deploy e verificar eventos chegando no dashboard
- [ ] Atualizar Agent Tester para não disparar alertas em ambiente de teste
- [ ] Documentar DSNs no 1Password / gerenciador de segredos

---

*Relacionado: `docs/05 - Qualidade/Agents-Backlog.md` · `CLAUDE.md`*
