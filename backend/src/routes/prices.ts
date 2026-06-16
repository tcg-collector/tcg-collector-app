import { Router, Request, Response } from 'express';
import { getUSDtoBRL } from '../services/ExchangeRateService';
import { Card } from '../models/Card';
import { requireAuth } from '../middleware/auth';
import { ALLOWED_DAYS, calcGainers, getBestMarket } from '../services/priceUtils';

const router = Router();

// GET /api/prices/exchange - Cotação USD->BRL
router.get('/exchange', async (_req: Request, res: Response) => {
  try {
    const rate = await getUSDtoBRL();
    res.json({ data: { pair: 'USD-BRL', rate } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cotação' });
  }
});

// GET /api/prices/top-gainers?days=7&limit=10 — top cartas por % crescimento (catálogo global)
router.get('/top-gainers', requireAuth, async (req: Request, res: Response) => {
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
    const allCardIds = await Card.distinct('_id') as string[];
    const results = await calcGainers(allCardIds, days, limit);
    res.json({ data: results.map(r => ({ card: r.card, marketNow: r.marketNow, marketThen: r.marketThen, deltaPct: r.deltaPct, deltaAbs: r.deltaAbs })) });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar maiores valorizações' });
  }
});

// GET /api/prices/top-value?limit=10 — top cartas por valor absoluto atual (catálogo global)
router.get('/top-value', requireAuth, async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;

  if (limit < 1 || limit > 50) {
    res.status(400).json({ error: 'Parâmetro limit deve estar entre 1 e 50' });
    return;
  }

  try {
    const cards = await Card.find({
      $or: [
        { 'prices.holofoil.market': { $ne: null, $gt: 0 } },
        { 'prices.normal.market': { $ne: null, $gt: 0 } },
        { 'prices.reverseHolofoil.market': { $ne: null, $gt: 0 } },
      ],
    }).lean();

    const withMarket = cards
      .map(c => ({ card: c, market: getBestMarket(c.prices as Parameters<typeof getBestMarket>[0]) }))
      .filter(r => r.market !== null) as { card: typeof cards[number]; market: number }[];

    const top = withMarket
      .sort((a, b) => b.market - a.market)
      .slice(0, limit)
      .map(r => ({ card: r.card, market: r.market }));

    res.json({ data: top });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar cartas mais valiosas' });
  }
});

// GET /api/prices/:cardId - Preços de uma carta específica
router.get('/:cardId', async (req: Request, res: Response) => {
  try {
    const card = await Card.findById(req.params.cardId).select('prices lastPriceSyncAt name');
    if (!card) {
      res.status(404).json({ error: 'Carta não encontrada' });
      return;
    }
    res.json({ data: { prices: card.prices, lastSyncAt: card.lastPriceSyncAt } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar preços' });
  }
});

export default router;
