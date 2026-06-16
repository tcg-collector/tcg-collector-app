import { api } from './api';
import type { Card } from './cards';

export interface GainerItem {
  card: Card;
  marketNow: number;
  marketThen: number;
  deltaPct: number;
  deltaAbs: number;
}

export interface ValueItem {
  card: Card;
  market: number;
}

export const pricesService = {
  async topGainers(days = 7, limit = 10): Promise<GainerItem[]> {
    const res = await api.get<{ data: GainerItem[] }>(
      `/api/prices/top-gainers?days=${days}&limit=${limit}`
    );
    return res.data;
  },

  async topValue(limit = 10): Promise<ValueItem[]> {
    const res = await api.get<{ data: ValueItem[] }>(`/api/prices/top-value?limit=${limit}`);
    return res.data;
  },
};
