import { Router, Request, Response } from 'express';
import { Binder, GridConfig } from '../models/Binder';
import { Card } from '../models/Card';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Todas as rotas de binder exigem autenticação
router.use(requireAuth);

// Helper: popula slots com dados das cartas
async function populateBinder(b: InstanceType<typeof Binder>) {
  const cardIds = b.slots.map(s => s.cardId).filter(Boolean) as string[];
  const cards = cardIds.length
    ? await Card.find({ _id: { $in: cardIds } }).select('name images prices set rarity number').lean()
    : [];
  const cardMap = Object.fromEntries(cards.map(c => [c._id as string, c]));
  const binderObj = b.toObject() as any;
  return {
    ...binderObj,
    slots: binderObj.slots.map((s: any) => ({
      ...s,
      card: s.cardId ? cardMap[s.cardId] ?? null : null,
    })),
  };
}

// GET /api/binders
router.get('/', async (req: Request, res: Response) => {
  try {
    const binders = await Binder.find({ userId: req.userId }).sort({ createdAt: -1 });
    const populated = await Promise.all(binders.map(populateBinder));
    res.json({ data: populated });
  } catch {
    res.status(500).json({ error: 'Erro ao listar binders' });
  }
});

// POST /api/binders
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, gridConfig = '3x3', coverPhotoUrl } = req.body as {
      name: string; gridConfig?: GridConfig; coverPhotoUrl?: string;
    };
    if (!name) { res.status(400).json({ error: 'Nome obrigatório' }); return; }
    const binder = new Binder({ userId: req.userId, name, gridConfig, coverPhotoUrl });
    await binder.save();
    res.status(201).json({ data: await populateBinder(binder) });
  } catch {
    res.status(500).json({ error: 'Erro ao criar binder' });
  }
});

// GET /api/binders/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const binder = await Binder.findOne({ _id: req.params.id, userId: req.userId });
    if (!binder) { res.status(404).json({ error: 'Binder não encontrado' }); return; }
    res.json({ data: await populateBinder(binder) });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar binder' });
  }
});

// PATCH /api/binders/:id/slots/:position
router.patch('/:id/slots/:position', async (req: Request, res: Response) => {
  try {
    const binder = await Binder.findOne({ _id: req.params.id, userId: req.userId });
    if (!binder) { res.status(404).json({ error: 'Binder não encontrado' }); return; }
    const pos = parseInt(req.params.position, 10);
    const slot = binder.slots.find(s => s.position === pos);
    if (!slot) { res.status(404).json({ error: 'Slot não encontrado' }); return; }
    const { cardId, condition, quantity, language } = req.body;
    if (cardId !== undefined) slot.cardId = cardId;
    if (condition)            slot.condition = condition;
    if (quantity)             slot.quantity = quantity;
    if (language)             slot.language = language;
    await binder.save();
    res.json({ data: await populateBinder(binder) });
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar slot' });
  }
});

// DELETE /api/binders/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Binder.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Binder excluído' });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir binder' });
  }
});

export default router;
