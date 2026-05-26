# 🗃️ Modelos de Dados

#backend #arquitetura

Todos os modelos estão em `backend/src/models/`. Usam interfaces TypeScript puras + `Schema<Interface>`.

---

## Card

Representa uma carta Pokémon sincronizada da pokemontcg.io.  
**Nota:** `_id` é o ID da PokéTCG API (ex: `"sv4pt5-27"`), não um ObjectId gerado pelo Mongo.

```typescript
interface ICard {
  _id: string;              // ID pokemontcg.io (ex: "base1-4", "sv4pt5-27")
  name: string;
  number: string;           // "27" ou "027/094"
  supertype: string;        // "Pokémon" | "Trainer" | "Energy"
  subtypes: string[];
  rarity: string;
  artist: string;
  nationalPokedexNumbers: number[];
  types: string[];
  set: {
    id: string;
    name: string;
    series: string;
    images: { symbol: string; logo: string };
  };
  images: { small: string; large: string };
  prices: {
    normal?:          PriceVariant;
    holofoil?:        PriceVariant;
    reverseHolofoil?: PriceVariant;
  };
  lastPriceSyncAt: Date;
  syncedAt: Date;
}

interface PriceVariant {
  low: number | null; mid: number | null;
  high: number | null; market: number | null;
}
```

---

## Binder

Representa um binder (pasta) do usuário com slots de cartas.

```typescript
type GridConfig = '2x2' | '3x3' | '3x4' | '4x4';
type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

interface IBinderSlot {
  position: number;       // 0-indexed, ordenado
  cardId: string | null;  // ref: Card._id
  condition: CardCondition;
  quantity: number;
  language: 'PT' | 'EN' | 'JP';
}

interface IBinder {
  _id: Types.ObjectId;
  userId: Types.ObjectId;   // MVP: fixo como '000000000000000000000001'
  name: string;
  coverPhotoUrl?: string;   // base64 ou URL
  gridConfig: GridConfig;
  slots: IBinderSlot[];     // auto-criados pelo pre('save') hook
  createdAt: Date;
  updatedAt: Date;
}
```

**Total de slots por config:**
| GridConfig | Slots |
|-----------|-------|
| 2×2 | 4 |
| 3×3 | 9 |
| 3×4 | 12 |
| 4×4 | 16 |

**pre('save') hook**: cria automaticamente os slots faltantes com `cardId: null` e ordena por `position`.

---

## ExchangeRate

Cache da cotação USD→BRL no MongoDB. TTL de 1 hora.

```typescript
interface IExchangeRate {
  _id: Types.ObjectId;
  from: string;    // "USD"
  to: string;      // "BRL"
  rate: number;    // ex: 5.01
  recordedAt: Date;
}
```

---

## Condições de carta

| Sigla | Nome completo | Multiplicador de preço |
|-------|--------------|----------------------|
| NM | Near Mint | 100% |
| LP | Lightly Played | 80% |
| MP | Moderately Played | 60% |
| HP | Heavily Played | 40% |
| DMG | Damaged | 20% |

---

## Modelos planejados (não implementados)

- **User** — Autenticação (pós-MVP)
- **Wishlist** — Lista de desejos (pós-MVP)
- **PriceHistory** — Histórico de preços (pós-MVP)

---

*Veja também: [[API Reference]] · [[../01 - Arquitetura/Visão Geral do Sistema]]*
