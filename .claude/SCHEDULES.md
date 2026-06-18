# Scheduled Tasks — TCG Bindex

Manifesto de todas as tarefas agendadas no Claude Code.
As tasks vivem no MCP `mcp__scheduled-tasks` — este arquivo é documentação e guia de recuperação.

Para ver estado ao vivo: `list_scheduled_tasks`
Para atualizar uma task: `update_scheduled_task` com o `taskId` abaixo.

---

## agent-swot-semanal

| Campo | Valor |
|-------|-------|
| Task ID | `agent-swot-semanal` |
| Schedule | Toda segunda-feira às 09:03 BRT |
| Cron | `0 9 * * 1` |
| Invoca | `@agent-swot` → `.claude/agents/agent-swot.md` |
| Output | `docs/inteligência/SWOT-YYYY-WW.md` + Notion (Análise Competitiva) |
| Tipo | Agent (contexto isolado) |

---

## agent-produteiro-semanal

| Campo | Valor |
|-------|-------|
| Task ID | `agent-produteiro-semanal` |
| Schedule | Toda terça-feira às 09:01 BRT |
| Cron | `0 9 * * 2` |
| Invoca | `/agent-produteiro` → `.claude/commands/agent-produteiro.md` |
| Output | `docs/04 - Produto/hipoteses/PRODUTEIRO-YYYY-WW.md` + Notion |
| Tipo | Skill (contexto principal) |

---

## agent-planner-semanal

| Campo | Valor |
|-------|-------|
| Task ID | `agent-planner-semanal` |
| Schedule | Toda quarta-feira às 09:01 BRT |
| Cron | `0 9 * * 3` |
| Invoca | `/agent-planner` → `.claude/commands/agent-planner.md` |
| Output | `docs/sprints/SPRINT-YYYY-WW.md` + aguarda aprovação humana |
| Tipo | Skill (contexto principal) — tem checkpoint humano antes do Builder |

---

## Notas

- **Cron em horário local (BRT)** — o Claude Code interpreta cron em horário local, não UTC
- **Agent vs Skill**: SWOT roda como agent (contexto isolado); Produteiro e Planner como skills (progresso visível no chat)
- **Recuperação**: se uma task for perdida, recriar com `create_scheduled_task` usando os valores acima
