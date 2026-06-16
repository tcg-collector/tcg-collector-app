import { api } from './api';
import type { Card } from './cards';

export interface CollectionSummary {
  totalValueUSD: number;
  deltaUSD: number;
  deltaPct: number;
  days: number;
}

export interface CollectionGainerItem {
  card: Card;
  marketNow: number;
  marketThen: number;
  deltaPct: number;
  deltaAbs: number;
  condition: string;
}

export interface CollectionValueItem {
  card: Card;
  market: number;
  condition: string;
}

export const collectionMarketService = {
  async summary(days = 7): Promise<CollectionSummary> {
    const res = await api.get<{ data: CollectionSummary }>(`/api/collections/summary?days=${days}`);
    return res.data;
  },

  async topGainers(days = 7, limit = 5): Promise<CollectionGainerItem[]> {
    const res = await api.get<{ data: CollectionGainerItem[] }>(
      `/api/collections/top-gainers?days=${days}&limit=${limit}`
    );
    return res.data;
  },

  async topValue(limit = 5): Promise<CollectionValueItem[]> {
    const res = await api.get<{ data: CollectionValueItem[] }>(
      `/api/collections/top-value?limit=${limit}`
    );
    return res.data;
  },
};
