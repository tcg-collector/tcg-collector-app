# Sessão: Agent Produteiro

**Slug:** agent-produteiro  
**Status:** executing  
**Iniciada:** 2026-06-17  
**Objetivo:** Criar skill /agent-produteiro que toda terça analisa o relatório SWOT, prioriza oportunidades com ICE score e entrega lista para o Agent Planner

## Documentos
- PRD: docs/04 - Produto/PRDs/agent-produteiro.md
- SDD: docs/02 - Backend/SDDs/agent-produteiro.md

## Checkpoints
- [x] PRD criado e aprovado
- [x] SDD criado e aprovado
- [x] Plan Mode executado e aprovado
- [x] Skill file implementado (.claude/commands/agent-produteiro.md)
- [x] docs/04 - Produto/hipoteses/ criado com .gitkeep
- [x] /schedule configurado para terça-feira — toda terça 09:00 BRT
- [x] /ship executado com sucesso — PR #27 merged 2026-06-17T20:50:28Z

## Contexto para próxima sessão
- Agent é skill Claude Code (.md em .claude/commands/), não endpoint nem tela
- Lê: docs/inteligência/SWOT-YYYY-WW.md + CLAUDE.md + Agents-Backlog.md + Notion RAG
- ICE = (Impact × Confidence) / Effort, escala 1–10, top 5–8 oportunidades
- Output local: docs/04 - Produto/hipoteses/PRODUTEIRO-YYYY-WW.md
- Notion: página Produteiro `3828b3b9-3cfd-81d9-8563-ee2235060cc8` (append)
- Painel de Execuções: data_source_id `71edffd6-f921-4c73-ac01-68d0b6a63420`
- Agendado toda terça-feira

## Histórico
- 2026-06-17 — PRD e SDD aprovados, sessão iniciada
