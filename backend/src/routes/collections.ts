import { Router, Request, Response } from 'express';
import { UserCollection } from '../models/UserCollection';

const router = Router();

// GET /api/collections/:userId - Coleção de um usuário
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const items = await UserCollection.find({ userId: req.params.userId })
      .populate('cardId')
      .sort({ addedAt: -1 });

    res.json({ data: items });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar coleção' });
  }
});

// POST /api/collections - Adicionar carta à coleção
router.post('/', async (req: Request, res: Response) => {
  try {
    const item = new UserCollection(req.body);
    await item.save();
    res.status(201).json({ data: item });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar carta' });
  }
});

// DELETE /api/collections/:id - Remover carta da coleção
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await UserCollection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Carta removida da coleção' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover carta' });
  }
});

export default router;
