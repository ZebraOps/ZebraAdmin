import http from '../../request';
import { PageResult } from '@/service/types';

export interface Application {
  id: number;
  repo_id?: number;
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


export const fetchApplications = (params?: Record<string, unknown>) =>
  http.get<PageResult<Application>>('/cicd/api/applications', params);

export const createApplication = (data: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'deployment_count'>) =>
  http.post<Application>('/cicd/api/applications', data);

export const updateApplication = (id: number, data: Partial<Application>) =>
  http.put<Application>(`/cicd/api/applications/${id}`, data);

export const deleteApplication = (id: number) =>
  http.delete(`/cicd/api/applications/${id}`);

/** 应用部署配置（应用 + 环境 + 构建模板 + 部署模板的纱带） */
export interface ApplicationDeployment {
  id: number;
  application_id: number;
  environment_id: number;
  build_source?: 'tag' | 'branch';
  description?: string;
  build_template_id?: number | null;
  deployment_template_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type ApplicationDeploymentRequest = Omit<ApplicationDeployment, 'id' | 'created_at' | 'updated_at'>;

/** 根据应用 ID 获取部署配置列表 */
export const listApplicationDeployments = (applicationId: number) =>
  http.get<ApplicationDeployment[]>('/cicd/api/application/template', { application_id: applicationId });

/** 根据环境 ID 获取部署配置列表 */
export const listDeploymentsByEnvironment = (environmentId: number) =>
  http.get<ApplicationDeployment[]>('/cicd/api/application/template/environment', { environment_id: environmentId });

export const getApplicationDeployment = (id: number) =>
  http.get<ApplicationDeployment>(`/cicd/api/application/template/${id}`);

export const createApplicationDeployment = (data: ApplicationDeploymentRequest) =>
  http.post<ApplicationDeployment>('/cicd/api/application/template', data);

export const updateApplicationDeployment = (id: number, data: Partial<ApplicationDeploymentRequest>) =>
  http.put<ApplicationDeployment>(`/cicd/api/application/template/${id}`, data);

export const deleteApplicationDeployment = (id: number) =>
  http.delete(`/cicd/api/application/template/${id}`);
