import http from '../../request';

export interface DeployTemplate {
  id: number;
  name: string;
  content: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchDeployTemplates = (params?: Record<string, unknown>) =>
  http.get<{ items: DeployTemplate[]; total: number }>('/cicd/api/templates/deployment', params);

export const createDeployTemplate = (data: { name: string; content: string; description?: string }) =>
  http.post<DeployTemplate>('/cicd/api/templates/deployment', data);

export const updateDeployTemplate = (id: number, data: Partial<DeployTemplate>) =>
  http.put<DeployTemplate>(`/cicd/api/templates/deployment/${id}`, data);

export const deleteDeployTemplate = (id: number) =>
  http.delete(`/cicd/api/templates/deployment/${id}`);

export const fetchDeployTemplateHistory = (id: number) =>
  http.get<unknown[]>(`/cicd/api/templates/deployment/${id}/history`);
