import { api } from './api';

interface ExchangeResponse {
  data: { pair: string; rate: number };
}

export const exchangeService = {
  getUSDtoBRL: () => api.get<ExchangeResponse>('/api/prices/exchange'),
};
