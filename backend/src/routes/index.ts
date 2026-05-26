import { Router } from 'express';
import cardsRouter from './cards';
import setsRouter from './sets';
import collectionsRouter from './collections';
import pricesRouter from './prices';

const router = Router();

router.use('/cards', cardsRouter);
router.use('/sets', setsRouter);
router.use('/collections', collectionsRouter);
router.use('/prices', pricesRouter);

// Rota de teste da API
router.get('/', (_req, res) => {
  res.json({
    message: '🃏 Bindex TCG API',
    endpoints: [
      'GET /api/cards',
      'GET /api/cards/:id',
      'GET /api/sets',
      'GET /api/collections',
      'GET /api/prices/:cardId',
    ],
  });
});

export default router;
