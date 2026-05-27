import http from '../../request';

export interface Application {
  id: number;
  name: string;
  description?: string;
  repoId?: number;
  status?: number;
  createdAt?: string;
}

export const fetchApplications = (params?: Record<string, unknown>) =>
  http.get<{ items: Application[]; total: number }>('/cicd/api/applications', params);

export const createApplication = (data: { name: string; description?: string; repoId?: number }) =>
  http.post<Application>('/cicd/api/applications', data);

export const updateApplication = (id: number, data: Partial<Application>) =>
  http.put<Application>(`/cicd/api/applications/${id}`, data);

export const deleteApplication = (id: number) =>
  http.delete(`/cicd/api/applications/${id}`);

export const fetchApplicationTemplates = (params?: Record<string, unknown>) =>
  http.get<{ items: unknown[]; total: number }>('/cicd/api/application/template', params);

export const createApplicationTemplate = (data: unknown) =>
  http.post('/cicd/api/application/template', data);

export const updateApplicationTemplate = (id: number, data: unknown) =>
  http.put(`/cicd/api/application/template/${id}`, data);

export const deleteApplicationTemplate = (id: number) =>
  http.delete(`/cicd/api/application/template/${id}`);
