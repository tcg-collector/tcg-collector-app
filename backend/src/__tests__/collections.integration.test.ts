/**
 * Testes de integração com banco real — UserCollection
 *
 * REQUER: npm install --save-dev mongodb-memory-server
 */
import { connect, clearCollections, disconnect } from './setup/mongoMemory';
import { UserCollection } from '../models/UserCollection';
import { Card } from '../models/Card';

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
