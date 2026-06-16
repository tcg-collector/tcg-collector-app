# Sessão: Home Carrosséis de Mercado

**Slug:** home-carrosseis-mercado  
**Status:** executing  
**Iniciada:** 2026-06-16  
**Objetivo:** Redesign da Home — remover sino e market row hardcoded, adicionar carrosséis "Maiores Valorizações" e "Mais Valiosas" alimentados pelos endpoints /api/prices/top-gainers e /api/prices/top-value.

## Documentos
- PRD: docs/04 - Produto/PRDs/home-carrosseis-mercado.md
- SDD: docs/02 - Backend/SDDs/home-carrosseis-mercado.md

## Checkpoints
- [x] PRD criado e aprovado
- [x] SDD criado e aprovado
- [x] Plan Mode executado e aprovado
- [ ] Backend implementado (N/A — zero mudanças de backend)
- [x] Frontend implementado
- [x] Testes passando (typecheck + lint)
- [ ] /ship executado com sucesso

## Contexto para próxima sessão
- **Zero mudanças de backend** — feature é puramente frontend
- **3 arquivos novos**: `app/services/prices.ts`, `app/hooks/useMarketData.ts`, `app/components/MarketCardItem.tsx`
- **1 arquivo modificado**: `app/app/(tabs)/index.tsx` — remove sino, market row hardcoded, seção "Em destaque"; adiciona dois FlatList horizontais
- **Estado vazio**: quando endpoints retornam `[]`, exibe "Dados de mercado em breve" (não quebra a Home)
- **Loading independente por carrossel**: gainers e topValue têm ActivityIndicator próprio
- **`useCards` é removido da Home** — não é mais necessário lá (continua em collection.tsx)

## Histórico
- 2026-06-16 — PRD e SDD aprovados, sessão iniciada
