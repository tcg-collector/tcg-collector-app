import { Router, Request, Response } from 'express';
import { Card } from '../models/Card';

const router = Router();

// GET /api/sets - Lista todos os sets que têm cartas no banco
// Agrega direto da coleção Card para garantir consistência
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sets = await Card.aggregate([
      {
        $group: {
          _id:       '$set.id',
          name:      { $first: '$set.name' },
          series:    { $first: '$set.series' },
          images:    { $first: '$set.images' },
          cardCount: { $sum: 1 },
        }
      },
      { $sort: { name: 1 } },
    ]);
    res.json({ data: sets });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar sets' });
  }
});

export default router;
