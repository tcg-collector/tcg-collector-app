import { Router, Request, Response } from 'express';
import { UserCollection } from '../models/UserCollection';
import { requireAuth } from '../middleware/auth';

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

// POST /api/collections — adiciona carta à coleção do usuário autenticado
router.post('/', async (req: Request, res: Response) => {
  try {
    const item = new UserCollection({ ...req.body, userId: req.userId });
    await item.save();
    res.status(201).json({ data: item });
  } catch {
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
