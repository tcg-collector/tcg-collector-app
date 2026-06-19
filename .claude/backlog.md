# BACKLOG — TCG Bindex

> Fonte autoritativa de hipóteses e trabalho pendente do produto.
> Localização: `.claude/backlog.md` — ao lado de `schedules.md`
>
> **Regras de escrita (quem pode escrever o quê):**
> - `💡 Hipóteses` → Matheus em sessão, ou gaps novos do SWOT via Produteiro
> - `🟡 Backlog features` → Agent Produteiro (único que promove hipótese → backlog com ICE score)
> - `🟡 Backlog bugs` → Agent Tester (entra direto com ICE — bug confirmado não precisa passar pelo Produteiro)
> - `🔵 Sprint` → Agent Planner (marca quando inclui no sprint aprovado por Matheus)
> - `✅ Entregue` → Agent Builder ou /ship (marca após merge em main, com PR# e data)
> - `🗑️ Descartado` → Agent Produteiro ou Matheus (justificativa obrigatória)
>
> **Itens entregues permanecem no arquivo** — agents consultam para não re-sugerir features já construídas.

---

## 🔵 Em sprint

*Nenhum item em sprint ativo.*

---

## 🟡 Backlog — features (ICE atribuído)

| ID | Item | ICE | Effort | Semana | Notas |
|----|------|-----|--------|--------|-------|
| B-001 | Gráfico histórico de preço — tela de carta (só frontend) | 24.0 | 3 | W25 | Backend 100% pronto. PRD: `docs/specs/PRDs/historico-precos.md` |
| B-002 | Sentry — monitoramento de erros em produção | 22.5 | 2 | W25 | Esforço baixo, impacto operacional alto — instalação + config |

---

## 🟡 Backlog — bugs (Agent Tester adiciona aqui automaticamente)

*Nenhum bug no backlog.*

---

## 💡 Hipóteses (aguardando avaliação ICE do Produteiro)

| ID | Hipótese | Origem | Data |
|----|----------|--------|------|
| H-001 | Widget de portfolio em BRL (home screen) | SWOT W26 — MonPrice validou formato em USD (mai/2026) | 2026-06-18 |
| H-002 | Scanner com menor latência / modo offline | SWOT W26 — PokeScope 96%+ offline sem latência vs 45s timeout atual | 2026-06-18 |
| H-003 | EAS Build + App Store + Google Play | Roadmap Fase 3 | — |
| H-004 | Wishlist + alertas de preço | Roadmap Fase 3 | — |
| H-005 | UX/UI — auditoria e ciclo de melhorias contínuas | Roadmap Fase 2 | — |
| H-006 | Variantes e idiomas (foil, reverse, promo, JP/ZH) | Roadmap Fase 2 | Depende de POC |
| H-007 | Google OAuth — web | Roadmap Fase 3 | — |
| H-008 | Bindex Pro — monetização (freemium/pro) | Roadmap Fase 3 | — |
| H-009 | Comunidade / marketplace | Roadmap Fase 3 | — |

---

## ✅ Entregue

| Item | PR | Data |
|------|-----|------|
| Backend Railway — API 21 rotas | — | 2026-05 |
| Vercel — tcgbindex.app | — | 2026-05 |
| Clerk Production — auth email + Google OAuth | — | 2026-05 |
| CI/CD — GitHub Actions (ci.yml) | — | 2026-05 |
| Histórico de preços — backend + sync diário 03h BRT | — | 2026-05 |
| Coleção — inteligência de valor (top-value, gainers, binders) | #20 | 2026-06 |
| Scan IA — Claude Opus 4.5 via câmera | — | 2026-05 |
| Agent SWOT — inteligência competitiva semanal | #26 | 2026-W25 |
| Agent Produteiro — priorização ICE semanal | #27 | 2026-W25 |
| Agent Planner — proposta de sprint com checkpoint humano | #28 | 2026-W25 |
| Agent Builder — execução de sprint com regras de risco | #29 | 2026-W25 |
| Agent Tester — auditoria E2E + backlog proativo | #30 | 2026-W25 |
| Agent Tester migrado para .claude/agents/ (contexto isolado, escreve BACKLOG) | #37 | 2026-W25 |
| Agent SWOT — paralelização 3 subagentes (1/3 do tempo) | #33 | 2026-W25 |
| Hooks — cost tracking por sessão + beep de conclusão | — | 2026-W26 |
| Agent SWOT migrado para .claude/agents/ (contexto isolado) | #34 | 2026-W26 |
| Agent Produteiro migrado para .claude/agents/ (contexto isolado) | #35 | 2026-W26 |
| Reestruturação: backlog.md, schedules.md, docs/specs/, ship com BACKLOG check | #36 | 2026-W25 |
| Agent Tester migrado para .claude/agents/ (contexto isolado, escreve BACKLOG) | #37 | 2026-W25 |
| Agent Planner migrado para .claude/agents/ — aprovação file-based, .claude/sprints/ | #38 | 2026-W25 |
| Agent Builder migrado para .claude/agents/ — pré-classificação de risco, ship inline | #39 | 2026-W25 |

---

## 🗑️ Descartado

*Nenhum item descartado até o momento.*
