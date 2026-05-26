import { useState, useEffect } from 'react';
import { exchangeService } from '../services/exchange';

export function useExchangeRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    exchangeService.getUSDtoBRL()
      .then(res => setRate(res.data.rate))
      .catch(() => setRate(5.72)) // fallback
      .finally(() => setLoading(false));
  }, []);

  return { rate, loading };
}
