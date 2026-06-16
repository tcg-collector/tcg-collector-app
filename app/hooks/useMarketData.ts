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
    Promise.allSettled([
      pricesService.topGainers(),
      pricesService.topValue(),
      exchangeService.getUSDtoBRL(),
    ])
      .then(([g, v, ex]) => {
        if (g.status === 'fulfilled') setGainers(g.value);
        if (v.status === 'fulfilled') setTopValue(v.value);
        if (ex.status === 'fulfilled') setRate(ex.value.data.rate);
        if (g.status === 'rejected' && v.status === 'rejected') setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return { gainers, topValue, rate, loading, error };
}
