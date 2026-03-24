import http from '../../request';

export interface Environment {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
}

export const fetchEnvironments = (params?: Record<string, unknown>) =>
  http.get<{ items: Environment[]; total: number }>('/cicd/api/environments', params);

export const createEnvironment = (data: { name: string; code: string; description?: string }) =>
  http.post<Environment>('/cicd/api/environments', data);

export const updateEnvironment = (id: number, data: Partial<Environment>) =>
  http.put<Environment>(`/cicd/api/environments/${id}`, data);

export const deleteEnvironment = (id: number) =>
  http.delete(`/cicd/api/environments/${id}`);
