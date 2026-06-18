# SDD — Agent Produteiro

**PRD:** [[../PRDs/agent-produteiro]]  
**Status:** Draft  
**Data:** 2026-06-17

---

## Visão técnica

Skill do Claude Code (`/agent-produteiro`) que toda terça-feira lê o relatório SWOT mais recente, cruza com o backlog atual do produto e gera lista priorizada de oportunidades usando ICE score, salvando o output localmente e no Notion.

---

## Tipo de entrega

**Claude Code skill** — arquivo `.md` em `.claude/commands/`. Não é endpoint de backend nem tela de frontend.

---

## Arquivos a criar

### `.claude/commands/agent-produteiro.md`
Skill file principal com instruções passo a passo para o Claude executar ao ser invocado via `/agent-produteiro`.

### `docs/04 - Produto/hipoteses/`
Pasta para relatórios semanais do Produteiro.  
Convenção de nome: `PRODUTEIRO-YYYY-WW.md` (ex: `PRODUTEIRO-2026-W26.md`)

### `docs/04 - Produto/hipoteses/.gitkeep`
Mantém o diretório no git.

---

## Fluxo de execução do agent

```
1. Preparação
   └─ Calcula semana atual (YYYY-WW)
   └─ Lê último relatório em docs/inteligência/ (SWOT da semana)
   └─ Lê CLAUDE.md seção "Estado atual" (o que está em produção / backlog)
   └─ Lê docs/05 - Qualidade/Agents-Backlog.md (itens já mapeados)

2. Leitura da RAG histórica
   └─ notion-fetch na página Análise Competitiva
   └─ Extrai tendências das últimas semanas (novos players recorrentes, gaps persistentes)

3. Análise de oportunidades
   └─ Cruza gaps do SWOT com o backlog atual
   └─ Identifica: o que ainda não está no backlog? o que subiu de prioridade?
   └─ Alerta se alguma ameaça exige resposta imediata
   └─ Sugere descarte de itens do backlog que o mercado invalidou

4. Pontuação ICE
   └─ Para cada oportunidade: Impact (1–10) × Confidence (1–10) / Effort (1–10)
   └─ Ordena por ICE score decrescente
   └─ Seleciona top 5–8 oportunidades

5. Salvar relatório local
   └─ Escreve docs/04 - Produto/hipoteses/PRODUTEIRO-YYYY-WW.md

6. Atualizar Notion
   └─ notion-update-page na página do Agent Produteiro (insert_content, position: end)
   └─ Nunca replace_content — sempre acumular histórico

7. Registrar no Painel de Execuções
   └─ notion-create-pages na database do Painel com status ✅ Concluído
```

---

## Estrutura do relatório gerado

```markdown
# PRODUTEIRO-YYYY-WW — [data ISO]

## Contexto SWOT consumido
Relatório: SWOT-YYYY-WW — [data]
Top gaps identificados: [lista dos 3 principais]

## Oportunidades priorizadas

| # | Oportunidade | Origem no SWOT | Impact | Confidence | Effort | ICE |
|----|--------------|----------------|--------|------------|--------|-----|
| 1  | ...          | ...            | X      | X          | X      | X.X |
...

## Alertas de urgência
[Se alguma ameaça exige resposta imediata — ou "Nenhum alerta esta semana"]

## Itens do backlog a reconsiderar
[Se o mercado invalidou algo — ou "Backlog atual continua válido"]

## Para o Agent Planner
Top 3 para o sprint desta semana:
1. [oportunidade + justificativa em 1 linha]
2. [oportunidade + justificativa em 1 linha]
3. [oportunidade + justificativa em 1 linha]
```

---

## Notion — IDs

| Recurso | ID |
|---------|-----|
| Agent Produteiro (página) | `3828b3b9-3cfd-81d9-8563-ee2235060cc8` |
| Painel de Execuções (DB) | `71edffd6-f921-4c73-ac01-68d0b6a63420` |
| RAG — Análise Competitiva | `36b8b3b9-3cfd-81ed-b18d-e0a9ce1acef1` |

### Schema do Painel de Execuções
```
Execução: "PRODUTEIRO YYYY-WW"
Agent: "Produteiro"
Data: YYYY-MM-DD
Status: "✅ Concluído" | "❌ Erro"
Resumo: top 2 oportunidades da semana em 1 linha
Relatório: docs/04 - Produto/hipoteses/PRODUTEIRO-YYYY-WW.md
Sprint: null
```

---

## ICE Score — critérios de pontuação

| Dimensão | O que avaliar |
|----------|--------------|
| **Impact (1–10)** | Impacto no colecionador BR: quantos usuários afeta? aumenta retenção ou aquisição? |
| **Confidence (1–10)** | Confiança na hipótese: há dados de mercado confirmando? concorrentes validaram? |
| **Effort (1–10)** | Esforço estimado: 1 = horas, 5 = dias, 10 = semanas. Considerar backend + frontend + testes |

**ICE = (Impact × Confidence) / Effort**

---

## Agendamento

Configurar via `/schedule` após skill file pronto:
- Frequência: toda terça-feira
- Prompt: `/agent-produteiro`

---

## Arquivos a tocar

```
+ .claude/commands/agent-produteiro.md     ← skill file (principal)
+ docs/04 - Produto/hipoteses/             ← criar diretório
+ docs/04 - Produto/hipoteses/.gitkeep    ← manter no git
~ docs/05 - Qualidade/Agents-Backlog.md   ← atualizar status após ship
```

---

## Riscos e trade-offs

- **SWOT ausente:** se o Agent SWOT não rodou na segunda (falha ou feriado), o Produteiro sinaliza ausência e analisa o último disponível
- **Backlog desatualizado:** o Produteiro lê CLAUDE.md e Agents-Backlog.md — se esses arquivos estiverem defasados, a análise fica imprecisa. Regra: após cada sprint, atualizar "Estado atual" do CLAUDE.md
- **ICE subjetivo:** pontuações são estimativas do próprio Claude com base nos dados disponíveis. O Planner e Matheus podem ajustar antes de executar

