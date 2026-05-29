import { api } from './api';
import type { Card } from './cards';

export interface CollectionItem {
  _id: string;
  userId: string;
  cardId: Card | string;
  quantity: number;
  condition: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
  language: 'PT' | 'EN' | 'JP';
  binder?: string;
  notes?: string;
  addedAt: string;
}

export interface CollectionResponse {
  data: CollectionItem[];
}

// userId vem do token JWT — o backend usa req.userId
export const collectionService = {
  list: () => api.get<CollectionResponse>('/api/collections'),

  add: (cardId: string, condition: CollectionItem['condition'] = 'NM', quantity = 1) =>
    api.post<{ data: CollectionItem }>('/api/collections', {
      cardId,
      condition,
      quantity,
      language: 'EN',
    }),

  remove: (id: string) => api.delete<{ message: string }>(`/api/collections/${id}`),
};
