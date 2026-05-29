const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.15.31:3000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Getter de token — chamado antes de cada requisição para garantir token fresco
let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: (() => Promise<string | null>) | null) {
  _tokenGetter = getter;
}

// Mantido para compatibilidade
export function setAuthToken(_token: string | null) {
  // não faz mais nada — usar setTokenGetter
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Busca token fresco antes de cada requisição
  if (_tokenGetter) {
    const token = await _tokenGetter();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers, ...options });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error ?? response.statusText);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
