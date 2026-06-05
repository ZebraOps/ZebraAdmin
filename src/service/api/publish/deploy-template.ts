import http from '../../request';
import { PageResult } from '@/service/types';
import type { LinkedApplication } from './build-template';

export interface DeployTemplate {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  template_type?: string;
  content?: string;
  variables?: string;
  version?: string;
  status?: string;
  creator?: string;
  updater?: string;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchDeployTemplates = (params?: Record<string, unknown>) =>
  http.get<PageResult<DeployTemplate>>('/cicd/api/templates/deployment', params);

export const createDeployTemplate = (data: Omit<DeployTemplate, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<DeployTemplate>('/cicd/api/templates/deployment', data);

export const updateDeployTemplate = (id: number, data: Partial<DeployTemplate>) =>
  http.put<DeployTemplate>(`/cicd/api/templates/deployment/${id}`, data);

export const deleteDeployTemplate = (id: number) =>
  http.delete(`/cicd/api/templates/deployment/${id}`);

export const fetchDeployTemplateHistory = (id: number, params?: Record<string, unknown>) =>
  http.get<PageResult<unknown>>(`/cicd/api/templates/deployment/${id}/history`, params);

/** 关联应用和部署模板 */
export const associateDeployTemplateApp = (templateId: number, applicationId: number) =>
  http.post<{ message: string }>(`/cicd/api/templates/deployment/${templateId}/applications/${applicationId}`);

/** 取消应用和部署模板关联 */
export const disassociateDeployTemplateApp = (templateId: number, applicationId: number) =>
  http.delete<{ message: string }>(`/cicd/api/templates/deployment/${templateId}/applications/${applicationId}`);

/** 获取部署模板关联的应用列表 */
export const fetchDeployTemplateApplications = (templateId: number) =>
  http.get<LinkedApplication[]>(`/cicd/api/templates/deployment/${templateId}/applications`);

/** 回退部署模板到指定历史版本 */
export const rollbackDeployTemplate = (templateId: number, historyId: number) =>
  http.post<DeployTemplate>(`/cicd/api/templates/deployment/${templateId}/rollback/${historyId}`);