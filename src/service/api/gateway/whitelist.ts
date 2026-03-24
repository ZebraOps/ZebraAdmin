import http from '../../request';

export interface Whitelist {
  id: number;
  path: string;
  description?: string;
  createdAt?: string;
}

export const fetchWhitelists = (params?: Record<string, unknown>) =>
  http.get<{ items: Whitelist[]; total: number }>('/admin/whitelists', params);

export const createWhitelist = (data: { path: string; description?: string }) =>
  http.post<Whitelist>('/admin/whitelists', data);

export const deleteWhitelist = (id: number) =>
  http.delete(`/admin/whitelists/${id}`);
