import http from '../../request';
import { PageResult } from '@/service/types';

export interface DeployTask {
  id: number;
  project_id: number;
  env_id: number;
  git_ref?: string;
  image_tag?: string;
  status?: string;
  deploy_type?: string;
  deploy_target?: 'k8s' | 'docker' | 'linux';
  k8s_cluster_id?: number;
  k8s_namespace?: string;
  server_id?: number;
  deploy_path?: string;
  jenkins_job_name?: string;
  jenkins_build_number?: number;
  harbor_project?: string;
  image_name?: string;
  deployment_name?: string;
  build_template_id?: number | null;
  deployment_template_id?: number | null;
  docker_compose_path?: string;
  error_message?: string;
  retry_count?: number;
  log_path?: string;
  started_at?: string;
  finished_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDeployTaskRequest {
  project_id: number;
  env_id: number;
  git_ref: string;
  deploy_target: 'k8s' | 'docker' | 'linux';
  deploy_type?: string; // 兼容旧后端
  // k8s-specific
  k8s_cluster_id?: number;
  k8s_namespace?: string;
  // docker/linux-specific
  server_id?: number;
  // linux-specific
  deploy_path?: string;
  // common
  jenkins_job_name: string;
  harbor_project: string;
  image_name: string;
  deployment_name?: string;
  build_template_id?: number;
  deployment_template_id?: number;
}

export interface ListDeployTasksParams {
  status?: string;
  project_id?: number;
  page?: number;
  size?: number;
}

export interface TemplatesForTask {
  build_templates: { id: number; name: string; language?: string; department?: string }[];
  deployment_templates: { id: number; name: string; template_type?: string; display_name?: string }[];
}

export const listDeployTasks = (params?: ListDeployTasksParams) =>
  http.get<PageResult<DeployTask>>('/cicd/api/deploys', params as Record<string, unknown>);

export const createDeployTask = (data: CreateDeployTaskRequest) =>
  http.post<{ task_id: number }>('/cicd/api/deploys', data);

export const getDeployTask = (id: number) =>
  http.get<DeployTask>(`/cicd/api/deploys/${id}`);

export const getAvailableTemplates = (appId: number) =>
  http.get<TemplatesForTask>('/cicd/api/deploys/templates', { app_id: String(appId) } as Record<string, unknown>);

export const getTaskConsole = (id: number) =>
  http.get<{ output: string; status: string; error?: string }>(`/cicd/api/deploys/${id}/console`);

export const deleteDeployTask = (id: number) =>
  http.delete<void>(`/cicd/api/deploys/${id}`);

export const batchDeleteDeployTasks = (ids: number[]) =>
  http.post<{ message: string }>('/cicd/api/deploys/batch-delete', { ids });

export const retryDeployTask = (id: number) =>
  http.post<{ task_id: number; retry_count: number }>(`/cicd/api/deploys/${id}/retry`);