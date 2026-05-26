import { useState, useEffect, useCallback } from 'react';
import { binderService, Binder, GridConfig } from '../services/binders';

export function useBinders() {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await binderService.list();
      setBinders(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createBinder = useCallback(async (name: string, gridConfig: GridConfig, coverPhotoUrl?: string) => {
    const res = await binderService.create(name, gridConfig, coverPhotoUrl);
    setBinders(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  const deleteBinder = useCallback(async (id: string) => {
    await binderService.delete(id);
    setBinders(prev => prev.filter(b => b._id !== id));
  }, []);

  return { binders, loading, error, refetch: fetch, createBinder, deleteBinder };
}

export function useBinder(id: string) {
  const [binder, setBinder] = useState<Binder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await binderService.get(id);
      setBinder(res.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const setSlot = useCallback(async (position: number, data: { cardId?: string | null; condition?: string; quantity?: number }) => {
    const res = await binderService.setSlot(id, position, data);
    setBinder(res.data);
  }, [id]);

  return { binder, loading, refetch: fetch, setSlot };
}
