# SDD — Agent SWOT

**PRD:** [[../PRDs/agent-swot]]  
**Status:** Draft  
**Data:** 2026-06-17

---

## Visão técnica

Skill do Claude Code (`/agent-swot`) que executa varredura semanal de concorrentes TCG, gera relatório SWOT estruturado e atualiza a RAG de mercado no Notion e em `docs/inteligência/`.

---

## Tipo de entrega

Este agent **não é um endpoint de backend nem uma tela de frontend**. É um **Claude Code skill** — um arquivo `.md` em `.claude/commands/` que o Claude executa como conjunto de instruções quando invocado via `/agent-swot` ou pelo `/schedule`.

---

## Arquivos a criar

### `.claude/commands/agent-swot.md`
O skill file principal. Contém:
- Frontmatter com `name` e `description`
- Instruções passo a passo que o Claude segue ao executar
- Lista de concorrentes, fontes e estrutura do relatório
- Instruções de como escrever no Notion e salvar localmente
- Instrução de registro no Painel de Execuções

### `docs/inteligência/` (diretório)
Pasta para armazenar cópias locais dos relatórios semanais.
Convenção de nome: `SWOT-YYYY-WW.md` (ex: `SWOT-2026-W26.md`)

---

## Fluxo de execução do agent

```
1. Ler contexto
   └─ Lê docs/05 - Qualidade/Agents-Backlog.md (lista de concorrentes)
   └─ Lê último relatório em docs/inteligência/ (para comparar evolução)

2. Varredura dos 9 concorrentes conhecidos
   └─ WebSearch: "[app name] reviews complaints 2026 site:reddit.com"
   └─ WebSearch: "[app name] avaliações site:reclameaqui.com.br"
   └─ WebSearch: "[app name] negative reviews app store"
   └─ Para cada: extrai reclamações recorrentes + pontos elogiados

3. Descoberta de novos players
   └─ WebSearch: "pokemon card tracker app 2026"
   └─ WebSearch: "tcg binder app new launch"
   └─ WebSearch: "colecionador pokemon app brasil"
   └─ Filtra: só adiciona se for app real e não estiver já mapeado

4. Síntese SWOT
   └─ Consolida achados em matriz SWOT do TCG Bindex
   └─ Identifica gaps exploráveis

5. Salvar relatório local
   └─ Escreve docs/inteligência/SWOT-YYYY-WW.md

6. Atualizar Notion
   └─ notion-fetch da página "Análise Competitiva"
   └─ notion-update-page: append do novo relatório (não sobrescreve)

7. Registrar no Painel de Execuções
   └─ notion-create-pages na database do Painel com status ✅ Concluído
```

---

## Estrutura do relatório gerado

```markdown
## SWOT-YYYY-WW — [data ISO]

### Novos players encontrados
- [nome] — [plataforma] — [diferencial observado]

### Reclamações por concorrente
| Concorrente | Reclamação mais frequente | Volume |
|-------------|--------------------------|--------|
| HoloDex     | Scan IA impreciso        | alto   |
| ...         | ...                      | ...    |

### Pontos fortes observados (bench)
- [concorrente]: [o que fazem bem que vale aprender]

### Gaps e oportunidades para o TCG Bindex
- [gap identificado] → [ação sugerida]

### Matriz SWOT — [semana]
**Forças:** ...  
**Fraquezas:** ...  
**Oportunidades:** ...  
**Ameaças:** ...
```

---

## Notion — IDs e estrutura

| Recurso | ID / URL |
|---------|----------|
| Hub Sistema de Agents | `3828b3b9-3cfd-81ea-9e19-df13c6f94b90` |
| Análise Competitiva (RAG) | `36b8b3b9-3cfd-81ed-b18d-e0a9ce1acef1` |
| Painel de Execuções (DB) | `collection://71edffd6-f921-4c73-ac01-68d0b6a63420` |
| Doc Agent SWOT | `3828b3b9-3cfd-8139-b0c2-ddb09869568b` |

### Schema do Painel de Execuções
```
Execução: "SWOT YYYY-WW"
Agent: "SWOT"
Data: YYYY-MM-DD
Status: "✅ Concluído" | "❌ Erro"
Resumo: achados em 1-2 linhas
Relatório: URL do relatório local ou Notion
Sprint: null (SWOT não tem sprint)
```

---

## Agendamento

Após o skill file estar pronto, configurar via `/schedule`:
- Frequência: toda segunda-feira
- Prompt: `/agent-swot`
- Sem parâmetros adicionais

---

## Testes a validar (antes de /ship)

- [ ] Skill invocável manualmente via `/agent-swot` sem erros
- [ ] Relatório gerado com todas as seções obrigatórias
- [ ] Arquivo salvo em `docs/inteligência/SWOT-YYYY-WW.md`
- [ ] Página "Análise Competitiva" no Notion atualizada (sem apagar histórico)
- [ ] Registro criado no Painel de Execuções com status correto

---

## Arquivos a tocar

```
+ .claude/commands/agent-swot.md          ← skill file (principal)
+ docs/inteligência/                       ← criar diretório
+ docs/inteligência/.gitkeep              ← manter no git
~ docs/05 - Qualidade/Agents-Backlog.md   ← atualizar status de ⏳ para ✅ após ship
```

---

## Riscos e trade-offs

- **WebSearch pode retornar resultados desatualizados** — o agent deve filtrar por data e sinalizar quando não encontrar dados recentes
- **Notion MCP pode falhar silenciosamente** — o agent deve verificar se o update foi bem-sucedido antes de registrar ✅ no Painel
- **Concorrentes novos podem ser falsos positivos** — o agent deve incluir critério de filtro (é um app real, tem página na loja, tem foco em TCG?)

