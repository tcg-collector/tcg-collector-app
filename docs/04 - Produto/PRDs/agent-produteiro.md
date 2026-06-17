# PRD — Agent Produteiro

**Status:** Draft  
**Data:** 2026-06-17  
**Fase do produto:** Fase 2

---

## Problema

O Agent SWOT gera toda segunda-feira um relatório rico de inteligência competitiva — gaps de mercado, reclamações dos concorrentes, novos players. Mas sem processamento, esse relatório fica parado em `docs/inteligência/` e não se converte em ações concretas de produto. O Matheus precisaria ler o relatório, cruzar com o backlog atual e priorizar manualmente — o que não acontece de forma consistente.

## Solução

Skill `/agent-produteiro` que roda toda terça-feira. Ele lê o relatório SWOT mais recente, cruza com o estado atual do backlog e gera uma lista priorizada de oportunidades de produto usando ICE score (Impact × Confidence / Effort). O output alimenta o Agent Planner na quarta-feira.

## Usuário-alvo

Matheus (dono do produto) — este agent é interno, não impacta diretamente o colecionador. Ele aumenta a velocidade e qualidade das decisões de produto do Matheus com base em dados de mercado reais.

## Critérios de aceite

- [ ] Skill invocável via `/agent-produteiro` sem erros
- [ ] Lê automaticamente o último relatório SWOT de `docs/inteligência/`
- [ ] Lê o estado atual do backlog de `docs/05 - Qualidade/Agents-Backlog.md` e da seção "Estado atual" do CLAUDE.md
- [ ] Gera lista de oportunidades priorizadas com ICE score (1–10 em cada dimensão)
- [ ] Salva relatório local em `docs/produto/PRODUTEIRO-YYYY-WW.md`
- [ ] Atualiza Notion (página do Produteiro) com o relatório da semana (append, não replace)
- [ ] Registra entrada no Painel de Execuções com status ✅ ou ❌
- [ ] Agendado para toda terça-feira via `/schedule`

## Fora do escopo

- Não decide quais itens entram no sprint (isso é o Agent Planner)
- Não cria PRDs ou SDDs detalhados (apenas lista e prioriza oportunidades)
- Não implementa nada
- Não faz pesquisa web própria (consome o SWOT já processado)
- Não tem interface visual — é puramente um skill de análise

## Impacto esperado

Toda terça-feira, Matheus acorda com uma lista priorizada de oportunidades de produto derivadas da inteligência de mercado da semana. O Agent Planner na quarta pode consumir esse output diretamente e montar a sprint sem depender de uma reunião de priorização manual.

## Dependências

- Agent SWOT rodando toda segunda (relatório disponível em `docs/inteligência/SWOT-YYYY-WW.md`)
- Notion MCP disponível (para leitura da RAG e atualização do histórico)
- Painel de Execuções já criado (data_source_id: `71edffd6-f921-4c73-ac01-68d0b6a63420`)
