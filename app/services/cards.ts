import { api } from './api';

export interface CardPrice {
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
}

export interface Card {
  _id: string;
  name: string;
  number: string;
  rarity: string;
  supertype: string;
  subtypes: string[];
  types: string[];
  set: {
    id: string;
    name: string;
    series: string;
    images: { symbol: string; logo: string };
  };
  images: { small: string; large: string };
  prices: {
    normal?: CardPrice;
    holofoil?: CardPrice;
    reverseHolofoil?: CardPrice;
  };
  artist?: string;
  lastPriceSyncAt?: string;
}

export interface CardsResponse {
  data: Card[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface CardResponse {
  data: Card;
}

export const cardsService = {
  list: (params?: { name?: string; set?: string; setId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.name)  qs.set('name', params.name);
    if (params?.set)   qs.set('set', params.set);
    if (params?.setId) qs.set('setId', params.setId);
    if (params?.page)  qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs}` : '';
    return api.get<CardsResponse>(`/api/cards${query}`);
  },

  get: (id: string) => api.get<CardResponse>(`/api/cards/${id}`),
};
