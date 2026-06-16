import { Router, Request, Response } from 'express';
import { getUSDtoBRL } from '../services/ExchangeRateService';
import { Card } from '../models/Card';
import { requireAuth } from '../middleware/auth';
import { ALLOWED_DAYS, calcGainers, getBestMarket } from '../services/priceUtils';

const router = Router();

// Cache em memória para evitar varredura de 20k docs a cada request
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

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

  const cacheKey = `top-gainers:${days}:${limit}`;
  const cached = getCache<unknown[]>(cacheKey);
  if (cached) {
    res.json({ data: cached });
    return;
  }

  try {
    const allCardIds = await Card.distinct('_id') as string[];
    const results = await calcGainers(allCardIds, days, limit);
    const data = results.map(r => ({ card: r.card, marketNow: r.marketNow, marketThen: r.marketThen, deltaPct: r.deltaPct, deltaAbs: r.deltaAbs }));
    setCache(cacheKey, data);
    res.json({ data });
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

  const cacheKey = `top-value:${limit}`;
  const cached = getCache<unknown[]>(cacheKey);
  if (cached) {
    res.json({ data: cached });
    return;
  }

  try {
    // Busca só os campos necessários e usa sort no MongoDB para evitar carregar tudo em memória
    const [byHolo, byNormal, byReverse] = await Promise.all([
      Card.find({ 'prices.holofoil.market': { $gt: 0 } })
        .select('name number set images prices')
        .sort({ 'prices.holofoil.market': -1 })
        .limit(limit * 3)
        .lean(),
      Card.find({ 'prices.normal.market': { $gt: 0 }, 'prices.holofoil.market': { $in: [null, 0] } })
        .select('name number set images prices')
        .sort({ 'prices.normal.market': -1 })
        .limit(limit * 3)
        .lean(),
      Card.find({ 'prices.reverseHolofoil.market': { $gt: 0 }, 'prices.holofoil.market': { $in: [null, 0] }, 'prices.normal.market': { $in: [null, 0] } })
        .select('name number set images prices')
        .sort({ 'prices.reverseHolofoil.market': -1 })
        .limit(limit * 3)
        .lean(),
    ]);

    const combined = [...byHolo, ...byNormal, ...byReverse]
      .map(c => ({ card: c, market: getBestMarket(c.prices as Parameters<typeof getBestMarket>[0]) }))
      .filter((r): r is { card: typeof byHolo[number]; market: number } => r.market !== null && r.market > 0)
      .sort((a, b) => b.market - a.market)
      .slice(0, limit)
      .map(r => ({ card: r.card, market: r.market }));

    setCache(cacheKey, combined);
    res.json({ data: combined });
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
