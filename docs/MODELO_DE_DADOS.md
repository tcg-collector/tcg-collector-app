# Modelo de Dados — App TCG Pokémon

> Decisões revisadas com André · Versão 2.0 · Maio 2026

---

## Visão Geral das Coleções

```
Users
  └── tem muitos → UserCollection (cards que possui)
  └── tem muitos → Wishlist (cards que quer)

Cards  (espelho da PokéTCG API, cacheado localmente)
  └── pertence a → Sets
  └── tem histórico → PriceHistory

UserCollection
  └── referencia → Users
  └── referencia → Cards

Wishlist
  └── referencia → Users
  └── referencia → Cards
```

---

## Decisões de Modelagem

### Por que referência (e não embedded)?

- **Card dentro de UserCollection**: Cards são compartilhados entre todos os usuários. Se embedarmos, duplicamos dados de carta para cada usuário que a tem → desperdício e inconsistência em updates de preço.
- **Set dentro de Card**: Um Set tem ~200 cartas. Embeddamos apenas os campos essenciais do set dentro da carta (nome, id, logo) para evitar um lookup a cada leitura de carta.
- **PriceHistory separado**: Histórico cresce infinitamente. Manter separado evita documento gigante na coleção Cards. Usar **Time Series Collection** do MongoDB Atlas (compatível com M0 gratuito).

---

## ✅ Decisões Fechadas (revisão André · Maio 2026)

| # | Decisão | Resolução |
|---|---------|-----------|
| 1 | PriceHistory no Atlas M0? | **Sim** — Time Series Collection é compatível com M0. Granularidade **semanal**: 1 snapshot por semana por carta, mostrando as últimas N semanas no gráfico. |
| 2 | Índice composto com unique? | **Sem unique** — o mesmo usuário pode ter múltiplos registros da mesma carta/condição/idioma (cartas duplicadas). O índice serve para busca rápida, não para unicidade. |
| 3 | Recálculo de stats do usuário | **Job agendado** a cada 6h + botão de **refresh manual** no app. Sem recálculo on-the-fly para manter custo e infra simples no MVP. |
| 4 | Moeda dos preços | **Armazenar sempre em USD** (como a PokéTCG API entrega). Conversão feita na exibição via API de câmbio. Ver seção "API de Câmbio" abaixo. |
| 5 | Carregamento do catálogo | **Estratégia híbrida**: cartas da coleção do usuário são pré-carregadas no login; catálogo geral é lazy (carrega o set quando buscado). Com mecanismo de fallback. Ver seção abaixo. |

---

## API de Câmbio (USD → BRL)

Para converter os preços de USD para a moeda escolhida pelo usuário, usar a **ExchangeRate-API** (exchangerate-api.com):

- Plano gratuito: 1.500 requisições/mês — suficiente para MVP
- Endpoint: `GET https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD`
- Retorna todas as moedas em relação ao USD em uma única chamada

**Estratégia de cache:** buscar o câmbio **uma vez por dia** e guardar no banco (coleção `ExchangeRates`) para não consumir as 1.500 requisições desnecessariamente.

```typescript
// models/ExchangeRate.ts
const ExchangeRateSchema = new Schema({
  base: { type: String, default: 'USD' },
  rates: {
    BRL: Number,
    EUR: Number,
    GBP: Number,
    JPY: Number,
  },
  fetchedAt: { type: Date, default: Date.now },
});
// Job diário: buscar novo câmbio e sobrescrever o documento existente
```

```typescript
// Uso no frontend/backend
const { rates } = await ExchangeRate.findOne().sort({ fetchedAt: -1 });
const valorEmBRL = valorEmUSD * rates.BRL;
```

---

## Estratégia de Carregamento de Cartas + Fallback

### Fluxo no login do usuário

```
1. Usuário faz login
   └── Backend busca todos os cardIds da coleção do usuário
   └── Verifica quais já existem no MongoDB local (coleção Cards)
   └── Os que faltam: busca em lote na PokéTCG API (até 250 por request)
   └── Salva no MongoDB e retorna ao app

2. Usuário busca uma carta nova (fora da coleção)
   └── Busca no MongoDB local primeiro
   └── Se não encontrar → busca na PokéTCG API → salva → retorna
```

### Fallback quando a PokéTCG API está fora do ar

```typescript
async function getCard(cardId: string): Promise<ICard | null> {
  // 1. Tenta o cache local primeiro (sempre)
  const cached = await Card.findById(cardId);
  if (cached) return cached;

  try {
    // 2. Busca na API externa
    const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
      headers: { 'X-Api-Key': process.env.POKEMONTCG_API_KEY },
      signal: AbortSignal.timeout(5000), // timeout de 5s
    });
    if (!response.ok) throw new Error('API indisponível');

    const { data } = await response.json();
    // 3. Salva no cache local para próximas requisições
    await Card.create(mapApiCardToSchema(data));
    return await Card.findById(cardId);

  } catch (err) {
    // 4. FALLBACK: se API falhou e não tem cache, retorna placeholder
    console.warn(`PokéTCG API indisponível para carta ${cardId}:`, err);
    return null; // o frontend exibe card com "imagem indisponível"
  }
}
```

### Placeholder no frontend quando carta não carrega

- Exibir arte genérica de verso de carta Pokémon
- Mostrar nome e número da carta (dados que já estão em UserCollection)
- Badge "⚠️ Dados temporariamente indisponíveis"
- Tentar recarregar automaticamente após 30s

---

## Schemas (Mongoose + TypeScript)

### 1. Set

```typescript
// models/Set.ts
import { Schema, model, Document } from 'mongoose';

export interface ISet extends Document {
  _id: string;          // ex: "sv3" (id da PokéTCG API)
  name: string;         // ex: "Obsidian Flames"
  series: string;       // ex: "Scarlet & Violet"
  printedTotal: number; // total impresso na carta
  total: number;        // total incluindo cartas secretas
  releaseDate: string;  // ex: "2023/08/11"
  images: {
    symbol: string;     // URL do símbolo do set
    logo: string;       // URL do logo do set
  };
  syncedAt: Date;       // última vez que sincronizamos da API
}

const SetSchema = new Schema<ISet>({
  _id:          { type: String },
  name:         { type: String, required: true },
  series:       { type: String, required: true },
  printedTotal: { type: Number },
  total:        { type: Number },
  releaseDate:  { type: String },
  images: {
    symbol: String,
    logo:   String,
  },
  syncedAt: { type: Date, default: Date.now },
}, { _id: false }); // usamos o id da API como _id

export const Set = model<ISet>('Set', SetSchema);
```

---

### 2. Card

```typescript
// models/Card.ts
import { Schema, model, Document } from 'mongoose';

// Preços por variante da carta
interface CardPrices {
  normal?: {
    low: number | null;
    mid: number | null;
    high: number | null;
    market: number | null;
  };
  holofoil?: {
    low: number | null;
    mid: number | null;
    high: number | null;
    market: number | null;
  };
  reverseHolofoil?: {
    low: number | null;
    mid: number | null;
    high: number | null;
    market: number | null;
  };
}

export interface ICard extends Document {
  _id: string;          // ex: "sv3-1" (id da PokéTCG API)
  name: string;         // ex: "Charmander"
  number: string;       // ex: "001"
  supertype: string;    // "Pokémon" | "Trainer" | "Energy"
  subtypes: string[];   // ex: ["Basic", "Stage 1"]
  rarity: string;       // ex: "Rare Holo"
  artist: string;
  nationalPokedexNumbers: number[];
  types: string[];      // ex: ["Fire"]
  set: {                // embedded para evitar lookup em toda leitura
    id: string;
    name: string;
    series: string;
    images: { symbol: string; logo: string };
  };
  images: {
    small: string;      // URL imagem pequena (thumbnail)
    large: string;      // URL imagem grande
  };
  prices: CardPrices;   // preços atuais (atualizado periodicamente)
  lastPriceSyncAt: Date;
  syncedAt: Date;
}

const CardSchema = new Schema<ICard>({
  _id:        { type: String },
  name:       { type: String, required: true, index: true },
  number:     { type: String, required: true },
  supertype:  { type: String },
  subtypes:   [String],
  rarity:     { type: String, index: true },
  artist:     { type: String },
  nationalPokedexNumbers: [Number],
  types:      [String],
  set: {
    id:     { type: String, ref: 'Set', index: true },
    name:   String,
    series: String,
    images: { symbol: String, logo: String },
  },
  images: {
    small: String,
    large: String,
  },
  prices: {
    normal:         { low: Number, mid: Number, high: Number, market: Number },
    holofoil:       { low: Number, mid: Number, high: Number, market: Number },
    reverseHolofoil:{ low: Number, mid: Number, high: Number, market: Number },
  },
  lastPriceSyncAt: { type: Date },
  syncedAt:        { type: Date, default: Date.now },
}, { _id: false });

// Índice de texto para busca por nome
CardSchema.index({ name: 'text' });

export const Card = model<ICard>('Card', CardSchema);
```

---

### 3. User

```typescript
// models/User.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  preferences: {
    currency: string;   // "BRL" | "USD"
    language: string;   // "pt-BR" | "en-US"
  };
  stats: {             // desnormalizado para performance no dashboard
    totalCards: number;
    uniqueCards: number;
    estimatedValue: number;
    lastCalculatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  avatar:       { type: String },
  preferences: {
    currency: { type: String, default: 'BRL' },
    language: { type: String, default: 'pt-BR' },
  },
  stats: {
    totalCards:        { type: Number, default: 0 },
    uniqueCards:       { type: Number, default: 0 },
    estimatedValue:    { type: Number, default: 0 },
    lastCalculatedAt:  { type: Date },
  },
}, { timestamps: true });

export const User = model<IUser>('User', UserSchema);
```

---

### 4. UserCollection

> A coleção mais importante do app — cada documento é "o usuário X tem N cópias da carta Y, na condição Z".

```typescript
// models/UserCollection.ts
import { Schema, model, Document, Types } from 'mongoose';

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
// NM = Near Mint | LP = Lightly Played | MP = Moderately Played
// HP = Heavily Played | DMG = Damaged

export type CardLanguage = 'PT' | 'EN' | 'JP' | 'DE' | 'FR' | 'IT' | 'ES' | 'KO';

export interface IUserCollection extends Document {
  userId: Types.ObjectId;
  cardId: string;
  quantity: number;
  condition: CardCondition;
  language: CardLanguage;
  isFoil: boolean;
  isFirstEdition: boolean;
  acquiredPrice?: number;   // quanto pagou (opcional)
  notes?: string;
  addedAt: Date;
  updatedAt: Date;
}

const UserCollectionSchema = new Schema<IUserCollection>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cardId:   { type: String, ref: 'Card', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  condition: {
    type: String,
    enum: ['NM', 'LP', 'MP', 'HP', 'DMG'],
    required: true,
    default: 'NM',
  },
  language: {
    type: String,
    enum: ['PT', 'EN', 'JP', 'DE', 'FR', 'IT', 'ES', 'KO'],
    default: 'EN',
  },
  isFoil:          { type: Boolean, default: false },
  isFirstEdition:  { type: Boolean, default: false },
  acquiredPrice:   { type: Number },
  notes:           { type: String, maxlength: 500 },
}, { timestamps: true });

// Índice composto para busca rápida (SEM unique — usuário pode ter múltiplos
// registros da mesma carta/condição/idioma, ex: cópias duplicadas para troca)
UserCollectionSchema.index({ userId: 1, cardId: 1, condition: 1, language: 1 });
// Busca rápida "todas as cartas deste usuário"
UserCollectionSchema.index({ userId: 1 });

export const UserCollection = model<IUserCollection>('UserCollection', UserCollectionSchema);
```

---

### 5. Wishlist

```typescript
// models/Wishlist.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  cardId: string;
  priority: 1 | 2 | 3;      // 1 = Alta, 2 = Média, 3 = Baixa
  maxBudget?: number;        // preço máximo que toparia pagar
  targetCondition: string;   // condição mínima desejada
  addedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cardId:  { type: String, ref: 'Card', required: true },
  priority: { type: Number, enum: [1, 2, 3], default: 2 },
  maxBudget: { type: Number },
  targetCondition: {
    type: String,
    enum: ['NM', 'LP', 'MP', 'HP', 'DMG'],
    default: 'LP',
  },
}, { timestamps: true });

// Garante que uma carta aparece uma só vez na wishlist do usuário
WishlistSchema.index({ userId: 1, cardId: 1 }, { unique: true });

export const Wishlist = model<IWishlist>('Wishlist', WishlistSchema);
```

---

### 6. PriceHistory

> **Time Series Collection** no MongoDB Atlas M0 gratuito. Granularidade **semanal**: 1 snapshot por semana por carta. Exibe as últimas N semanas no gráfico de evolução de preço.

```typescript
// models/PriceHistory.ts
import { Schema, model, Document } from 'mongoose';

export type PriceVariant = 'normal' | 'holofoil' | 'reverseHolofoil';

export interface IPriceHistory extends Document {
  cardId: string;             // metaField para Time Series
  variant: PriceVariant;
  market: number | null;      // preço de mercado em USD
  low: number | null;
  high: number | null;
  mid: number | null;
  recordedAt: Date;           // timeField para Time Series (domingo de cada semana)
}

const PriceHistorySchema = new Schema<IPriceHistory>({
  cardId:   { type: String, ref: 'Card', required: true },
  variant:  { type: String, enum: ['normal', 'holofoil', 'reverseHolofoil'] },
  market:   Number,
  low:      Number,
  high:     Number,
  mid:      Number,
  recordedAt: { type: Date, default: Date.now },
});

// Criar como Time Series no Atlas (rodar uma vez na inicialização do banco):
// db.createCollection("pricehistories", {
//   timeseries: {
//     timeField: "recordedAt",
//     metaField: "cardId",
//     granularity: "hours"   // "hours" é o menor disponível no M0
//   }
// })

// Job semanal (todo domingo à meia-noite) que:
// 1. Busca preços atuais na PokéTCG API para todas as cartas com colecionadores
// 2. Insere um snapshot em PriceHistory
// 3. Atualiza o campo prices em Card com o valor mais recente

PriceHistorySchema.index({ cardId: 1, recordedAt: -1 });

export const PriceHistory = model<IPriceHistory>('PriceHistory', PriceHistorySchema);
```

---

## Queries Principais

### Buscar coleção completa de um usuário (com dados da carta)

```typescript
// Retorna todas as cartas do usuário com dados populados
const colecao = await UserCollection
  .find({ userId })
  .populate('cardId')   // traz os dados completos da carta
  .sort({ addedAt: -1 });
```

### Calcular valor estimado da coleção

```typescript
// Aggregation que soma (quantidade × preço de mercado) por carta
const valorTotal = await UserCollection.aggregate([
  { $match: { userId: new Types.ObjectId(userId) } },
  {
    $lookup: {
      from: 'cards',
      localField: 'cardId',
      foreignField: '_id',
      as: 'card'
    }
  },
  { $unwind: '$card' },
  {
    $project: {
      valorItem: {
        $multiply: [
          '$quantity',
          { $ifNull: ['$card.prices.normal.market', 0] }
        ]
      }
    }
  },
  { $group: { _id: null, total: { $sum: '$valorItem' } } }
]);
```

### Buscar cartas por nome (search)

```typescript
// Busca por texto usando o índice de texto criado no schema de Card
const resultados = await Card.find(
  { $text: { $search: nomeBuscado } },
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } }).limit(20);
```

### Histórico de preço de uma carta

```typescript
const historico = await PriceHistory
  .find({ cardId, variant: 'holofoil' })
  .sort({ recordedAt: -1 })
  .limit(30);  // últimos 30 registros
```

---

---

## Jobs Agendados (resumo)

| Job | Frequência | O que faz |
|-----|-----------|-----------|
| `sync-prices` | Todo domingo 00:00 | Busca preços na PokéTCG API, salva snapshot em PriceHistory, atualiza `prices` em Card |
| `recalc-user-stats` | A cada 6 horas | Recalcula `stats` (totalCards, uniqueCards, estimatedValue) para todos os usuários ativos |
| `sync-exchange-rate` | 1x por dia (06:00) | Busca câmbio USD→BRL/outras na ExchangeRate-API e salva em ExchangeRates |
| `sync-new-sets` | 1x por semana | Verifica se há novos sets na PokéTCG API e sincroniza |

---

*Modelo fechado — próximo passo: criar o repositório GitHub e os arquivos de modelo no projeto.*
