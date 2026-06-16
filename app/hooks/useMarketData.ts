import { useState, useEffect } from 'react';
import { pricesService, GainerItem, ValueItem } from '../services/prices';
import { exchangeService } from '../services/exchange';

export function useMarketData() {
  const [gainers, setGainers] = useState<GainerItem[]>([]);
  const [topValue, setTopValue] = useState<ValueItem[]>([]);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      pricesService.topGainers(),
      pricesService.topValue(),
      exchangeService.getUSDtoBRL(),
    ])
      .then(([g, v, ex]) => {
        setGainers(g);
        setTopValue(v);
        setRate(ex.data.rate);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { gainers, topValue, rate, loading, error };
}
