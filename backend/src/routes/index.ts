import { Router } from 'express';
import cardsRouter from './cards';
import setsRouter from './sets';
import collectionsRouter from './collections';
import pricesRouter from './prices';
import bindersRouter from './binders';
import scanRouter from './scan';

const router = Router();

router.use('/cards', cardsRouter);
router.use('/sets', setsRouter);
router.use('/collections', collectionsRouter);
router.use('/prices', pricesRouter);
router.use('/binders', bindersRouter);
router.use('/scan', scanRouter);

router.get('/', (_req, res) => {
  res.json({
    message: '🃏 Bindex TCG API',
    endpoints: [
      'GET  /api/cards',
      'GET  /api/cards/:id',
      'GET  /api/sets',
      'GET  /api/collections/:userId',
      'POST /api/collections',
      'GET  /api/prices/exchange',
      'GET  /api/prices/:cardId',
      'GET  /api/binders',
      'POST /api/binders',
      'GET  /api/binders/:id',
      'PATCH /api/binders/:id/slots/:position',
      'DELETE /api/binders/:id',
      'POST /api/scan',
    ],
  });
});

export default router;
