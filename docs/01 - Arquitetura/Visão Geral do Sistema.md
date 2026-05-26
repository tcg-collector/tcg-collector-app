# 🏗️ Visão Geral do Sistema

#arquitetura

## Diagrama de alto nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO FINAL                            │
│                   iPhone / Android / Web                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP / REST
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Expo / React Native)               │
│   ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐  │
│   │   Home   │  │  Coleção   │  │  Perfil  │  │ Card Detail│  │
│   └──────────┘  └────────────┘  └──────────┘  └────────────┘  │
│                     expo-router (file-based)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP REST
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express + TypeScript)           │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  /api/cards  │  /api/sets  │  /api/collections  │ /api/prices │
│   └──────────────────────────────────────────────────────────┘  │
│                  Mongoose ODM │ node-cron                       │
└─────────┬───────────────────┬────────────────────┬─────────────┘
          │                   │                    │
          ▼                   ▼                    ▼
┌─────────────────┐  ┌────────────────┐  ┌──────────────────────┐
│  MongoDB Atlas  │  │ pokemontcg.io  │  │ exchangerate-api.com  │
│  M0 (gratuito)  │  │  API externa   │  │   USD → BRL diário   │
│  sa-east-1 SP   │  └────────────────┘  └──────────────────────┘
└─────────────────┘
```

## Componentes principais

### Frontend — `app/`
- **Framework**: React Native + Expo SDK 52
- **Roteamento**: expo-router (file-based, igual Next.js)
- **Tema**: dark-first, paleta Bindex TCG
- **Testes**: Expo Go (iPhone) → EAS Build (produção)

### Backend — `backend/`
- **Runtime**: Node.js v24.16.0
- **Framework**: Express 4.19.2
- **Linguagem**: TypeScript 5.4.5 strict
- **ODM**: Mongoose 8.4.1
- **Dev server**: Nodemon + ts-node

### Banco de dados — MongoDB Atlas
- **Tier**: M0 (gratuito para sempre)
- **Região**: sa-east-1 (São Paulo)
- **Database**: `bindex-tcg`
- **Collections**: cards, sets, users, usercollections, wishlists, pricehistories, exchangerates

### APIs externas
| API | Uso | Frequência |
|-----|-----|------------|
| pokemontcg.io | Dados + imagens das cartas | Sync inicial + atualizações |
| exchangerate-api.com | Taxa USD→BRL | 1× por dia (cron) |
| Anthropic Claude Vision | Avaliação de condição (Fase 2) | Por imagem enviada |

## Fluxo de dados — Preço de uma carta

```
Usuário abre detalhe da carta
        │
        ▼
GET /api/prices/:cardId
        │
        ▼
Backend busca PriceHistory (MongoDB)
        │
        ├─ Tem preço recente (< 24h)? → Retorna cacheado
        │
        └─ Desatualizado? → busca pokemontcg.io → salva → retorna
                │
                ▼
        Aplica taxa USD→BRL (ExchangeRate collection)
                │
                ▼
        Retorna { usd: {...}, brl: {...} }
```

## Segurança
- `.env` com credenciais reais: **NUNCA commitado** (protegido por .gitignore)
- `.env.example` com placeholders: commitado como template
- MongoDB: usuário dedicado com senha forte, rede aberta só para dev (0.0.0.0/0 → restringir em produção)

---

*Veja também: [[Stack Tecnológica]] · [[ADRs/ADR-000 - Índice]]*
