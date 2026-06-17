# Sistema de Agents — Backlog (Fase 2)

Status: **em produção** — todos os agents implementados e shiped (2026-W25).

## Notion — links de referência

| Recurso | Link |
|---------|------|
| Hub do Sistema de Agents | https://app.notion.com/p/3828b3b93cfd81ea9e19df13c6f94b90 |
| 📊 Painel de Execuções | https://app.notion.com/p/618d9eeb9e0d4bac8bcc897078a4f613 |
| 🔍 Agent SWOT | https://app.notion.com/p/3828b3b93cfd8139b0c2ddb09869568b |
| 💡 Agent Produteiro | https://app.notion.com/p/3828b3b93cfd81d98563ee2235060cc8 |
| 📋 Agent Planner | https://app.notion.com/p/3828b3b93cfd81139d14c4f77d4c1b47 |
| 🔨 Agent Builder | https://app.notion.com/p/3828b3b93cfd81bf9750cd882556eb25 |
| ✅ Agent Tester | https://app.notion.com/p/3828b3b93cfd81d88970ed96747c33a9 |
| RAG — Análise Competitiva | https://app.notion.com/p/36b8b3b93cfd81edb18de0a9ce1acef1 |

---

## Visão geral do pipeline

```
SEG  → Agent SWOT      → atualiza RAG no Notion
TER  → Agent Produteiro → gera hipóteses de features
QUA  → Agent Planner    → monta sprint, aguarda aprovação de Matheus
QUA/QUI (após aprovação) → Agent Builder → executa sprint
        ↓
     Agent Tester ✅ (já em prod) → fecha o loop
```

---

## Agent Tester ✅ (em produção — skill expandido)

**Status:** rodando. Cobre 21 rotas após cada merge em `main`.
**Skill:** `/agent-tester` — verifica falhas, audita cobertura de rotas e telas, gera itens de backlog para o Planner.
**Findings:** `docs/05 - Qualidade/tester-findings/TESTER-YYYY-WW.md` — lido pelo Planner na montagem do sprint.

---

## Agent SWOT ✅ (em produção — PR #26)

**Frequência:** toda segunda-feira
**Output:** relatório semanal + atualização da página "Análise Competitiva" no Notion

### O que faz
- Varre avaliações e reclamações dos concorrentes conhecidos (App Store, Google Play, Reddit, Reclame Aqui, redes sociais)
- Busca ativamente novos players no mercado de TCG que ainda não estão mapeados
- Atualiza a matriz SWOT do TCG Bindex com base nos dados coletados
- Salva relatório estruturado no Notion (não sobrescreve — acumula histórico)
- Salva cópia em `docs/inteligência/SWOT-YYYY-WW.md`

### Concorrentes iniciais a monitorar
HoloDex · Collectr · Dex · PokéCardex · Pokéllector · TCGBinder · Binder (iOS) · Card Dex Oficial · MonPrice TCG

### Estrutura do relatório semanal
```
- Novos players encontrados
- Reclamações mais frequentes por concorrente
- Pontos fortes observados (bench)
- Gaps / oportunidades para o TCG Bindex
- Matriz SWOT atualizada
```

### RAG
A página **"Análise Competitiva"** no Notion (já existente) serve como base de conhecimento.
Ver seção "Notion como RAG" abaixo.

### Tools necessárias
`WebSearch` · `notion-search` · `notion-update-page` · `/schedule` semanal

---

## Agent Produteiro ✅ (em produção — PR #27)

**Frequência:** toda terça-feira (dia seguinte ao SWOT)
**Output:** hipóteses de features + mockups (quando aplicável), salvas em `docs/04 - Produto/hipoteses/`

### O que faz
- Lê o relatório SWOT mais recente do Notion
- Consulta o contexto do projeto (CLAUDE.md, PRDs existentes, roadmap)
- Gera hipóteses de novas features priorizadas por impacto e viabilidade
- Para hipóteses de UI: gera mockup via skills de design (`/design:ux-copy`, `/design:accessibility-review`)
- Entrega lista estruturada para o Planner usar na quarta

### Inputs
- RAG de mercado (Notion — Análise Competitiva)
- CLAUDE.md e docs do projeto
- Roadmap atual
- Logs de uso (quando disponíveis)

### Tools necessárias
`notion-search` · `notion-fetch` · design skills · `WebSearch`

---

## Agent Planner ✅ (em produção — PR #28)

**Frequência:** toda quarta-feira
**Output:** proposta de sprint semanal + PRDs/SDDs rascunho — **requer aprovação de Matheus antes de executar**

### O que faz
- Agrega inputs: hipóteses do Produteiro + falhas do Tester + logs de erro (Railway, Vercel, GitHub, Sentry quando disponível)
- Prioriza itens por impacto, risco e esforço
- Monta sprint semanal com ordem de execução
- Gera rascunho de PRD e SDD para cada item aprovado
- Envia proposta para revisão — **não executa sem aprovação explícita**

### Checkpoint obrigatório
Matheus revisa e aprova/rejeita itens individualmente. Somente após aprovação o Builder é acionado.

### Tools necessárias
`notion-fetch` · acesso a logs Railway/Vercel/GitHub · Sentry (futuro) · TaskCreate

---

## Agent Builder ✅ (em produção — PR #29)

**Frequência:** quarta ou quinta, após aprovação da sprint pelo Planner
**Output:** código em produção via pipeline develop → CI → PR → main

### O que faz
- Recebe lista de itens aprovados com PRD + SDD
- Implementa seguindo o pipeline `/ship`
- Pausa em pontos de risco alto para confirmação
- Cada item vira um PR separado
- Agent Tester valida após merge

### Regras de autonomia
- Executa itens de baixo/médio risco autonomamente
- Pausa e pede confirmação para: mudanças de schema, novos endpoints públicos, alterações de auth
- Nunca faz deploy direto em `main` — sempre via PR com CI verde

### Tools necessárias
Full Claude Code · `git` · `/ship` · TaskCreate/TaskUpdate

---

## Notion como RAG — esclarecimento

A página "Análise Competitiva" no Notion **funciona como RAG funcional** para este caso.

**Por que funciona sem embeddings vetoriais:**
- O corpus é pequeno (9–20 concorrentes, relatórios semanais)
- O Notion MCP suporta busca semântica via Notion AI Search
- O agente recupera o contexto relevante e gera com base nele — isso é RAG na prática

**Para funcionar bem como RAG, a página precisa ser estruturada:**
- Histórico preservado (acumular, não sobrescrever)
- Seção por concorrente com tags consistentes
- Data de cada atualização registrada
- Matriz de features mantida atualizada

**Quando precisaria de RAG vetorial (Pinecone, etc.):**
- Corpus crescer para centenas de documentos
- Precisar de similaridade semântica fina entre documentos
- Volume atual não justifica a complexidade

**Conclusão:** Notion como RAG é a solução certa agora. Revisitar quando o corpus superar ~50 relatórios acumulados.

---

*Relacionado: `docs/05 - Qualidade/Agent Tester.md` · `docs/05 - Qualidade/Sentry-Plan.md`*
