# SDD — Agent Tester

**PRD:** [[PRDs/agent-tester]]  
**Status:** Em produção  
**Data:** 2026-06-17

---

## Visão técnica

Skill Claude Code (`/agent-tester`) que orquestra auditoria de qualidade em 7 passos: verifica CI, extrai falhas, audita cobertura de rotas e frontend, salva findings e opcionalmente aplica correções no `agent-tester.ts`.

## Skill file

`.claude/commands/agent-tester.md`

## Fluxo de execução (7 passos)

| Passo | Ação | Ferramenta |
|-------|------|------------|
| 1 | Verificar último run `agent-tester.yml` | `gh run list --workflow=agent-tester.yml` |
| 2 | Extrair falhas → itens 🔴 Bug | `gh run view [id] --log-failed` |
| 3a | Ler `KNOWN_ROUTES` e chamadas `fetch(` no `agent-tester.ts` | Read |
| 3b | Ler rotas reais em `backend/src/routes/` | Read |
| 3c | Comparar e gerar itens 🟡 Cobertura | — |
| 4 | `git log --oneline -10 -- app/app/ app/components/` → itens 🟠 Frontend | Bash |
| 5 | Salvar `docs/05 - Qualidade/tester-findings/TESTER-YYYY-WW.md` | Write |
| 6 | Exibir painel e propor correções | — |
| 7 | Aplicar correções aprovadas no `agent-tester.ts` + `/ship` | Edit + Skill |

## Formato dos findings

```markdown
# TESTER-[YYYY-WW] — [data ISO]

## Status do último run
[✅ 21/21 ok / ❌ X rotas falharam / ⚠️ indisponível]

## Bugs encontrados (🔴)
## Gaps de cobertura (🟡)
## Mudanças de frontend sem validação (🟠)

## Resumo para o Planner
Total: N itens — 🔴 N · 🟡 N · 🟠 N
```

## Prioridades dos itens gerados

| Label | Prioridade | Comportamento no Planner |
|-------|-----------|--------------------------|
| 🔴 Bug | Alta | Entra automaticamente no sprint, acima do ICE |
| 🟡 Cobertura | Média | Entra se houver capacidade |
| 🟠 Frontend | Média-alta | Entra se houver capacidade |

## Integração com o Planner

`agent-planner.md` Passo 2 lê `docs/05 - Qualidade/tester-findings/TESTER-[semana atual ou anterior].md` antes de montar o sprint. Itens 🔴 têm prioridade máxima, independente do ICE.

## Arquivos afetados

- `.claude/commands/agent-tester.md` — skill file
- `backend/src/scripts/agent-tester.ts` — script E2E (editado no Passo 7)
- `.github/workflows/agent-tester.yml` — workflow que aciona o script
- `docs/05 - Qualidade/tester-findings/` — output semanal

## Regras críticas

- `KNOWN_ROUTES` com `covered: false` quebra o CI com `exit 1` — nunca deixar rota nova sem teste no mesmo PR
- Novas rotas autenticadas devem usar a variável `token` já disponível no `main()` do script
- Rotas de scan têm rate limit 10/min — usar imagem base64 mínima no teste
- `Card._id` é string (ex: `"base1-4"`), não ObjectId
