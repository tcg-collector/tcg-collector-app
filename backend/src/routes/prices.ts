import { Router, Request, Response } from 'express';
import { PriceHistory } from '../models/PriceHistory';
import { ExchangeRate } from '../models/ExchangeRate';

const router = Router();

// GET /api/prices/:cardId - Histórico de preços de uma carta
router.get('/:cardId', async (req: Request, res: Response) => {
  try {
    const prices = await PriceHistory.find({ cardId: req.params.cardId })
      .sort({ timestamp: -1 })
      .limit(30);

    const latestRate = await ExchangeRate.findOne({ pair: 'USD_BRL' })
      .sort({ timestamp: -1 });

    res.json({
      data: prices,
      exchangeRate: latestRate?.rate ?? null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar preços' });
  }
});

export default router;
