# PRD — Agent Tester

**Status:** Em produção  
**Data:** 2026-06-17  
**Fase do produto:** Fase 2 — Qualidade

---

## Problema

Sem visibilidade proativa de qualidade: rotas novas podiam entrar em produção sem cobertura no Tester E2E, mudanças de frontend ficavam sem validação, e bugs detectados pelo CI não geravam itens estruturados no backlog para o Planner consumir. O loop entre qualidade e planejamento estava quebrado.

## Solução

Skill `/agent-tester` com dois modos:

- **Automático (pós-merge):** invocado pelo Planner após cada deploy — verifica o último run do GitHub Actions, extrai falhas e gera itens de backlog estruturados
- **Manual:** invocado com `/agent-tester` para auditoria completa de cobertura de rotas e telas

Gera findings semanais em `docs/05 - Qualidade/tester-findings/TESTER-YYYY-WW.md`, lido pelo Planner na montagem do sprint.

## Usuário-alvo

Matheus (dev solo) — precisa saber o que quebrou, o que ficou descoberto e o que mudou no frontend, sem ter que caçar manualmente no CI.

## Critérios de aceite

- [x] Verifica o último run do `agent-tester.yml` e reporta status (success/failure/indisponível)
- [x] Extrai rotas que falharam e gera item `🔴 Bug` por rota
- [x] Compara `KNOWN_ROUTES` com rotas reais em `backend/src/routes/` e gera itens `🟡 Cobertura`
- [x] Varre `git log` dos últimos 10 commits em `app/app/` e `app/components/` e gera itens `🟠 Frontend`
- [x] Salva findings em `docs/05 - Qualidade/tester-findings/TESTER-YYYY-WW.md`
- [x] Propõe e aplica correções de cobertura no `agent-tester.ts` se aprovado, via `/ship`
- [x] Planner lê o findings na montagem do sprint (Passo 2 do agent-planner.md)

## Fora do escopo

- Testes de UI automatizados (Detox, Playwright) — itens de frontend são alertas para validação manual
- Monitoramento em tempo real — é pontual, por invocação
- Cobertura de testes unitários Jest — foco é nas rotas E2E

## Impacto esperado

Loop fechado: bug em produção → findings → sprint → fix → merge → Tester valida. Sem itens de qualidade perdidos entre sessões.

## Dependências

- GitHub Actions `agent-tester.yml` rodando após cada merge em `main`
- `backend/src/scripts/agent-tester.ts` com `KNOWN_ROUTES` mantido atualizado
- `gh` CLI autenticado no ambiente de desenvolvimento
