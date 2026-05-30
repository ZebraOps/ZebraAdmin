import http from '../../request';
import { PageResult } from '@/service/types';

export interface BuildTemplate {
  id: number;
  name: string;
  language?: string;
  department?: string;
  creator?: string;
  updater?: string;
  dockerfile?: string;
  pipeline?: string;
  created_at?: string;
  updated_at?: string;
}


export const fetchBuildTemplates = (params?: Record<string, unknown>) =>
  http.get<PageResult<BuildTemplate>>('/cicd/api/templates/build', params);

export const createBuildTemplate = (data: Omit<BuildTemplate, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<BuildTemplate>('/cicd/api/templates/build', data);

export const updateBuildTemplate = (id: number, data: Partial<BuildTemplate>) =>
  http.put<BuildTemplate>(`/cicd/api/templates/build/${id}`, data);

export const deleteBuildTemplate = (id: number) =>
  http.delete(`/cicd/api/templates/build/${id}`);

export const fetchBuildTemplateHistory = (id: number) =>
  http.get<unknown[]>(`/cicd/api/templates/build/${id}/history`);

/** 关联仓库和构建模板 */
export const associateBuildTemplateRepo = (templateId: number, repoId: number) =>
  http.post<{ message: string }>(`/cicd/api/templates/build/${templateId}/repos/${repoId}`);

/** 取消仓库和构建模板关联 */
export const disassociateBuildTemplateRepo = (templateId: number, repoId: number) =>
  http.delete<{ message: string }>(`/cicd/api/templates/build/${templateId}/repos/${repoId}`);
