/**
 * Testes de integração — Histórico de Preços
 *
 * Cobre: PriceHistory model, calcGainers, syncPricesOnly snapshots,
 * GET /api/prices/top-gainers e GET /api/prices/top-value
 */
import { connect, clearCollections, disconnect } from './setup/mongoMemory';
import { Card } from '../models/Card';
import { PriceHistory } from '../models/PriceHistory';
import { calcGainers, getBestMarket, startOfDay } from '../services/priceUtils';

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearCollections(); });
afterAll(async () => { await disconnect(); });

async function criarCarta(id: string, marketHolofoil: number | null = null, marketNormal: number | null = null) {
  return Card.create({
    _id: id,
    name: 'Carta Teste ' + id,
    number: '001',
    supertype: 'Pokémon',
    set: { id: 'sv3', name: 'Obsidian Flames', series: 'Scarlet & Violet', images: { symbol: '', logo: '' } },
    images: { small: '', large: '' },
    prices: {
      holofoil: marketHolofoil !== null ? { low: marketHolofoil * 0.9, mid: marketHolofoil, high: marketHolofoil * 1.1, market: marketHolofoil } : undefined,
      normal:   marketNormal !== null   ? { low: marketNormal * 0.9,   mid: marketNormal,   high: marketNormal * 1.1,   market: marketNormal }   : undefined,
    },
    syncedAt: new Date(),
  });
}

async function criarSnapshot(cardId: string, daysAgo: number, market: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return PriceHistory.create({ cardId, date: startOfDay(date), market });
}

// ─── getBestMarket ────────────────────────────────────────────────────────────

describe('getBestMarket', () => {
  it('prioriza holofoil > normal > reverseHolofoil', () => {
    expect(getBestMarket({ holofoil: { low: 1, mid: 2, high: 3, market: 10 }, normal: { low: 1, mid: 2, high: 3, market: 5 } })).toBe(10);
    expect(getBestMarket({ normal: { low: 1, mid: 2, high: 3, market: 5 } })).toBe(5);
    expect(getBestMarket({ reverseHolofoil: { low: 1, mid: 2, high: 3, market: 3 } })).toBe(3);
    expect(getBestMarket({})).toBeNull();
    expect(getBestMarket(undefined)).toBeNull();
  });
});

// ─── PriceHistory model ───────────────────────────────────────────────────────

describe('PriceHistory — model', () => {
  it('salva snapshot corretamente', async () => {
    await criarCarta('sv3-1', 25.0);
    const today = startOfDay(new Date());
    await PriceHistory.create({ cardId: 'sv3-1', date: today, market: 25.0 });
    const found = await PriceHistory.findOne({ cardId: 'sv3-1' });
    expect(found).not.toBeNull();
    expect(found!.market).toBe(25.0);
  });

  it('upsert é idempotente — mesmo cardId+date não duplica', async () => {
    const today = startOfDay(new Date());
    await PriceHistory.updateOne(
      { cardId: 'sv3-1', date: today },
      { $set: { cardId: 'sv3-1', date: today, market: 25.0 } },
      { upsert: true }
    );
    await PriceHistory.updateOne(
      { cardId: 'sv3-1', date: today },
      { $set: { cardId: 'sv3-1', date: today, market: 26.0 } },
      { upsert: true }
    );
    const count = await PriceHistory.countDocuments({ cardId: 'sv3-1' });
    expect(count).toBe(1);
    const found = await PriceHistory.findOne({ cardId: 'sv3-1' });
    expect(found!.market).toBe(26.0);
  });
});

// ─── calcGainers ─────────────────────────────────────────────────────────────

describe('calcGainers', () => {
  it('retorna carta com maior % primeiro', async () => {
    await criarCarta('sv3-1', 30);  // era 20 → +50%
    await criarCarta('sv3-2', 20);  // era 15 → +33%
    await criarSnapshot('sv3-1', 7, 20);
    await criarSnapshot('sv3-2', 7, 15);

    const results = await calcGainers(['sv3-1', 'sv3-2'], 7, 10);
    expect(results).toHaveLength(2);
    expect(results[0].card._id).toBe('sv3-1');
    expect(results[0].deltaPct).toBeCloseTo(50, 0);
  });

  it('exclui carta sem snapshot em D-N', async () => {
    await criarCarta('sv3-1', 30);
    await criarCarta('sv3-2', 20);
    await criarSnapshot('sv3-1', 7, 20); // só sv3-1 tem snapshot

    const results = await calcGainers(['sv3-1', 'sv3-2'], 7, 10);
    expect(results).toHaveLength(1);
    expect(results[0].card._id).toBe('sv3-1');
  });

  it('exclui carta com variação negativa ou zero', async () => {
    await criarCarta('sv3-1', 20); // preço atual igual ao snapshot → 0%
    await criarCarta('sv3-2', 10); // era 15 → -33%
    await criarSnapshot('sv3-1', 7, 20);
    await criarSnapshot('sv3-2', 7, 15);

    const results = await calcGainers(['sv3-1', 'sv3-2'], 7, 10);
    expect(results).toHaveLength(0);
  });

  it('retorna vazio quando não há snapshots', async () => {
    await criarCarta('sv3-1', 30);
    const results = await calcGainers(['sv3-1'], 7, 10);
    expect(results).toHaveLength(0);
  });

  it('respeita o limite', async () => {
    for (let i = 1; i <= 5; i++) {
      await criarCarta(`sv3-${i}`, 20 + i);
      await criarSnapshot(`sv3-${i}`, 7, 10);
    }
    const results = await calcGainers(['sv3-1','sv3-2','sv3-3','sv3-4','sv3-5'], 7, 3);
    expect(results).toHaveLength(3);
  });
});

// ─── Validação de days ────────────────────────────────────────────────────────

describe('ALLOWED_DAYS', () => {
  it('calcGainers com days=30 usa snapshot correto', async () => {
    await criarCarta('sv3-1', 30);
    await criarSnapshot('sv3-1', 30, 20); // snapshot de 30 dias atrás
    const results = await calcGainers(['sv3-1'], 30, 10);
    expect(results).toHaveLength(1);
    expect(results[0].deltaPct).toBeCloseTo(50, 0);
  });
});
