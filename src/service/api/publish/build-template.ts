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

export interface LinkedApplication {
  id: number;
  repo_id: number;
  c_name: string;
  e_name: string;
  listen_port?: number;
  health_check_type?: string;
  health_check_url?: string;
  description?: string;
  department?: string;
  language?: string;
  deployment_count?: number;
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

/** 关联应用和构建模板 */
export const associateBuildTemplateApp = (templateId: number, applicationId: number) =>
  http.post<{ message: string }>(`/cicd/api/templates/build/${templateId}/applications/${applicationId}`);

/** 取消应用和构建模板关联 */
export const disassociateBuildTemplateApp = (templateId: number, applicationId: number) =>
  http.delete<{ message: string }>(`/cicd/api/templates/build/${templateId}/applications/${applicationId}`);

/** 获取构建模板关联的应用列表 */
export const fetchBuildTemplateApplications = (templateId: number) =>
  http.get<LinkedApplication[]>(`/cicd/api/templates/build/${templateId}/applications`);