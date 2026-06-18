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
| Invoca | `@agent-produteiro` → `.claude/agents/agent-produteiro.md` |
| Output | `docs/04 - Produto/hipoteses/PRODUTEIRO-YYYY-WW.md` + Notion |
| Tipo | Agent (contexto isolado) |
| Depende de | `agent-swot-semanal` deve ter rodado na segunda — lê `docs/inteligência/SWOT-YYYY-WW.md` |

---

## agent-planner-semanal

| Campo | Valor |
|-------|-------|
| Task ID | `agent-planner-semanal` |
| Schedule | Toda quarta-feira às 09:01 BRT |
| Cron | `0 9 * * 3` |
| Invoca | `@agent-planner` → `.claude/agents/agent-planner.md` |
| Output | `.claude/sprints/sprint-YYYY-WW.md` (status: Aguardando aprovação) |
| Tipo | Agent (contexto isolado) — aprovação file-based por Matheus |
| Aprovação | Matheus edita `.claude/sprints/sprint-YYYY-WW.md`, muda Status para "Aprovada", chama `/agent-builder` |

---

## Notas

- **Cron em horário local (BRT)** — o Claude Code interpreta cron em horário local, não UTC
- **Agent vs Skill**:
  - SWOT, Produteiro, Tester, Planner e Builder → todos agents (contexto isolado)
  - Builder é o único com checkpoints: pré-classifica risco antes de executar (file-based)
- **Aprovação do Planner é file-based:** editar `.claude/sprints/sprint-YYYY-WW.md` e mudar Status para "Aprovada"
- **Recuperação**: se uma task for perdida, recriar com `create_scheduled_task` usando os valores acima
