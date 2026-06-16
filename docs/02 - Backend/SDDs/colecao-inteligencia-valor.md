# SDD — Coleção com Inteligência de Valor

**PRD:** [[PRDs/colecao-inteligencia-valor]]  
**Status:** Draft  
**Data:** 2026-06-16

---

## Visão técnica

Adicionar painel de inteligência no topo de `collection.tsx` — acima do resumo geral existente — com três blocos alimentados pelos endpoints `/api/collections/summary`, `/api/collections/top-gainers` e `/api/collections/top-value`. Zero mudanças de backend.

---

## Backend

### Endpoints novos ou modificados

Nenhum — todos os endpoints necessários já estão em produção desde a feature "Histórico de Preços".

### Parâmetros consumidos

**`GET /api/collections/summary?days=7`** (autenticado)
```json
{ "data": { "totalValueUSD": 120.5, "deltaUSD": 9.2, "deltaPct": 8.3, "days": 7 } }
```

**`GET /api/collections/top-gainers?days=7&limit=5`** (autenticado)
```json
{ "data": [{ "card": {...}, "marketNow": 30, "marketThen": 20, "deltaPct": 50, "deltaAbs": 10, "condition": "NM" }] }
```

**`GET /api/collections/top-value?limit=5`** (autenticado)
```json
{ "data": [{ "card": {...}, "market": 120, "condition": "NM" }] }
```

---

## Frontend

### Telas afetadas

- `app/app/(tabs)/collection.tsx` — adicionar painel de inteligência no topo, antes do resumo geral existente

### Novos arquivos

**`app/services/collection-market.ts`**
```ts
// collectionMarketService.summary(days?)     → CollectionSummary
// collectionMarketService.topGainers(days?, limit?) → CollectionGainerItem[]
// collectionMarketService.topValue(limit?)   → CollectionValueItem[]
//
// Interfaces:
// CollectionSummary { totalValueUSD, deltaUSD, deltaPct, days }
// CollectionGainerItem { card, marketNow, marketThen, deltaPct, deltaAbs, condition }
// CollectionValueItem  { card, market, condition }
```

**`app/hooks/useCollectionMarket.ts`**
```ts
// Chama em paralelo: summary() + topGainers() + topValue() + useExchangeRate()
// Retorna: { summary, gainers, topValue, rate, loading }
// Só dispara fetch se items.length > 0 (coleção não vazia)
```

### Componentes reutilizados (sem criação)

- `MarketCardItem` — já existe em `app/components/MarketCardItem.tsx`, usado em ambos os carrosséis da coleção com as mesmas props da Home

### Estados e fluxo de dados

```
collection.tsx → useCollectionMarket({ skip: items.length === 0 })
                  ├── collectionMarketService.summary()     → summary
                  ├── collectionMarketService.topGainers()  → gainers[]
                  ├── collectionMarketService.topValue()    → topValue[]
                  └── exchangeService.getUSDtoBRL()         → rate

Painel renderizado ANTES do resumo geral existente:
  ├── [SummaryCard] totalValueBRL + delta (verde/vermelho)
  ├── [Carrossel "Maiores Valorizações"] gainers → MarketCardItem com badge
  └── [Carrossel "Mais Valiosas"]        topValue → MarketCardItem sem badge

Visibilidade:
  - Painel inteiro oculto se items.length === 0
  - Cada bloco oculto individualmente se a lista vier vazia (sem msg de erro)
  - Loading: ActivityIndicator único enquanto useCollectionMarket.loading === true
```

### Posição na tela após modificação

```
<ScrollView>
  [NOVO] Painel de Inteligência          ← inserido aqui
    - SummaryCard
    - Carrossel Maiores Valorizações
    - Carrossel Mais Valiosas
  [EXISTENTE] Resumo Geral (3 cards)
  [EXISTENTE] Seção Binders
  [EXISTENTE] Seção Avulso + filtros
</ScrollView>
```

### Lógica do SummaryCard

```tsx
// totalValueBRL = summary.totalValueUSD * rate
// deltaBRL = summary.deltaUSD * rate
// Se summary.deltaUSD === 0 → exibir "—" (sem histórico ainda)
// Se deltaBRL > 0 → cor Colors.mint (+R$ X,XX · +Y%)
// Se deltaBRL < 0 → cor Colors.crimson (-R$ X,XX · -Y%)
```

---

## Testes a escrever

- Nenhum teste de backend (zero mudanças)
- Typecheck + lint antes do ship

---

## Arquivos a tocar

```
app/
  services/collection-market.ts      ← novo
  hooks/useCollectionMarket.ts       ← novo
  app/(tabs)/collection.tsx          ← modificar (inserir painel no topo)
```

---

## Riscos e trade-offs

- **Três fetches adicionais no mount:** chamados em paralelo via `Promise.all`, somam ~1 RTT. Mitigado: painel oculto se coleção vazia, então usuário novo não sente impacto.
- **Primeiros dias sem histórico:** `summary.deltaUSD === 0` e `gainers === []` — painel aparece mas mostra "—" no delta e omite o carrossel de valorizações. Sem quebra visual.
- **`collection.tsx` já tem 563 linhas:** a inserção do painel adiciona ~60 linhas mas não altera nenhuma lógica existente — risco de regressão baixo.
