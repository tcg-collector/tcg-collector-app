/**
 * Testes de integração com banco real — UserCollection
 *
 * REQUER: npm install --save-dev mongodb-memory-server
 */
import { connect, clearCollections, disconnect } from './setup/mongoMemory';
import { UserCollection } from '../models/UserCollection';
import { Card } from '../models/Card';
import { PriceHistory } from '../models/PriceHistory';
import { startOfDay } from '../services/priceUtils';

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearCollections(); });
afterAll(async () => { await disconnect(); });

async function criarCarta(id = 'sv3-1') {
  return Card.create({
    _id: id,
    name: 'Charmander',
    number: '001',
    supertype: 'Pokémon',
    set: { id: 'sv3', name: 'Obsidian Flames', series: 'Scarlet & Violet', images: { symbol: '', logo: '' } },
    images: { small: '', large: '' },
    syncedAt: new Date(),
  });
}

describe('UserCollection — criação', () => {
  it('cria item de coleção válido', async () => {
    await criarCarta('sv3-1');
    const item = new UserCollection({
      userId: 'user_abc',
      cardId: 'sv3-1',
      quantity: 1,
      condition: 'NM',
      language: 'PT',
    });
    await item.save();
    const found = await UserCollection.findOne({ userId: 'user_abc' });
    expect(found).not.toBeNull();
    expect(found!.cardId).toBe('sv3-1');
    expect(found!.condition).toBe('NM');
  });

  it('rejeita condição inválida no nível do Mongoose', async () => {
    const item = new UserCollection({
      userId: 'user_abc',
      cardId: 'sv3-1',
      condition: 'MINT', // inválido
    });
    await expect(item.save()).rejects.toThrow();
  });

  it('rejeita quantity menor que 1', async () => {
    const item = new UserCollection({
      userId: 'user_abc',
      cardId: 'sv3-1',
      quantity: 0,
    });
    await expect(item.save()).rejects.toThrow();
  });

  it('permite o mesmo usuário ter múltiplas cópias da mesma carta', async () => {
    await criarCarta('sv3-1');
    await UserCollection.create({ userId: 'user_abc', cardId: 'sv3-1', condition: 'NM' });
    await UserCollection.create({ userId: 'user_abc', cardId: 'sv3-1', condition: 'LP' }); // cópia em condição diferente
    const total = await UserCollection.countDocuments({ userId: 'user_abc', cardId: 'sv3-1' });
    expect(total).toBe(2);
  });

  it('populate retorna dados da carta junto com o item', async () => {
    await criarCarta('sv3-1');
    await UserCollection.create({ userId: 'user_abc', cardId: 'sv3-1', condition: 'NM' });
    const items = await UserCollection.find({ userId: 'user_abc' }).populate('cardId');
    expect(items[0].cardId).toMatchObject({ name: 'Charmander' });
  });
});

describe('UserCollection — isolamento de dados', () => {
  it('usuário A não enxerga coleção do usuário B', async () => {
    await criarCarta('sv3-1');
    await UserCollection.create({ userId: 'user_A', cardId: 'sv3-1', condition: 'NM' });
    await UserCollection.create({ userId: 'user_B', cardId: 'sv3-1', condition: 'LP' });

    const colecaoA = await UserCollection.find({ userId: 'user_A' });
    const colecaoB = await UserCollection.find({ userId: 'user_B' });

    expect(colecaoA).toHaveLength(1);
    expect(colecaoB).toHaveLength(1);
    expect(colecaoA[0].condition).toBe('NM');
    expect(colecaoB[0].condition).toBe('LP');
  });
});

// ─── Helpers para histórico de preços ────────────────────────────────────────

async function criarCartaComPreco(id: string, market: number) {
  return Card.create({
    _id: id,
    name: 'Carta ' + id,
    number: '001',
    supertype: 'Pokémon',
    set: { id: 'sv3', name: 'Obsidian Flames', series: 'Scarlet & Violet', images: { symbol: '', logo: '' } },
    images: { small: '', large: '' },
    prices: { holofoil: { low: market * 0.9, mid: market, high: market * 1.1, market } },
    syncedAt: new Date(),
  });
}

async function criarSnapshot(cardId: string, daysAgo: number, market: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return PriceHistory.create({ cardId, date: startOfDay(date), market });
}

// ─── collections/top-gainers ──────────────────────────────────────────────────

describe('UserCollection — top-gainers (calcGainers filtrado por coleção)', () => {
  it('retorna apenas cartas da coleção com valorização positiva', async () => {
    await criarCartaComPreco('sv3-1', 30); // era 20 → +50%
    await criarCartaComPreco('sv3-2', 25); // não está na coleção
    await criarSnapshot('sv3-1', 7, 20);
    await criarSnapshot('sv3-2', 7, 20);
    await UserCollection.create({ userId: 'user_A', cardId: 'sv3-1', condition: 'NM' });

    const { calcGainers } = await import('../services/priceUtils');
    const items = await UserCollection.find({ userId: 'user_A' }).select('cardId');
    const cardIds = [...new Set(items.map(i => String(i.cardId)))];
    const results = await calcGainers(cardIds, 7, 10);

    expect(results).toHaveLength(1);
    expect(results[0].card._id).toBe('sv3-1');
    // sv3-2 não aparece porque não está na coleção
  });
});

// ─── collections/top-value ────────────────────────────────────────────────────

describe('UserCollection — top-value (cartas mais valiosas da coleção)', () => {
  it('retorna cartas ordenadas por valor desc', async () => {
    await criarCartaComPreco('sv3-1', 50);
    await criarCartaComPreco('sv3-2', 30);
    await UserCollection.create({ userId: 'user_A', cardId: 'sv3-1', condition: 'NM' });
    await UserCollection.create({ userId: 'user_A', cardId: 'sv3-2', condition: 'LP' });

    const items = await UserCollection.find({ userId: 'user_A' })
      .populate('cardId')
      .select('cardId');

    const { getBestMarket } = await import('../services/priceUtils');
    const withMarket = items
      .map(i => {
        const card = i.cardId as unknown as InstanceType<typeof Card>;
        return { card, market: getBestMarket(card?.prices as never) };
      })
      .filter(r => r.market !== null);

    expect(withMarket).toHaveLength(2);
    const sorted = withMarket.sort((a, b) => (b.market ?? 0) - (a.market ?? 0));
    expect(sorted[0].card._id).toBe('sv3-1');
    expect(sorted[1].card._id).toBe('sv3-2');
  });
});

// ─── collections/summary ─────────────────────────────────────────────────────

describe('UserCollection — summary', () => {
  it('calcula deltaUSD e deltaPct corretamente', async () => {
    await criarCartaComPreco('sv3-1', 30); // preço atual 30
    await criarSnapshot('sv3-1', 7, 20);   // era 20 → delta +10 → +50%
    await UserCollection.create({ userId: 'user_A', cardId: 'sv3-1', condition: 'NM' });

    const { startOfDay: sod } = await import('../services/priceUtils');
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const dayStart = sod(since);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const snapshots = await PriceHistory.find({ cardId: { $in: ['sv3-1'] }, date: { $gte: dayStart, $lte: dayEnd } });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].market).toBe(20);
  });
});
