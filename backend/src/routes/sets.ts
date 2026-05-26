import { Router, Request, Response } from 'express';
import { Set } from '../models/Set';

const router = Router();

// GET /api/sets - Listar todos os sets
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sets = await Set.find().sort({ releaseDate: -1 });
    res.json({ data: sets });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar sets' });
  }
});

// GET /api/sets/:id - Detalhe de um set
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const set = await Set.findOne({ apiId: req.params.id });
    if (!set) {
      res.status(404).json({ error: 'Set não encontrado' });
      return;
    }
    res.json({ data: set });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar set' });
  }
});

export default router;
