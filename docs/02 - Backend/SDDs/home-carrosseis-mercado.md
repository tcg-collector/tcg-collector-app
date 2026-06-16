# SDD — Home: Carrosséis de Mercado

**PRD:** [[PRDs/home-carrosseis-mercado]]  
**Status:** Draft  
**Data:** 2026-06-16

---

## Visão técnica

Remover sino e market row com valores hardcoded da Home; substituir a seção "Em destaque" por dois carrosséis horizontais alimentados por dados reais dos endpoints `/api/prices/top-gainers` e `/api/prices/top-value`.

---

## Backend

### Endpoints novos ou modificados

Nenhum — os cinco endpoints entregues na feature "Histórico de Preços" já estão em produção. Esta feature é puramente de frontend.

### Parâmetros consumidos pelo frontend

**`GET /api/prices/top-gainers?days=7&limit=10`** (autenticado)
```json
{
  "data": [
    { "card": { "_id": "sv3-1", "name": "Charizard ex", "images": { "small": "...", "large": "..." }, ... },
      "marketNow": 45.0, "marketThen": 30.0, "deltaPct": 50.0, "deltaAbs": 15.0 }
  ]
}
```

**`GET /api/prices/top-value?limit=10`** (autenticado)
```json
{
  "data": [
    { "card": { "_id": "sv3-2", ... }, "market": 120.0 }
  ]
}
```

**`GET /api/prices/exchange`** (público) — já consumido pela Home via `useExchangeRate`.

---

## Frontend

### Telas afetadas

- `app/app/(tabs)/index.tsx` — remoção do sino, remoção do market row hardcoded, substituição de "Em destaque" por dois carrosséis

### Novos arquivos

**`app/services/prices.ts`**
```ts
// pricesService.topGainers(days?, limit?) → GainerItem[]
// pricesService.topValue(limit?)          → ValueItem[]
// Interfaces: GainerItem { card, marketNow, marketThen, deltaPct, deltaAbs }
//             ValueItem  { card, market }
```

**`app/hooks/useMarketData.ts`**
```ts
// Retorna: { gainers, topValue, rate, loading, error }
// Chama em paralelo: pricesService.topGainers() + pricesService.topValue() + useExchangeRate()
// loading = true enquanto qualquer fetch estiver pendente
```

**`app/components/MarketCardItem.tsx`**
```tsx
// Props: { card, priceBRL, badge?: string, badgeColor?: string, onPress }
// badge: exibe "+34%" em verde (gainers) ou undefined (top-value)
// Dimensões: width 130, image 100x140
```

### Estados e fluxo de dados

```
index.tsx → useMarketData()
             ├── pricesService.topGainers()  → gainers[]
             ├── pricesService.topValue()    → topValue[]
             └── useExchangeRate()           → rate

index.tsx → renderiza dois FlatList horizontais
            ├── Gainers: MarketCardItem(card, priceBRL, badge="+34%")
            └── TopValue: MarketCardItem(card, priceBRL)

Estado vazio (lista vazia): texto neutro "Dados de mercado em breve"
Loading: ActivityIndicator por carrossel (gainers e topValue independentes)
Erro: silencioso — carrossel não aparece (não travar a Home inteira)
```

### O que é removido do index.tsx

- `TouchableOpacity` com `Ionicons name="notifications-outline"` (sino)
- Bloco `marketRow` inteiro (três cards com valores hardcoded +12,4% / -3,1% / USD→BRL)
- Import de `useCards` e `useCards` hook (não é mais usado)
- Helpers `priceUSD` e `priceBRL` (movidos para `MarketCardItem` ou `prices.ts`)
- Seção "Em destaque" (FlatList de `featured`)

---

## Testes a escrever

- Não há testes de integração backend (backend não muda)
- Typecheck + lint antes do ship (validação padrão)

---

## Arquivos a tocar

```
app/
  services/prices.ts                  ← novo
  hooks/useMarketData.ts              ← novo
  components/MarketCardItem.tsx       ← novo
  app/(tabs)/index.tsx                ← modificar
```

---

## Riscos e trade-offs

- **Primeiros dias sem dados:** `top-gainers` retorna `[]` até acumular snapshots. Estado vazio já tratado — sem crash.
- **Dois fetches na Home:** `topGainers` e `topValue` são chamados em paralelo via `Promise.all`. Latência percebida = max(t1, t2), não soma.
- **Market row removida:** Os valores +12,4%/-3,1% eram hardcoded e enganosos. A remoção é melhoria de qualidade. A cotação USD→BRL permanece implícita nos preços exibidos em BRL nos carrosséis.
- **`useCards` não é mais usado na Home:** importação e hook serão removidos — sem impacto em outras telas (hook é usado em `collection.tsx` separadamente).
