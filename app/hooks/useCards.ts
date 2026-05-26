import { useState, useEffect, useCallback } from 'react';
import { cardsService, Card } from '../services/cards';

interface UseCardsOptions {
  name?: string;
  limit?: number;
  autoFetch?: boolean;
}

export function useCards(options: UseCardsOptions = {}) {
  const { name, limit = 20, autoFetch = true } = options;
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (searchName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await cardsService.list({ name: searchName ?? name, limit });
      setCards(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar cartas');
    } finally {
      setLoading(false);
    }
  }, [name, limit]);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [autoFetch, fetch]);

  return { cards, loading, error, refetch: fetch };
}

export function useCard(id: string) {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    cardsService.get(id)
      .then(res => setCard(res.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false));
  }, [id]);

  return { card, loading, error };
}
