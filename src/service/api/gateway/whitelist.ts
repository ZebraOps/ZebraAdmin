import http from '../../request';

export interface Whitelist {
  ID: number;
  method: string;
  path: string;
  description?: string;
  CreatedAt?: string;
}

export interface WhitelistForm {
  method: string;
  path: string;
  description?: string;
}

export const fetchWhitelists = (params?: Record<string, unknown>) =>
  http.get<Whitelist[]>('/admin/whitelists', params);

export const createWhitelist = (data: WhitelistForm) =>
  http.post<Whitelist>('/admin/whitelists', data);

export const deleteWhitelist = (id: number) =>
  http.delete(`/admin/whitelists/${id}`);
