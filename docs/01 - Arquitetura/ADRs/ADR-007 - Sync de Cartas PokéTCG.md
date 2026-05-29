# ADR-007 — Estratégia de Sync do Catálogo PokéTCG

#arquitetura #decisão #backend

**Status**: ✅ Aprovada
**Data**: 2026-05-29

## Contexto

O app precisa de acesso a todas as cartas Pokémon TCG (~12k) para busca por nome e filtro por edição. A PokéTCG API tem rate limits e latência variável — buscar em tempo real por request do usuário seria lento e instável.

## Decisão

Sincronizar todo o catálogo da PokéTCG API para o MongoDB Atlas e servir as buscas localmente:

- **Sync inicial**: `syncAllCards()` paginado (250 cartas/página) via Railway SSH — executado uma vez
- **Sync diário**: cron job 06:00 UTC chama `syncPricesOnly()` para atualizar preços TCGPlayer
- **Retry automático**: 3 tentativas com 5s de espera em caso de timeout da API externa
- **Upsert**: `bulkWrite` com `{ upsert: true }` — idempotente, pode rodar múltiplas vezes

**Resultado**: 12.032 cartas no banco cobrindo todo o catálogo disponível na PokéTCG API.

## Consequências

### Positivas
- Busca instantânea sem depender da PokéTCG API em runtime
- Filtro por edição (`setId`) funciona via índice MongoDB
- Preços atualizados diariamente sem intervenção manual

### Negativas / trade-offs
- Novas cartas só entram no banco após o próximo sync diário
- MongoDB M0 (512MB) — 12k cartas ocupam ~30MB, bem dentro do limite

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|----------------------|
| Busca em tempo real na PokéTCG API | Latência alta, rate limit, dependência externa em runtime |
| Sync por set (não por página global) | Mais complexo, não oferece vantagem relevante |

---
*Veja também: [[../Visão Geral do Sistema]] · [[../../02 - Backend/API Reference]]*
