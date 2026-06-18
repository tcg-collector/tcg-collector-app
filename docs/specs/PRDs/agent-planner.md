# PRD — Agent Planner

**Status:** Draft  
**Data:** 2026-06-17  
**Fase do produto:** Fase 2

---

## Problema

O Produteiro entrega toda terça uma lista priorizada de oportunidades com ICE score. Mas sem o Planner, essa lista não vira sprint — alguém precisa montar o escopo da semana, estimar o que cabe, ordenar a execução e apresentar para aprovação antes de qualquer linha de código ser escrita. Sem essa etapa estruturada, o Builder executaria sem contrato claro do que fazer.

## Solução

Skill `/agent-planner` que roda toda quarta-feira. Ele lê o relatório do Produteiro (top oportunidades com ICE), cruza com falhas reportadas pelo Agent Tester, monta uma proposta de sprint com escopo, ordem e estimativas — e **para para aprovação de Matheus** antes de qualquer execução. Só após "aprovado" o Builder pode ser acionado.

## Usuário-alvo

Matheus (interno) — o Planner é o ponto de controle humano do pipeline. Ele garante que o Builder nunca executa sem que Matheus tenha visto e aprovado o que vai ser feito.

## Critérios de aceite

- [ ] Skill invocável via `/agent-planner` sem erros
- [ ] Lê automaticamente o último relatório do Produteiro em `docs/04 - Produto/hipoteses/`
- [ ] Lê o último resultado do Agent Tester (falhas de rotas, se houver)
- [ ] Gera proposta de sprint com: itens priorizados, estimativa de esforço total, ordem de execução, o que ficou de fora e por quê
- [ ] **Para e aguarda aprovação explícita de Matheus** — não avança sem "aprovado"
- [ ] Após aprovação: salva sprint em `.claude/sprints/sprint-YYYY-WW.md`
- [ ] Após aprovação: atualiza Notion (página do Planner) com sprint da semana
- [ ] Após aprovação: registra no Painel de Execuções com status ✅
- [ ] Agendado para toda quarta-feira via `/schedule`

## Fora do escopo

- Não executa nenhuma implementação (isso é o Builder)
- Não cria PRDs ou SDDs completos — apenas o escopo da sprint em linguagem de task
- Não aprova sozinho — o checkpoint de Matheus é obrigatório e inviolável
- Não faz pesquisa web própria (consome Produteiro e Tester)
- Não tem interface visual

## Impacto esperado

Toda quarta, Matheus recebe uma proposta de sprint clara e pronta para aprovar com um "sim". O Builder tem um contrato explícito do que executar. O ciclo SWOT → Produteiro → Planner → Builder fecha sem ambiguidade.

## Dependências

- Agent Produteiro rodando toda terça (relatório em `docs/04 - Produto/hipoteses/PRODUTEIRO-YYYY-WW.md`)
- Agent Tester em produção (resultados acessíveis via GitHub Actions ou logs)
- Notion MCP disponível
- Painel de Execuções já criado (`71edffd6-f921-4c73-ac01-68d0b6a63420`)
- Agent Builder existindo (ou ao menos o skill `/ship` para o Builder usar)
