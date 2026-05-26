import { Router, Request, Response } from 'express';
import { getUSDtoBRL } from '../services/ExchangeRateService';
import { Card } from '../models/Card';

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
