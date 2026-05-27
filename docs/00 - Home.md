# 🃏 TCG Bindex — Base de Conhecimento

> *"Seu binder digital — saiba exatamente o que você tem, o quanto vale e o que falta."*

App para colecionadores brasileiros de cartas físicas Pokémon TCG.

---

## 🗺️ Navegação rápida

| Área | Nota |
|------|------|
| 🏗️ Arquitetura geral | [[01 - Arquitetura/Visão Geral do Sistema]] |
| ⚙️ Stack tecnológica | [[01 - Arquitetura/Stack Tecnológica]] |
| 📋 Decisões de design | [[01 - Arquitetura/ADRs/ADR-000 - Índice]] |
| 🔌 Backend & API | [[02 - Backend/API Reference]] |
| 📱 App mobile | [[03 - Frontend/Estrutura de Navegação]] |
| 🎯 Produto & roadmap | [[04 - Produto/Visão do Produto]] |
| 💼 Modelo de negócio | [[04 - Produto/Modelo de Negócio]] |
| 🎨 Identidade visual | [[brand/BRAND_GUIDE]] |
| 🛠️ Setup do ambiente | [[SETUP_DEV]] |

---

## 📊 Status do projeto

| Fase | Status | Descrição |
|------|--------|-----------|
| Fase 0 — Fundação | ✅ Concluída | Produto, dados, design, backend base |
| Fase 1 — MVP Core | ✅ Concluída | Binders, scan IA, preços BRL, auth, perfil |
| Fase 2 — Produção & Web | 🔄 Em andamento | Backend Railway ✅ · Vercel Web ✅ · Lojas ⏳ |
| Fase 3 — Crescimento | ⏳ Planejada | Alertas, histórico, comunidade |

---

## ✅ O que está funcionando (Fase 2 — parcialmente concluída)

### 🌐 Deploy Web (Vercel)
- URL de produção: **https://tcg-collector-app.vercel.app**
- Expo Web com Metro bundler, output estático
- Adaptações web: `localStorage` (tokenCache), file input (câmera), `window.alert` (alerts)
- SPA routing via `vercel.json` rewrites
- **Pendente:** Google OAuth web (requer fix no Clerk) · Domínio personalizado

### 🚂 Backend (Railway)
- URL: **https://tcg-collector-app-production.up.railway.app**
- Node.js + Express + TypeScript em produção
- MongoDB Atlas conectado
- Health check: `/health`

### 🔐 Autenticação (Clerk)
- Login com **e-mail/senha** ou **Google OAuth** (mobile ✅ / web ⚠️)
- JWT Bearer token enviado automaticamente em todas as requisições
- Token renovado a cada 50 min (duração: 60 min)
- Cache: `expo-secure-store` (mobile) / `localStorage` (web)
- Guard de rota: não autenticado → tela de login; autenticado → tabs

### 📦 Sistema de Binders
- Criar binder com nome, foto de capa e grid configurável (2×2 / 3×3 / 3×4 / 4×4)
- Grid de slots com imagem da carta, preço por condição e badge de condição
- Adicionar carta por **busca manual** (nome em inglês) com preço NM exibido na lista
- Adicionar carta por **scan com câmera** (Claude Vision lê nome, set code, número e condição)
- Seletor de condição (NM/LP/MP/HP/DMG) com **preço estimado por grade em tempo real**
- Long-press para remover carta do slot
- Long-press no card da coleção para excluir binder
- Valor total do binder atualizado em tempo real com multiplicadores de condição
- Binders isolados por usuário (cada conta vê apenas os próprios binders)

### 👤 Perfil com estatísticas reais
- Valor total da coleção (preço × multiplicador condição × taxa BRL)
- Total de cartas e binders
- Distribuição de condições (gráfico de barras horizontais por NM/LP/MP/HP/DMG)
- Top 5 cartas mais valiosas com imagem, set, condição e binder de origem
- Top 3 expansões mais presentes na coleção
- Estado vazio quando sem cartas

### 💰 Preços
- Cotação USD→BRL em tempo real (`open.er-api.com`, cache 1h)
- Preços da PokéTCG API (TCGPlayer market price)
- Multiplicadores de condição: NM 100% · LP 80% · MP 60% · HP 40% · DMG 20%
- Fallback de câmbio: R$ 5,72

### 🤖 Scan com IA
- Claude Opus 4.5 via vision identifica: nome, set, setCode, número, condição
- Estratégia dupla: busca por `name+number` (preciso) → fallback por nome
- Candidatos com imagem e preço NM em BRL
- Tap no candidato → seletor de condição com preço estimado

---

## 🐛 Problemas conhecidos / Pendências

| Item | Status | Notas |
|------|--------|-------|
| Google OAuth no web | ⚠️ Pendente | Clerk Development mode — verificar redirect URI |
| Domínio personalizado | ⏳ Futuro | Necessário para Clerk Production |
| App Store / Play Store | ⏳ Fase 2b | EAS Build ainda não configurado |
| Scan via câmera no web | ✅ Adaptado | Usa file input (`<input type="file">`) |

---

## 🔧 Stack técnica (resumo)

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native 0.81 + Expo SDK 54 + expo-router v6 |
| Web | Expo Web + Vercel (static output) |
| Linguagem | TypeScript strict |
| Backend | Node.js + Express + ts-node + nodemon |
| Banco | MongoDB Atlas M0 + Mongoose |
| Auth | Clerk (`@clerk/clerk-expo` + `@clerk/backend`) |
| IA (scan) | Claude Opus 4.5 via Anthropic API (vision) |
| Câmera | expo-camera ~16.0 + expo-image-picker ~16.0 |
| Preços | PokéTCG API (pokemontcg.io) |
| Câmbio | open.er-api.com (gratuito) |

---

## 🔗 Links externos

- **App Web (Vercel)**: [tcg-collector-app.vercel.app](https://tcg-collector-app.vercel.app)
- **Backend (Railway)**: [tcg-collector-app-production.up.railway.app](https://tcg-collector-app-production.up.railway.app)
- **MongoDB Atlas**: [cloud.mongodb.com](https://cloud.mongodb.com)
- **Clerk Dashboard**: [dashboard.clerk.com](https://dashboard.clerk.com)
- **Pokémon TCG API**: [pokemontcg.io](https://pokemontcg.io)
- **Notion (tasks)**: [Hub do Projeto](https://www.notion.so/36b8b3b93cfd81eba482eff557fb426f)
- **Anthropic Console**: [console.anthropic.com](https://console.anthropic.com)

---

## 🏷️ Tags usadas neste vault

`#arquitetura` `#backend` `#frontend` `#produto` `#decisão` `#pendência` `#bug`

---

*Última atualização: maio 2026 · Fase 2 em andamento · Responsável: Matheus*

---

## 📁 Docs legados

- [[PROJETO_TCG_PLANEJAMENTO]] — Planejamento inicial
- [[MODELO_DE_DADOS]] — Modelo de dados (versão inicial)
- [[ANALISE_COMPETITIVA]] — Benchmarking competitivo
- [[GUIA_USAR_CLAUDE_NO_PROJETO]] — Como usar Claude no projeto
- [[SETUP_DEV]] — Guia de setup do ambiente Windows
- [[brand/BRAND_GUIDE]] — Guia de identidade visual
