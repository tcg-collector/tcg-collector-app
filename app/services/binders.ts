import { api } from './api';

export type GridConfig = '2x2' | '3x3' | '3x4' | '4x4';
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

export interface BinderSlot {
  position: number;
  cardId: string | null;
  condition: CardCondition;
  quantity: number;
  language: 'PT' | 'EN' | 'JP';
  card?: {
    _id: string;
    name: string;
    images: { small: string; large: string };
    prices: { normal?: { market: number | null }; holofoil?: { market: number | null } };
    set: { name: string };
  } | null;
}

export interface Binder {
  _id: string;
  name: string;
  coverPhotoUrl?: string;
  gridConfig: GridConfig;
  slots: BinderSlot[];
  createdAt: string;
}

export const GRID_CONFIGS: { value: GridConfig; label: string; cols: number; rows: number }[] = [
  { value: '2x2', label: '2 × 2', cols: 2, rows: 2 },
  { value: '3x3', label: '3 × 3', cols: 3, rows: 3 },
  { value: '3x4', label: '3 × 4', cols: 3, rows: 4 },
  { value: '4x4', label: '4 × 4', cols: 4, rows: 4 },
];

export const binderService = {
  list: () => api.get<{ data: Binder[] }>('/api/binders'),
  get:  (id: string) => api.get<{ data: Binder }>(`/api/binders/${id}`),
  create: (name: string, gridConfig: GridConfig, coverPhotoUrl?: string) =>
    api.post<{ data: Binder }>('/api/binders', { name, gridConfig, coverPhotoUrl }),
  delete: (id: string) => api.delete<{ message: string }>(`/api/binders/${id}`),
  setSlot: (binderId: string, position: number, data: {
    cardId?: string | null;
    condition?: CardCondition;
    quantity?: number;
  }) => api.patch<{ data: Binder }>(`/api/binders/${binderId}/slots/${position}`, data),
};

export const scanService = {
  scan: (imageBase64: string) =>
    api.post<{
      data: {
        identified: { name: string; set: string; condition: string; conditionReason: string; confidence: number };
        candidates: { _id: string; name: string; images: { small: string; large: string }; set: { name: string } }[];
      };
    }>('/api/scan', { image: imageBase64 }),
};
