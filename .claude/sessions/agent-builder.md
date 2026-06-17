# Sessão: Agent Builder

**Slug:** agent-builder  
**Status:** executing  
**Iniciada:** 2026-06-17  
**Objetivo:** Criar skill /agent-builder que executa o contrato de sprint aprovado pelo Planner, item por item, com classificação de risco e deploy via /ship

## Documentos
- PRD: docs/04 - Produto/PRDs/agent-builder.md
- SDD: docs/02 - Backend/SDDs/agent-builder.md

## Checkpoints
- [x] PRD criado e aprovado
- [x] SDD criado e aprovado
- [x] Plan Mode executado e aprovado
- [x] Skill file implementado (.claude/commands/agent-builder.md)
- [ ] /ship executado com sucesso

## Contexto para próxima sessão
- Agent é skill Claude Code (.md em .claude/commands/), não endpoint nem tela
- Lê docs/sprints/SPRINT-YYYY-WW.md como contrato — só executa sprints com status "Aprovada"
- Fluxo por item: lê escopo → classifica risco → (se alto: pausa) → implementa → typecheck+lint → /ship
- Risco alto: schema com impacto, endpoints POST/PUT/DELETE públicos, auth.ts, CORS, remoção de campos
- Máx 2 tentativas de correção por item — se falhar, marca ❌ Erro e avança
- Execução sempre sequencial (nunca paralela)
- Notion Builder: `3828b3b9-3cfd-81bf-9750-cd882556eb25`
- Painel de Execuções: `71edffd6-f921-4c73-ac01-68d0b6a63420`
- Sem agendamento fixo — acionado pelo Planner após aprovação

## Histórico
- 2026-06-17 — PRD e SDD aprovados, sessão iniciada
