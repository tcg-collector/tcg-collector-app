import { Router, Request, Response } from 'express';
import { UserCollection } from '../models/UserCollection';
import { Card } from '../models/Card';
import { PriceHistory } from '../models/PriceHistory';
import { requireAuth } from '../middleware/auth';
import { validateCollectionCreate } from '../validation/schemas';
import { ALLOWED_DAYS, calcGainers, getBestMarket, startOfDay } from '../services/priceUtils';

const router = Router();

// Todas as rotas exigem autenticação
router.use(requireAuth);

// GET /api/collections — retorna coleção do usuário autenticado
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await UserCollection.find({ userId: req.userId })
      .populate('cardId')
      .sort({ addedAt: -1 });
    res.json({ data: items });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar coleção' });
  }
});

// GET /api/collections/top-gainers?days=7&limit=10 — maiores valorizações da coleção
router.get('/top-gainers', async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!(ALLOWED_DAYS as readonly number[]).includes(days)) {
    res.status(400).json({ error: `Parâmetro days deve ser um dos valores: ${ALLOWED_DAYS.join(', ')}` });
    return;
  }
  if (limit < 1 || limit > 50) {
    res.status(400).json({ error: 'Parâmetro limit deve estar entre 1 e 50' });
    return;
  }

  try {
    const items = await UserCollection.find({ userId: req.userId }).select('cardId condition');
    const cardIds = [...new Set(items.map(i => String(i.cardId)))];
    const results = await calcGainers(cardIds, days, limit);
    const conditionMap = new Map(items.map(i => [String(i.cardId), i.condition]));
    res.json({
      data: results.map(r => ({
        card: r.card,
        marketNow: r.marketNow,
        marketThen: r.marketThen,
        deltaPct: r.deltaPct,
        deltaAbs: r.deltaAbs,
        condition: conditionMap.get(String(r.card._id)),
      })),
    });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar valorizações da coleção' });
  }
});

// GET /api/collections/top-value?limit=10 — cartas mais valiosas da coleção
router.get('/top-value', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;

  if (limit < 1 || limit > 50) {
    res.status(400).json({ error: 'Parâmetro limit deve estar entre 1 e 50' });
    return;
  }

  try {
    const items = await UserCollection.find({ userId: req.userId })
      .populate<{ cardId: InstanceType<typeof Card> }>('cardId')
      .select('cardId condition');

    const withMarket = items
      .map(i => {
        const card = i.cardId as InstanceType<typeof Card>;
        const market = card && card.prices ? getBestMarket(card.prices as Parameters<typeof getBestMarket>[0]) : null;
        return { card, market, condition: i.condition };
      })
      .filter(r => r.market !== null) as { card: InstanceType<typeof Card>; market: number; condition: string }[];

    const top = withMarket
      .sort((a, b) => b.market - a.market)
      .slice(0, limit)
      .map(r => ({ card: r.card, market: r.market, condition: r.condition }));

    res.json({ data: top });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar cartas mais valiosas da coleção' });
  }
});

// GET /api/collections/summary?days=7 — valor total + delta do período
router.get('/summary', async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;

  if (!(ALLOWED_DAYS as readonly number[]).includes(days)) {
    res.status(400).json({ error: `Parâmetro days deve ser um dos valores: ${ALLOWED_DAYS.join(', ')}` });
    return;
  }

  try {
    const items = await UserCollection.find({ userId: req.userId })
      .populate<{ cardId: InstanceType<typeof Card> }>('cardId')
      .select('cardId');

    const cardIds = [...new Set(items.map(i => String(i.cardId)))];

    let totalValueUSD = 0;
    for (const item of items) {
      const card = item.cardId as InstanceType<typeof Card>;
      if (!card || !card.prices) continue;
      const market = getBestMarket(card.prices as Parameters<typeof getBestMarket>[0]);
      if (market) totalValueUSD += market;
    }

    const since = new Date();
    since.setDate(since.getDate() - days);
    const dayStart = startOfDay(since);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const snapshots = await PriceHistory.find({
      cardId: { $in: cardIds },
      date: { $gte: dayStart, $lte: dayEnd },
    });

    const snapshotMap = new Map(snapshots.map(s => [s.cardId, s.market]));
    let totalThenUSD = 0;
    for (const id of cardIds) {
      const market = snapshotMap.get(id);
      if (market) totalThenUSD += market;
    }

    const deltaUSD = totalThenUSD > 0 ? totalValueUSD - totalThenUSD : 0;
    const deltaPct = totalThenUSD > 0 ? (deltaUSD / totalThenUSD) * 100 : 0;

    res.json({ data: { totalValueUSD, deltaUSD, deltaPct, days } });
  } catch {
    res.status(500).json({ error: 'Erro ao calcular resumo da coleção' });
  }
});

// POST /api/collections — adiciona carta à coleção do usuário autenticado
router.post('/', async (req: Request, res: Response) => {
  const { data, errors } = validateCollectionCreate(req.body);
  if (errors) {
    res.status(400).json({ errors });
    return;
  }
  try {
    const item = new UserCollection({ ...data, userId: req.userId });
    await item.save();
    res.status(201).json({ data: item });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'ValidationError') {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Erro ao adicionar carta' });
  }
});

// DELETE /api/collections/:id — remove apenas se pertencer ao usuário autenticado
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await UserCollection.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!deleted) { res.status(404).json({ error: 'Item não encontrado' }); return; }
    res.json({ message: 'Carta removida da coleção' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover carta' });
  }
});

export default router;
