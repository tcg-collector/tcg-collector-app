# PRD — Agent SWOT

**Status:** Draft  
**Data:** 2026-06-17  
**Fase do produto:** Fase 2 — Tooling & Inteligência

---

## Problema

Matheus não tem visibilidade contínua sobre o que os concorrentes estão fazendo bem ou mal. Acompanhar manualmente reviews de 9 apps em múltiplas plataformas (App Store, Google Play, Reddit, Reclame Aqui) toda semana é inviável para um dev solo. Sem esse input, decisões de produto são tomadas no escuro.

## Solução

Um agent autônomo que roda toda segunda-feira e executa três ações:

1. **Varredura de concorrentes conhecidos** — busca reviews negativos, reclamações e elogios dos 9 players mapeados nas principais fontes públicas
2. **Descoberta de novos players** — busca ativa por apps TCG que ainda não estão no radar
3. **Atualização da RAG de mercado** — consolida os dados em relatório SWOT estruturado e atualiza a página "Análise Competitiva" no Notion, que serve de base de conhecimento para o Agent Produteiro (terças)

O agent é uma skill do Claude Code (`/agent-swot`) agendada via `/schedule`.

## Usuário-alvo

Matheus (dev solo) — é ferramenta de processo interno, sem impacto direto no usuário final do app.

## Critérios de aceite

- [ ] Skill `/agent-swot` invocável manualmente a qualquer momento
- [ ] Ao rodar, varre os 9 concorrentes mapeados em App Store reviews, Google Play reviews, Reddit e Reclame Aqui
- [ ] Busca pelo menos 3 fontes para descoberta de novos players TCG
- [ ] Gera relatório com estrutura fixa: novos players, reclamações por concorrente, pontos fortes (bench), gaps/oportunidades, SWOT atualizado
- [ ] Atualiza a página "Análise Competitiva" no Notion (acumula — não sobrescreve histórico)
- [ ] Salva cópia local em `docs/inteligência/SWOT-YYYY-WW.md`
- [ ] Agendado para rodar toda segunda-feira automaticamente

## Fora do escopo

- Comparação de preços ou features em detalhe (isso é papel do Produteiro)
- Alertas ou notificações push para Matheus
- Acesso a dados privados (analytics, downloads, receita) dos concorrentes
- Análise de sentiment automatizada com ML — o próprio Claude faz a síntese

## Impacto esperado

O Agent Produteiro (terças) passa a ter contexto de mercado atualizado semanalmente, sem custo de tempo manual. Decisões de roadmap ficam ancoradas em evidências reais de insatisfação dos usuários dos concorrentes.

## Dependências

- Notion MCP conectado ✅
- WebSearch disponível ✅
- `/schedule` skill disponível ✅
- Página "Análise Competitiva" já existe no Notion ✅
