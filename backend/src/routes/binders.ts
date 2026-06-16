import { Router, Request, Response } from 'express';
import { Binder, GridConfig } from '../models/Binder';
import { Card } from '../models/Card';
import { requireAuth } from '../middleware/auth';
import { validateBinderCreate, validateSlotUpdate } from '../validation/schemas';

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
  const { data, errors } = validateBinderCreate(req.body);
  if (errors) { res.status(400).json({ errors }); return; }
  try {
    const binder = new Binder({ userId: req.userId, ...data });
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
    if (isNaN(pos)) { res.status(400).json({ error: 'Posição inválida' }); return; }

    const slot = binder.slots.find(s => s.position === pos);
    if (!slot) { res.status(404).json({ error: 'Slot não encontrado' }); return; }

    const { data: slotData, errors: slotErrors } = validateSlotUpdate(req.body);
    if (slotErrors) { res.status(400).json({ errors: slotErrors }); return; }
    const { cardId, condition, quantity, language } = slotData!;

    // Valida que o cardId existe no banco antes de salvar
    if (cardId !== undefined && cardId !== null) {
      const cardExists = await Card.exists({ _id: cardId });
      if (!cardExists) {
        res.status(400).json({ error: `Carta "${cardId}" não encontrada no banco. Sincronize o catálogo.` });
        return;
      }
      slot.cardId = cardId;
    } else if (cardId === null) {
      slot.cardId = null; // limpar slot é permitido
    }

    if (condition !== undefined)  slot.condition = condition;
    if (quantity !== undefined)   slot.quantity = quantity;
    if (language !== undefined)   slot.language = language;

    await binder.save();
    res.json({ data: await populateBinder(binder) });
  } catch (err) {
    console.error('❌ Erro ao atualizar slot:', err);
    res.status(500).json({ error: 'Erro ao atualizar slot' });
  }
});

// POST /api/binders/:id/pages — adiciona uma nova página ao binder
router.post('/:id/pages', async (req: Request, res: Response) => {
  try {
    const binder = await Binder.findOne({ _id: req.params.id, userId: req.userId });
    if (!binder) { res.status(404).json({ error: 'Binder não encontrado' }); return; }
    binder.pageCount = (binder.pageCount ?? 1) + 1;
    await binder.save(); // pre-save cria os novos slots automaticamente
    res.json({ data: await populateBinder(binder) });
  } catch (err) {
    console.error('❌ Erro ao adicionar página:', err);
    res.status(500).json({ error: 'Erro ao adicionar página' });
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
