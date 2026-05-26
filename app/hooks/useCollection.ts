import { useState, useEffect, useCallback } from 'react';
import { collectionService, CollectionItem } from '../services/collection';
import type { Card } from '../services/cards';

export function useCollection() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await collectionService.list();
      setItems(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar coleção');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addCard = useCallback(async (
    cardId: string,
    condition: CollectionItem['condition'] = 'NM',
    quantity = 1
  ) => {
    const res = await collectionService.add(cardId, condition, quantity);
    setItems(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  const removeCard = useCallback(async (itemId: string) => {
    await collectionService.remove(itemId);
    setItems(prev => prev.filter(i => i._id !== itemId));
  }, []);

  // Total de cartas únicas
  const totalUnique = items.length;
  // Total de exemplares
  const totalCards = items.reduce((sum, i) => sum + i.quantity, 0);
  // Valor total em USD (soma dos market prices)
  const totalValueUSD = items.reduce((sum, item) => {
    const card = item.cardId as Card;
    if (typeof card === 'string') return sum;
    const price = card.prices?.holofoil?.market ?? card.prices?.normal?.market ?? 0;
    return sum + (price ?? 0) * item.quantity;
  }, 0);

  return { items, loading, error, refetch: fetch, addCard, removeCard, totalUnique, totalCards, totalValueUSD };
}
