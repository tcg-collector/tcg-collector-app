import { api } from './api';

export interface SetSummary {
  _id: string;    // set.id ex: "base1"
  name: string;   // ex: "Base Set"
  series: string; // ex: "Base"
  images: { symbol: string; logo: string };
  cardCount: number;
}

export const setsService = {
  list: () => api.get<{ data: SetSummary[] }>('/api/sets'),
};
