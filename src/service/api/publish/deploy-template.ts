import http from '../../request';

export interface DeployTemplate {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  template_type?: string;
  content?: string;
  variables?: string;
  parameters?: string;
  version?: string;
  status?: string;
  creator?: string;
  updater?: string;
  created_at?: string;
  updated_at?: string;
}

type PageResult<T> = { total: number; records: T[] };

export const fetchDeployTemplates = (params?: Record<string, unknown>) =>
  http.get<PageResult<DeployTemplate>>('/cicd/api/templates/deployment', params);

export const createDeployTemplate = (data: Omit<DeployTemplate, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<DeployTemplate>('/cicd/api/templates/deployment', data);

export const updateDeployTemplate = (id: number, data: Partial<DeployTemplate>) =>
  http.put<DeployTemplate>(`/cicd/api/templates/deployment/${id}`, data);

export const deleteDeployTemplate = (id: number) =>
  http.delete(`/cicd/api/templates/deployment/${id}`);

export const fetchDeployTemplateHistory = (id: number) =>
  http.get<unknown[]>(`/cicd/api/templates/deployment/${id}/history`);

/** 部署模板关联的仓库信息 */
export interface DeployTemplateRepo {
  id: number;
  c_name: string;
  e_name: string;
  repo_url?: string;
  platform?: string;
  repo_language?: string;
}

/** 获取部署模板关联的仓库列表 */
export const fetchReposByDeployTemplate = (id: number) =>
  http.get<DeployTemplateRepo[]>(`/cicd/api/templates/deployment/${id}/repos`);

/** 关联仓库和部署模板 */
export const associateDeployTemplateRepo = (templateId: number, repoId: number) =>
  http.post<{ message: string }>(`/cicd/api/templates/deployment/${templateId}/repos/${repoId}`);

/** 取消仓库和部署模板关联 */
export const disassociateDeployTemplateRepo = (templateId: number, repoId: number) =>
  http.delete<{ message: string }>(`/cicd/api/templates/deployment/${templateId}/repos/${repoId}`);
