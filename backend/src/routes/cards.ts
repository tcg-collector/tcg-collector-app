import { Router, Request, Response } from 'express';
import { Card } from '../models/Card';

const router = Router();

// GET /api/cards - Listar cartas (com paginação e filtros)
// Query params: name, setId, page, limit
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 40, setId, name } = req.query;
    const filter: Record<string, unknown> = {};

    if (setId) filter['set.id'] = setId;
    if (name)  filter.name = { $regex: name, $options: 'i' };

    const [cards, total] = await Promise.all([
      Card.find(filter)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ name: 1, number: 1 })
        .select('name number rarity supertype set images prices'),
      Card.countDocuments(filter),
    ]);

    res.json({
      data: cards,
      pagination: {
        page:  Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cartas' });
  }
});

// GET /api/cards/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) { res.status(404).json({ error: 'Carta não encontrada' }); return; }
    res.json({ data: card });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar carta' });
  }
});

export default router;
