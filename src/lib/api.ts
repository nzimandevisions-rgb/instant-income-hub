const API_BASE = '';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function hasToken() {
  return Boolean(getToken());
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export async function api(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/auth';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const auth = {
  signup: (email: string, password: string) =>
    api('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => api('/api/auth/me'),
};

export const wallet = {
  balance: () => api('/api/wallet/balance'),
  transactions: () => api('/api/wallet/transactions'),
  withdraw: (amount_usd: number, method: string, destination: string) =>
    api('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount_usd, method, destination }),
    }),
};
