import http from '../../request';

export interface Repo {
  id: number;
  name: string;
  url: string;
  type?: string;
  branch?: string;
  description?: string;
  createdAt?: string;
}

export const fetchRepos = (params?: Record<string, unknown>) =>
  http.get<{ items: Repo[]; total: number }>('/cicd/api/repos', params);

export const createRepo = (data: { name: string; url: string; type?: string; branch?: string; description?: string }) =>
  http.post<Repo>('/cicd/api/repos', data);

export const updateRepo = (id: number, data: Partial<Repo>) =>
  http.put<Repo>(`/cicd/api/repos/${id}`, data);

export const deleteRepo = (id: number) =>
  http.delete(`/cicd/api/repos/${id}`);
