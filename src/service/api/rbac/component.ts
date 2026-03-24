import http from '../../request';

export interface Component {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export const fetchComponents = (params?: Record<string, unknown>) =>
  http.get<{ items: Component[]; total: number }>('/rbac/components', params);

export const createComponent = (data: { name: string; code: string; description?: string }) =>
  http.post<Component>('/rbac/components', data);

export const updateComponent = (id: number, data: Partial<{ name: string; code: string; description: string }>) =>
  http.put<Component>(`/rbac/components/${id}`, data);

export const deleteComponent = (id: number) =>
  http.delete(`/rbac/components/${id}`);
