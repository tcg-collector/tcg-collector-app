# Sessão: Histórico de Preços das Cartas

**Slug:** historico-precos  
**Status:** done  
**Iniciada:** 2026-06-16  
**Objetivo:** Criar camada de histórico de preços com snapshots diários, 5 novos endpoints e helper calcGainers() compartilhado — fundação para carrosséis de mercado e inteligência de valor.

## Documentos
- PRD: docs/04 - Produto/PRDs/historico-precos.md
- SDD: docs/02 - Backend/SDDs/historico-precos.md

## Checkpoints
- [x] PRD criado e aprovado
- [x] SDD criado e aprovado
- [x] Plan Mode executado e aprovado
- [x] Backend implementado
- [x] Frontend implementado (N/A — feature é backend puro)
- [x] Testes passando (typecheck + lint + jest)
- [x] /ship executado com sucesso

## Contexto para próxima sessão
- **Zero mudanças de frontend** — feature é fundação de backend
- **Novo model `PriceHistory`**: `{ cardId: string, date: Date, market: number }` com TTL index 60 dias e índice único `{ cardId, date }`
- **`calcGainers(cardIds[], days, limit)`** em `priceUtils.ts` é o único lugar da lógica de % — usado pelos dois top-gainers endpoints
- **Extensão do sync**: após bulkWrite de preços, upsert de snapshot para TODAS as cartas (inclui as sem retorno da API — garante continuidade)
- **`days` aceita apenas [7, 30, 60]** — validação no backend retorna 400 para outros valores
- **Primeiros dias sem dados**: top-gainers retorna vazio normalmente até acumular snapshots — não quebra nada

## Histórico
- 2026-06-16 — PRD e SDD aprovados, sessão iniciada
