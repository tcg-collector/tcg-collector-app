import axios from 'axios';
import { ExchangeRate } from '../models/ExchangeRate';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

/** Retorna cotação USD→BRL, com cache no MongoDB de 1h */
export async function getUSDtoBRL(): Promise<number> {
  // Tenta cache
  const cached = await ExchangeRate.findOne({ pair: 'USD-BRL' }).sort({ timestamp: -1 });
  if (cached && Date.now() - cached.timestamp.getTime() < CACHE_TTL_MS) {
    return cached.rate;
  }

  // Busca rate fresco
  try {
    // API pública sem key: open.er-api.com
    const response = await axios.get<{ rates: Record<string, number> }>(
      'https://open.er-api.com/v6/latest/USD',
      { timeout: 8000 }
    );
    const rate = response.data.rates['BRL'];

    await ExchangeRate.create({ pair: 'USD-BRL', rate, timestamp: new Date() });
    console.log(`Taxa USD->BRL atualizada: ${rate}`);
    return rate;
  } catch (err) {
    // Fallback: retorna cached mesmo expirado, ou valor fixo
    if (cached) return cached.rate;
    return 5.72; // fallback hardcoded
  }
}
