# Sessão: Coleção com Inteligência de Valor

**Slug:** colecao-inteligencia-valor  
**Status:** done  
**Iniciada:** 2026-06-16  
**Objetivo:** Adicionar painel de inteligência de valor no topo da tela de Coleção — resumo total em BRL + delta, carrossel de maiores valorizações e carrossel de mais valiosas da coleção do usuário.

## Documentos
- PRD: docs/specs/PRDs/colecao-inteligencia-valor.md
- SDD: docs/specs/SDDs/colecao-inteligencia-valor.md

## Checkpoints
- [x] PRD criado e aprovado
- [x] SDD criado e aprovado
- [x] Plan Mode executado e aprovado
- [ ] Backend implementado (N/A — zero mudanças de backend)
- [x] Frontend implementado
- [x] Testes passando (typecheck + lint)
- [x] /ship executado com sucesso

## Contexto para próxima sessão
- **Zero mudanças de backend** — feature é puramente frontend
- **2 arquivos novos**: `app/services/collection-market.ts`, `app/hooks/useCollectionMarket.ts`
- **1 arquivo modificado**: `app/app/(tabs)/collection.tsx` — painel inserido ANTES do resumo geral existente
- **`MarketCardItem` reutilizado** dos dois carrosséis — sem novo componente para cards
- **Painel oculto** se `items.length === 0` (evita 3 fetches extras para usuário sem coleção)
- **Delta "—"** quando `summary.deltaUSD === 0` (primeiros dias sem histórico)
- **Carrossel de gainers oculto** quando lista vazia — não exibe mensagem de erro

## Histórico
- 2026-06-16 — PRD e SDD aprovados, sessão iniciada

