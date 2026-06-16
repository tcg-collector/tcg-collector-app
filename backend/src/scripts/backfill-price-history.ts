/**
 * Backfill de histórico de preços — popula PriceHistory com os últimos N dias
 * usando o preço atual de cada Card como proxy.
 *
 * Uso:
 *   npx ts-node -e "require('dotenv').config()" src/scripts/backfill-price-history.ts
 * ou via npm script:
 *   npm run backfill
 *
 * Seguro para rodar múltiplas vezes (upsert idempotente por cardId+date).
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Card } from '../models/Card';
import { PriceHistory } from '../models/PriceHistory';
import { getBestMarket, startOfDay } from '../services/priceUtils';

const DAYS_BACK = 7;
const BATCH_SIZE = 500;

async function backfill() {
  await connectDB();

  console.log(`📦 Carregando cartas com preço do banco...`);
  const cards = await Card.find({}, { _id: 1, prices: 1 }).lean();
  console.log(`   ${cards.length} cartas encontradas`);

  // Filtra só as que têm preço de mercado
  const withPrice = cards
    .map(c => ({ cardId: c._id as string, market: getBestMarket(c.prices as Parameters<typeof getBestMarket>[0]) }))
    .filter((c): c is { cardId: string; market: number } => c.market !== null && c.market > 0);

  console.log(`   ${withPrice.length} cartas com preço válido`);

  // Gera os dias alvo (D-7 até D-1 — hoje já é inserido pelo cron diário)
  const targetDates: Date[] = [];
  for (let i = 1; i <= DAYS_BACK; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    targetDates.push(startOfDay(d));
  }

  console.log(`\n📅 Inserindo snapshots para ${targetDates.length} dias:`);
  for (const date of targetDates) {
    console.log(`   ${date.toISOString().slice(0, 10)}`);
  }

  let total = 0;

  for (const date of targetDates) {
    const ops = withPrice.map(c => ({
      updateOne: {
        filter: { cardId: c.cardId, date },
        update: { $setOnInsert: { cardId: c.cardId, date, market: c.market } },
        upsert: true,
      },
    }));

    // Processa em lotes para não sobrecarregar o Atlas M0
    for (let i = 0; i < ops.length; i += BATCH_SIZE) {
      const batch = ops.slice(i, i + BATCH_SIZE);
      await PriceHistory.bulkWrite(batch, { ordered: false });
      total += batch.length;
    }

    console.log(`   ✅ ${date.toISOString().slice(0, 10)} — ${withPrice.length} snapshots`);
  }

  const count = await PriceHistory.countDocuments();
  console.log(`\n✅ Backfill concluído — ${total} ops, ${count} documentos totais em PriceHistory`);

  await mongoose.disconnect();
  process.exit(0);
}

backfill().catch(err => {
  console.error('❌ Erro no backfill:', err);
  process.exit(1);
});
