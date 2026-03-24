import http from '../../request';

export interface FunctionItem {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export const fetchFunctions = (params?: Record<string, unknown>) =>
  http.get<{ items: FunctionItem[]; total: number }>('/rbac/functions', params);

export const createFunction = (data: { name: string; code: string; description?: string }) =>
  http.post<FunctionItem>('/rbac/functions', data);

export const updateFunction = (id: number, data: Partial<{ name: string; code: string; description: string }>) =>
  http.put<FunctionItem>(`/rbac/functions/${id}`, data);

export const deleteFunction = (id: number) =>
  http.delete(`/rbac/functions/${id}`);
