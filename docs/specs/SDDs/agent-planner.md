# SDD — Agent Planner

**PRD:** [[../PRDs/agent-planner]]  
**Status:** Draft  
**Data:** 2026-06-17

---

## Visão técnica

Skill do Claude Code (`/agent-planner`) que toda quarta-feira agrega output do Produteiro + falhas do Agent Tester, monta proposta de sprint, pausa para aprovação de Matheus e — somente após "aprovado" — salva o contrato da sprint e instrui o Builder.

---

## Tipo de entrega

**Claude Code skill** — arquivo `.md` em `.claude/commands/`. Não é endpoint de backend nem tela de frontend.

---

## Arquivos a criar

### `.claude/commands/agent-planner.md`
Skill file principal. Contém os 9 passos de execução, formato da proposta de sprint, lógica de checkpoint humano e instruções de output para o Builder.

### `.claude/sprints/`
Pasta para contratos de sprint aprovados.  
Convenção: `SPRINT-YYYY-WW.md` (ex: `SPRINT-2026-W26.md`)

### `.claude/sprints/.gitkeep`
Mantém o diretório no git.

---

## Fluxo de execução do agent

```
1. Preparação
   └─ Calcula semana atual (YYYY-WW)
   └─ Lê último relatório Produteiro em docs/04 - Produto/hipoteses/
   └─ Verifica sprint anterior em .claude/sprints/ (itens pendentes?)
   └─ Lê CLAUDE.md "Estado atual" para confirmar o que está em produção

2. Leitura das falhas do Tester
   └─ gh run list --workflow=agent-tester.yml --limit 1 --json ...
   └─ Se houver falhas: itens de correção entram automaticamente no sprint
   └─ Se tudo verde: registra "Tester: 21/21 rotas ok"

3. Montagem da proposta de sprint
   └─ Seleciona itens do top Produteiro que cabem na semana
   └─ Adiciona bugs do Tester (sempre prioritários)
   └─ Adiciona pendências da sprint anterior (se houver)
   └─ Ordena por: bugs primeiro → ICE decrescente
   └─ Estima esforço total (soma dos Effort scores)
   └─ Define o que fica de fora e por quê

4. Apresentação da proposta
   └─ Exibe proposta formatada com itens, esforço, ordem e exclusões
   └─ ⛔ PAUSA OBRIGATÓRIA — aguarda resposta de Matheus

5. Processamento da resposta
   └─ "aprovado" → avança para Passo 6
   └─ Ajuste de escopo → reformula e volta para Passo 4
   └─ Sem resposta → encerra sem salvar nada

6. Salvar sprint aprovada (só executa após aprovação)
   └─ Escreve .claude/sprints/sprint-YYYY-WW.md

7. Atualizar Notion (só executa após aprovação)
   └─ notion-update-page na página do Planner (insert_content, position: end)

8. Registrar no Painel de Execuções
   └─ notion-create-pages com status ✅ Concluído

9. Instrução ao Builder
   └─ Exibe mensagem final: "Sprint aprovada. Builder pode executar via /agent-builder"
   └─ Lista os itens na ordem exata de execução
```

---

## Estrutura da proposta de sprint (Passo 4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 PROPOSTA DE SPRINT — [YYYY-WW]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Fontes: PRODUTEIRO-[YYYY-WW] + Tester run #[N]

  ITENS DO SPRINT (ordem de execução):
  ┌─────────────────────────────────────────┐
  │ 1. [nome do item]                       │
  │    Esforço: ~[Xh] | ICE: [X.X]        │
  │    Motivo: [justificativa em 1 linha]   │
  └─────────────────────────────────────────┘

  FORA DO SPRINT:
  - [item]: [motivo da exclusão]

  ESTIMATIVA TOTAL: ~[X]h de desenvolvimento
  Pendente da semana anterior: [item ou "nenhum"]

  Responda "aprovado" para acionar o Builder,
  ou ajuste o escopo antes.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Estrutura do contrato de sprint salvo (Passo 6)

```markdown
# SPRINT-[YYYY-WW] — [data ISO]

**Status:** Aprovada por Matheus em [data]
**Fontes:** PRODUTEIRO-[YYYY-WW] + Tester #[N]
**Estimativa:** ~[X]h

## Itens — ordem de execução

### 1. [Nome do item]
- **Origem:** [ICE X.X do Produteiro / bug do Tester / pendência anterior]
- **Escopo:** [o que exatamente fazer — 2-3 linhas]
- **Critério de pronto:** [como saber que está feito]
- **Status:** ⏳ Pendente

### 2. [Nome do item]
...

## Fora do sprint
- [item] — [motivo]

## Notas para o Builder
[instruções específicas se algum item tiver risco ou dependência]
```

---

## Leitura do Agent Tester

```bash
# Buscar último run do Agent Tester
gh run list --workflow=agent-tester.yml --limit 1 --json databaseId,conclusion,url

# Se houver falha, buscar log
gh run view [id] --log-failed
```

O Tester cobre 21 rotas. Qualquer falha vira item prioritário no sprint, acima de qualquer ICE.

---

## Notion — IDs

| Recurso | ID |
|---------|-----|
| Agent Planner (página) | `3828b3b9-3cfd-8113-9d14-c4f77d4c1b47` |
| Painel de Execuções (DB) | `71edffd6-f921-4c73-ac01-68d0b6a63420` |

### Schema do Painel de Execuções
```
Execução: "PLANNER YYYY-WW"
Agent: "Planner"
Data: YYYY-MM-DD
Status: "✅ Concluído" | "⏳ Aguardando aprovação" | "❌ Erro"
Resumo: itens aprovados para o sprint em 1 linha
Relatório: .claude/sprints/sprint-YYYY-WW.md
Sprint: [número da semana como int, ex: 25]
```

---

## Regras do checkpoint (invioláveis)

1. **Nunca salvar `SPRINT-YYYY-WW.md` antes da aprovação**
2. **Nunca acionar o Builder antes da aprovação**
3. **Nunca assumir aprovação por silêncio** — só "aprovado" (ou equivalente explícito) conta
4. Se o usuário pedir ajuste → reformular e re-exibir a proposta, não implementar

---

## Agendamento

Configurar via `/schedule` após skill file pronto:
- Frequência: toda quarta-feira
- Horário: 09:00 (após Produteiro de terça)
- Prompt: `/agent-planner`

---

## Arquivos a tocar

```
+ .claude/commands/agent-planner.md      ← skill file (principal)
+ .claude/sprints/                          ← criar diretório
+ .claude/sprints/.gitkeep                  ← manter no git
~ docs/05 - Qualidade/Agents-Backlog.md  ← atualizar status após ship
```

---

## Riscos e trade-offs

- **Produteiro ausente:** se não houver relatório desta semana, usar o mais recente e sinalizar
- **Tester inacessível:** se `gh` falhar, Planner assume "sem falhas conhecidas" e registra o aviso
- **Aprovação parcial:** Matheus pode aprovar "itens 1 e 3, remove o 2" — o Planner precisa processar isso corretamente antes de salvar
- **Checkpoint em sessão assíncrona:** se o Planner rodar agendado e Matheus não estiver online, a proposta fica exibida na próxima vez que ele abrir o app — o Builder não é acionado

