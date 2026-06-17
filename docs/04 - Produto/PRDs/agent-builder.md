# PRD — Agent Builder

**Status:** Draft  
**Data:** 2026-06-17  
**Fase do produto:** Fase 2

---

## Problema

O Planner aprova um sprint toda quarta com escopo e ordem definidos. Mas sem o Builder, esse contrato não vira código — alguém precisa pegar cada item, implementar, testar e fazer deploy seguindo os padrões do projeto. Fazer isso manualmente quebra o fluxo autônomo da pipeline semanal.

## Solução

Skill `/agent-builder` que lê o contrato de sprint aprovado (`docs/sprints/SPRINT-YYYY-WW.md`) e executa cada item em sequência: gera spec mínima se necessário, implementa, valida localmente (typecheck + lint) e faz deploy via `/ship`. Cada item vira um PR separado. Em pontos de risco alto (mudança de schema, auth, endpoints públicos), pausa e pede confirmação antes de continuar.

## Usuário-alvo

Matheus (interno) — mas o impacto é direto no colecionador: o Builder é quem entrega as features aprovadas pelo Planner em produção.

## Critérios de aceite

- [ ] Skill invocável via `/agent-builder` sem erros
- [ ] Lê automaticamente o sprint mais recente em `docs/sprints/`
- [ ] Executa cada item em ordem, marcando status no contrato (`⏳ Pendente` → `✅ Concluído` / `❌ Erro`)
- [ ] Para cada item: implementa → typecheck + lint → `/ship` (cada item = 1 PR)
- [ ] Pausa e pede confirmação em mudanças de risco alto antes de implementar
- [ ] Nunca bypassa CI, hooks ou push direto para main
- [ ] Atualiza `docs/sprints/SPRINT-YYYY-WW.md` com status de cada item ao finalizar
- [ ] Registra execução no Painel de Execuções com status final

## Fora do escopo

- Não define o que implementar (isso é o Planner)
- Não cria PRDs completos — gera apenas spec técnica mínima quando necessário
- Não tem interface visual
- Não faz deploy de infra (Railway, Vercel, variáveis de ambiente) — só código

## Impacto esperado

O pipeline completo SWOT → Produteiro → Planner → **Builder** fecha o loop: inteligência de mercado vira código em produção de forma estruturada e rastreável, sem intervenção manual além do checkpoint do Planner.

## Dependências

- Agent Planner rodando toda quarta e gerando `docs/sprints/SPRINT-YYYY-WW.md`
- Skill `/ship` existindo e funcionando
- `gh` CLI autenticado
- Painel de Execuções já criado (`71edffd6-f921-4c73-ac01-68d0b6a63420`)
