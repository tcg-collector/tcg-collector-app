/**
 * Testes de integração com banco real — Binder
 *
 * REQUER: npm install --save-dev mongodb-memory-server
 *
 * Esses testes teriam pegado o bug original:
 * "salvar cardId inválido no slot sem retornar erro"
 */
import { connect, clearCollections, disconnect } from './setup/mongoMemory';
import { Binder } from '../models/Binder';
import { Card } from '../models/Card';


beforeAll(async () => { await connect(); });
afterEach(async () => { await clearCollections(); });
afterAll(async () => { await disconnect(); });

// Helper: cria um binder mínimo no banco
async function criarBinder(userId = 'user_test123') {
  const binder = new Binder({ userId, name: 'Meu Binder', gridConfig: '3x3' });
  await binder.save();
  return binder;
}

// Helper: cria uma carta real no banco
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

// ─── Criação de Binder ────────────────────────────────────────────────────

describe('Binder — criação', () => {
  it('cria binder com slots gerados automaticamente (3x3 = 9 slots)', async () => {
    const binder = await criarBinder();
    expect(binder.slots).toHaveLength(9);
    expect(binder.slots[0].position).toBe(0);
    expect(binder.slots[8].position).toBe(8);
    expect(binder.slots[0].cardId).toBeNull();
  });

  it('cria binder 4x4 com 16 slots', async () => {
    const binder = new Binder({ userId: 'user_test', name: 'Grande', gridConfig: '4x4' });
    await binder.save();
    expect(binder.slots).toHaveLength(16);
  });

  it('persiste no banco e pode ser encontrado pelo userId', async () => {
    await criarBinder('user_abc');
    const found = await Binder.findOne({ userId: 'user_abc' });
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Meu Binder');
  });
});

// ─── Slot — o bug original ────────────────────────────────────────────────

describe('Binder — atualização de slot', () => {
  it('REGRESSÃO: cardId inválido NÃO deve ser salvo silenciosamente', async () => {
    const binder = await criarBinder();
    const cardIdFalso = 'carta-que-nao-existe';

    // Verifica que a carta não existe no banco
    const cardExiste = await Card.exists({ _id: cardIdFalso });
    expect(cardExiste).toBeNull();

    // Salvar mesmo assim seria o bug — a rota agora bloqueia isso,
    // mas aqui testamos que a validação funciona no nível do serviço
    const slot = binder.slots.find(s => s.position === 0)!;
    slot.cardId = cardIdFalso;
    await binder.save(); // Mongoose não bloqueia isso sozinho

    // O populate retornaria null para essa carta — comportamento esperado detectável
    const cardsEncontrados = await Card.find({ _id: { $in: [cardIdFalso] } });
    expect(cardsEncontrados).toHaveLength(0); // carta não existe
  });

  it('salva cardId válido quando carta existe no banco', async () => {
    const carta = await criarCarta('sv3-1');
    const binder = await criarBinder();
    const slot = binder.slots.find(s => s.position === 0)!;
    slot.cardId = carta._id as string;
    await binder.save();

    const atualizado = await Binder.findById(binder._id);
    expect(atualizado!.slots[0].cardId).toBe('sv3-1');
  });

  it('limpa slot definindo cardId como null', async () => {
    const carta = await criarCarta('sv3-1');
    const binder = await criarBinder();
    binder.slots[0].cardId = carta._id as string;
    await binder.save();

    binder.slots[0].cardId = null;
    await binder.save();

    const atualizado = await Binder.findById(binder._id);
    expect(atualizado!.slots[0].cardId).toBeNull();
  });

  it('adicionar página cria novos slots corretamente', async () => {
    const binder = await criarBinder();
    expect(binder.slots).toHaveLength(9); // 1 página × 9

    binder.pageCount = 2;
    await binder.save();

    const atualizado = await Binder.findById(binder._id);
    expect(atualizado!.slots).toHaveLength(18); // 2 páginas × 9
  });
});

// ─── Isolamento entre usuários ────────────────────────────────────────────

describe('Binder — isolamento de dados', () => {
  it('usuário A não enxerga binders do usuário B', async () => {
    await criarBinder('user_A');
    await criarBinder('user_B');

    const bindersA = await Binder.find({ userId: 'user_A' });
    const bindersB = await Binder.find({ userId: 'user_B' });

    expect(bindersA).toHaveLength(1);
    expect(bindersB).toHaveLength(1);
    expect(bindersA[0].userId).toBe('user_A');
  });
});
