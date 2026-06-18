# SDD — Histórico de Preços das Cartas

**PRD:** [[../PRDs/historico-precos]]  
**Status:** Draft  
**Data:** 2026-06-16

---

## Visão técnica

Novo model `PriceHistory` para snapshots diários; extensão do cron `syncPricesOnly()` para salvar snapshots e preservar último preço; helper `calcGainers()` compartilhado; 5 novos endpoints autenticados em `/api/prices/` e `/api/collections/`.

---

## Backend

### Endpoints novos ou modificados

| Método | Rota | Auth | Mudança |
|--------|------|------|---------|
| GET | `/api/prices/top-gainers` | ✅ | Novo — catálogo global, maior % crescimento |
| GET | `/api/prices/top-value` | ✅ | Novo — catálogo global, maior valor absoluto |
| GET | `/api/collections/top-gainers` | ✅ | Novo — mesma lógica, filtrado pela coleção do userId |
| GET | `/api/collections/top-value` | ✅ | Novo — top cartas mais caras da coleção do userId |
| GET | `/api/collections/summary` | ✅ | Novo — valor total + delta 7 dias |

> Rotas existentes `/api/prices/exchange` e `/api/prices/:cardId` não são modificadas.

### Parâmetros / Body

**`GET /api/prices/top-gainers?days=7&limit=10`**
```
Query: days (7|30|60, default 7), limit (1-50, default 10)
Response: { data: [{ card: Card, marketNow, marketThen, deltaPct, deltaAbs }] }
```

**`GET /api/prices/top-value?limit=10`**
```
Query: limit (1-50, default 10)
Response: { data: [{ card: Card, market }] }
```

**`GET /api/collections/top-gainers?days=7&limit=10`**
```
Query: days (7|30|60, default 7), limit (1-50, default 10)
Response: { data: [{ card: Card, marketNow, marketThen, deltaPct, deltaAbs, condition }] }
```

**`GET /api/collections/top-value?limit=10`**
```
Query: limit (1-50, default 10)
Response: { data: [{ card: Card, market, condition }] }
```

**`GET /api/collections/summary?days=7`**
```
Query: days (7|30|60, default 7)
Response: { data: { totalValueUSD, deltaUSD, deltaPct, days } }
```

### Modelo de dados

**Novo model: `PriceHistory`**

```ts
// backend/src/models/PriceHistory.ts
{
  cardId: string,        // Card._id (string, não ObjectId)
  date:   Date,          // UTC midnight do dia do snapshot
  market: number,        // holofoil?.market ?? normal?.market ?? reverseHolofoil?.market
}
```

Índices:
```ts
{ cardId: 1, date: -1 }  // unique — um snapshot por carta por dia
{ date: 1 }              // TTL index — expireAfterSeconds: 60 * 24 * 60 * 60 (60 dias)
```

> TTL index do MongoDB deleta documentos automaticamente quando `date` ultrapassa 60 dias. Sem necessidade de cron de limpeza manual.

**Sem alteração no model `Card`** — o campo `prices` existente já preserva o último valor conhecido (o sync só atualiza cartas que têm preço na API; cartas sem retorno ficam com o preço anterior intacto).

### Helper compartilhado: `calcGainers()`

```ts
// backend/src/services/priceUtils.ts

const ALLOWED_DAYS = [7, 30, 60];

function getBestMarket(prices: CardPrices): number | null {
  return prices?.holofoil?.market ?? prices?.normal?.market ?? prices?.reverseHolofoil?.market ?? null;
}

async function calcGainers(cardIds: string[], days: number, limit: number) {
  // 1. Busca snapshots de D-days para os cardIds
  const since = new Date(); since.setDate(since.getDate() - days);
  const snapshots = await PriceHistory.find({
    cardId: { $in: cardIds },
    date: { $gte: startOfDay(since), $lte: endOfDay(since) }
  });

  // 2. Busca preço atual das cartas que têm snapshot
  const snapshotMap = new Map(snapshots.map(s => [s.cardId, s.market]));
  const cards = await Card.find({ _id: { $in: [...snapshotMap.keys()] } });

  // 3. Calcula variação e filtra
  return cards
    .map(card => {
      const marketNow  = getBestMarket(card.prices);
      const marketThen = snapshotMap.get(card._id);
      if (!marketNow || !marketThen || marketThen === 0) return null;
      const deltaPct = ((marketNow - marketThen) / marketThen) * 100;
      const deltaAbs = marketNow - marketThen;
      return { card, marketNow, marketThen, deltaPct, deltaAbs };
    })
    .filter(Boolean)
    .filter(r => r!.deltaPct > 0)           // só valorização positiva
    .sort((a, b) => b!.deltaPct - a!.deltaPct)
    .slice(0, limit);
}
```

### Extensão do sync de preços

Modificar `PokeTCGService.syncPricesOnly()` — após o `bulkWrite` de preços, salvar snapshots do dia para **todas as cartas** usando o preço atual armazenado (inclui cartas que a API não retornou hoje, mantendo continuidade histórica):

```ts
// Após o bulkWrite existente:
const today = startOfDay(new Date());
const allCards = await Card.find({}, { _id: 1, prices: 1 });
const ops = allCards
  .map(c => ({ cardId: c._id, market: getBestMarket(c.prices) }))
  .filter(s => s.market !== null)
  .map(s => ({
    updateOne: {
      filter: { cardId: s.cardId, date: today },
      update: { $set: { cardId: s.cardId, date: today, market: s.market } },
      upsert: true,
    }
  }));

if (ops.length) await PriceHistory.bulkWrite(ops);
```

> Upsert por `{ cardId, date }` garante idempotência — rodar o sync duas vezes no mesmo dia não duplica registros.

### Validações e regras de negócio

- `days` deve ser `7 | 30 | 60` — retorna HTTP 400 com mensagem clara para outros valores
- `limit` entre 1 e 50 — retorna HTTP 400 fora do range
- Top-gainers exclui: cartas sem snapshot em D-N, cartas com `marketThen === 0`, cartas com variação negativa ou zero
- `calcGainers` é o único lugar onde a lógica de % vive — ambos os endpoints o chamam

---

## Frontend

**Nenhuma alteração nesta feature** — é fundação de backend pura. As telas de home, coleção e perfil serão modificadas nas features [2] e [3].

Será necessário criar `app/services/prices.ts` nas features seguintes para consumir os novos endpoints.

---

## Testes a escrever

- [ ] `PriceHistory` salva snapshot correto após sync (upsert idempotente)
- [ ] Carta sem preço na API mantém snapshot do dia com preço anterior
- [ ] `GET /api/prices/top-gainers` retorna ordenado por % desc, exclui variação de zero
- [ ] `GET /api/prices/top-value` retorna ordenado por valor desc
- [ ] `GET /api/collections/top-gainers` retorna apenas cartas da coleção do userId autenticado
- [ ] `GET /api/collections/top-value` idem
- [ ] `GET /api/collections/summary` retorna deltaUSD e deltaPct corretos
- [ ] `days=15` retorna HTTP 400
- [ ] `limit=0` retorna HTTP 400

---

## Arquivos a tocar

```
backend/src/
  models/PriceHistory.ts                  ← novo
  services/priceUtils.ts                  ← novo (getBestMarket, calcGainers, ALLOWED_DAYS)
  services/PokeTCGService.ts              ← estender syncPricesOnly() com snapshot
  routes/prices.ts                        ← adicionar top-gainers e top-value
  routes/collections.ts                   ← adicionar top-gainers, top-value e summary
  routes/index.ts                         ← verificar se collections já está registrada
  __tests__/prices.integration.test.ts    ← novos testes
  __tests__/collections.integration.test.ts ← novos testes
```

Atualizar manifesto do agent tester:
```
backend/src/scripts/agent-tester.ts      ← 5 novas entradas em KNOWN_ROUTES (covered: false → true após testes)
```

---

## Riscos e trade-offs

- **Performance do top-gainers global:** busca snapshots de D-N para ~12k cartas e depois os preços atuais — duas queries grandes. Mitigação: índice em `{ cardId, date }` cobre a primeira query; a segunda é por `_id` (indexed). Aceitável para M0 no volume atual.
- **Primeiro dia sem histórico:** nos primeiros dias após deploy, `calcGainers` retornará lista vazia (sem snapshots em D-7). Comportamento esperado — os carrosséis ficam vazios até acumular dados. Não quebra nada.
- **TTL index delay:** MongoDB processa TTL a cada ~60 segundos, então registros podem sobreviver alguns minutos além dos 60 dias. Sem impacto prático.
- **Upsert no sync:** o `bulkWrite` com upsert lê todas as ~12k cartas a cada execução diária do cron. Timing: o cron já leva vários minutos para paginar a PokéTCG API — essa operação adicional é paralela e não bloqueia.

