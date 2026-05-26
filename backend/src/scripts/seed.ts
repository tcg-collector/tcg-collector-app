import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database';
import { syncFeaturedCards } from '../services/PokeTCGService';
import { getUSDtoBRL } from '../services/ExchangeRateService';

async function seed() {
  console.log('🌱 Iniciando seed do banco...');
  await connectDB();

  console.log('📥 Sincronizando cartas de destaque...');
  await syncFeaturedCards();

  console.log('💱 Buscando cotação USD→BRL...');
  const rate = await getUSDtoBRL();
  console.log(`   R$ ${rate.toFixed(2)}`);

  console.log('✅ Seed concluído!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
