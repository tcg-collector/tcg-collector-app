import { useState, useEffect } from 'react';
import { collectionMarketService, CollectionSummary, CollectionGainerItem, CollectionValueItem } from '../services/collection-market';
import { exchangeService } from '../services/exchange';

interface UseCollectionMarketOptions {
  skip?: boolean;
}

export function useCollectionMarket({ skip = false }: UseCollectionMarketOptions = {}) {
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [gainers, setGainers] = useState<CollectionGainerItem[]>([]);
  const [topValue, setTopValue] = useState<CollectionValueItem[]>([]);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (skip) return;
    setLoading(true);
    Promise.all([
      collectionMarketService.summary(),
      collectionMarketService.topGainers(),
      collectionMarketService.topValue(),
      exchangeService.getUSDtoBRL(),
    ])
      .then(([s, g, v, ex]) => {
        setSummary(s);
        setGainers(g);
        setTopValue(v);
        setRate(ex.data.rate);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [skip]);

  return { summary, gainers, topValue, rate, loading };
}
