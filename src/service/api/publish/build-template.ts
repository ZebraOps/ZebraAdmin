import http from '../../request';

export interface BuildTemplate {
  id: number;
  name: string;
  content: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchBuildTemplates = (params?: Record<string, unknown>) =>
  http.get<{ items: BuildTemplate[]; total: number }>('/cicd/api/templates/build', params);

export const createBuildTemplate = (data: { name: string; content: string; description?: string }) =>
  http.post<BuildTemplate>('/cicd/api/templates/build', data);

export const updateBuildTemplate = (id: number, data: Partial<BuildTemplate>) =>
  http.put<BuildTemplate>(`/cicd/api/templates/build/${id}`, data);

export const deleteBuildTemplate = (id: number) =>
  http.delete(`/cicd/api/templates/build/${id}`);

export const fetchBuildTemplateHistory = (id: number) =>
  http.get<unknown[]>(`/cicd/api/templates/build/${id}/history`);
