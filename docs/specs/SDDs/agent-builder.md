# SDD — Agent Builder

**PRD:** [[../PRDs/agent-builder]]  
**Status:** Draft  
**Data:** 2026-06-17

---

## Visão técnica

Skill do Claude Code (`/agent-builder`) que lê `.claude/sprints/sprint-YYYY-WW.md`, executa cada item em sequência (implementa → typecheck + lint → /ship), pausa em risco alto e atualiza o contrato com o status de cada item.

---

## Tipo de entrega

**Claude Code skill** — arquivo `.md` em `.claude/commands/`. Escreve código real nos arquivos do repositório, mas é acionado como skill, não como endpoint ou tela.

---

## Arquivos a criar

### `.claude/commands/agent-builder.md`
Skill file principal. Contém a lógica de leitura do contrato, classificação de risco por item, fluxo de implementação, regras de erro e estrutura do resumo final.

---

## Fluxo de execução do agent

```
1. Preparação
   └─ Calcula semana atual (YYYY-WW)
   └─ Lê o sprint mais recente em .claude/sprints/
   └─ Confirma que o sprint tem status "Aprovada"
   └─ Lista os itens pendentes em ordem de execução

2. Para cada item do sprint (sequencial):

   2a. Leitura do escopo
       └─ Lê descrição, critério de pronto e notas do contrato
       └─ Lê os arquivos do repositório afetados pelo item

   2b. Classificação de risco
       └─ BAIXO: componentes frontend, UI, lógica de display
       └─ MÉDIO: novos endpoints read-only, campos aditivos, novas deps
       └─ ALTO: schema com impacto em dados, endpoints de escrita/deleção,
                auth.ts, CORS (index.ts), remoção/renomeação de campos de API

   2c. Checkpoint de risco alto (se aplicável)
       └─ Exibe descrição do risco específico
       └─ ⛔ PAUSA — aguarda "pode continuar" de Matheus
       └─ Sem resposta = não implementa, marca como ⏳ Aguardando

   2d. Implementação
       └─ Escreve/edita os arquivos necessários
       └─ Segue todas as regras críticas do CLAUDE.md

   2e. Validação local
       └─ Subagentes paralelos: backend typecheck+lint / frontend typecheck+lint
       └─ Se falhar: tenta corrigir (máx 2 tentativas)
       └─ Se não conseguir corrigir: marca item ❌ Erro, passa para o próximo

   2f. Deploy via /ship
       └─ Invoca o skill /ship com mensagem do item
       └─ Aguarda merge em main
       └─ Se CI falhar: tenta corrigir (máx 1 tentativa), senão ❌ Erro

   2g. Atualiza contrato
       └─ Marca item no SPRINT-YYYY-WW.md:
          ✅ Concluído — PR #[N] — [data]
          ❌ Erro — [motivo resumido]

3. Resumo final
   └─ Exibe tabela com status de cada item + número do PR
   └─ Registra no Painel de Execuções
   └─ Atualiza Notion (página do Builder)
```

---

## Classificação de risco — tabela completa

| Mudança | Risco | Ação |
|---------|-------|------|
| Novo componente `.tsx` | Baixo | Executa |
| Edição de UI em tela existente | Baixo | Executa |
| Novo hook ou utilitário frontend | Baixo | Executa |
| Novo endpoint GET (read-only, autenticado) | Médio | Executa com log |
| Novo campo no model Mongoose (aditivo) | Médio | Executa com log |
| Nova dependência npm (não auth/crypto) | Médio | Executa com log |
| Mudança de lógica em rota existente | Médio | Executa com log |
| Mudança de schema com impacto em dados existentes | **Alto** | ⛔ Pausa |
| Novo endpoint POST/PUT/DELETE público | **Alto** | ⛔ Pausa |
| Qualquer mudança em `backend/src/middleware/auth.ts` | **Alto** | ⛔ Pausa |
| Qualquer mudança em CORS em `backend/src/index.ts` | **Alto** | ⛔ Pausa |
| Remoção ou renomeação de campo em API existente | **Alto** | ⛔ Pausa |
| Mudança em `.github/workflows/` | **Alto** | ⛔ Pausa |

---

## Estrutura de atualização do contrato de sprint

Ao finalizar cada item, edita `.claude/sprints/sprint-YYYY-WW.md`:

```markdown
### 1. [Nome do item]
- **Status:** ✅ Concluído — PR #29 — 2026-06-18
```

ou

```markdown
### 1. [Nome do item]
- **Status:** ❌ Erro — typecheck falhou após 2 tentativas: [mensagem]
```

---

## Resumo final (exibido ao concluir o sprint)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ BUILDER — SPRINT [YYYY-WW] CONCLUÍDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [#] Item                   Status
  [1] [nome]              → ✅ PR #[N]
  [2] [nome]              → ✅ PR #[N]
  [3] [nome]              → ❌ Erro: [motivo]

  Notion: Builder atualizado
  Painel: execução registrada
  → Agent Tester valida automaticamente pós-merge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Notion — IDs

| Recurso | ID |
|---------|-----|
| Agent Builder (página) | `3828b3b9-3cfd-81bf-9750-cd882556eb25` |
| Painel de Execuções (DB) | `71edffd6-f921-4c73-ac01-68d0b6a63420` |

### Schema do Painel de Execuções
```
Execução: "BUILDER YYYY-WW"
Agent: "Builder"
Data: YYYY-MM-DD
Status: "✅ Concluído" | "⚠️ Parcial" | "❌ Erro"
Resumo: [X/Y itens concluídos, PRs #N, #N]
Relatório: .claude/sprints/sprint-YYYY-WW.md
Sprint: [número da semana como inteiro]
```

---

## Regras invioláveis

1. **Nunca push direto para `main`** — sempre via PR com CI verde
2. **Nunca `--no-verify`** — hooks são obrigatórios
3. **Nunca implementar risco alto sem confirmação** — mesmo que o Planner tenha aprovado o item
4. **Sequencial, não paralelo** — um item por vez para manter rastreabilidade e evitar conflitos
5. **Máximo 2 tentativas de correção por item** — se não resolver, marca erro e avança

---

## Arquivos a tocar

```
+ .claude/commands/agent-builder.md     ← skill file (principal)
~ docs/05 - Qualidade/Agents-Backlog.md ← atualizar status após ship
```

---

## Riscos e trade-offs

- **Spec incompleta no contrato:** se o item do Planner tiver escopo vago, o Builder pausa e pede esclarecimento antes de implementar — nunca assume
- **Item complexo inesperado:** se durante a implementação o Builder descobrir que o item é mais complexo do que o estimado, pausa e informa antes de continuar
- **Conflito de merge:** o mesmo padrão de rebase em `origin/main` que o /ship já resolve — Builder chama /ship que lida com isso
- **Candidato reserva:** o Builder só executa o candidato reserva se todos os itens principais forem concluídos com tempo sobrando — nunca por padrão

