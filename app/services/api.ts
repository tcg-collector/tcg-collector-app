const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.15.31:3000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token cacheado + getter para refresh quando necessário
let _authToken: string | null = null;
let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function setTokenGetter(getter: (() => Promise<string | null>) | null) {
  _tokenGetter = getter;
}

async function getToken(): Promise<string | null> {
  if (_authToken) return _authToken;
  if (_tokenGetter) {
    const fresh = await _tokenGetter();
    if (fresh) _authToken = fresh;
    return fresh;
  }
  return null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = await getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { headers, ...options });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.error ?? response.statusText ?? `HTTP ${response.status}`;
    throw new ApiError(response.status, `[${response.status}] ${message}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
