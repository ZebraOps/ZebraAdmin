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
  registry_project?: string;
  image_name?: string;
  deployment_name?: string;
  build_template_id?: number | null;
  deployment_template_id?: number | null;
  docker_compose_path?: string;
  error_message?: string;
  retry_count?: number;
  log_path?: string;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
  updated_at?: string;
  is_rollback?: boolean;
  rollback_from?: number;
  // 执行方式相关
  execution_mode?: 'auto' | 'manual';
  schedule_type?: 'immediate' | 'scheduled';
  scheduled_at?: string;
  // 手动执行状态
  build_status?: 'pending' | 'ready' | 'executing' | 'done' | 'failed';
  deploy_status?: 'pending' | 'ready' | 'executing' | 'done' | 'failed';
  build_image_tag?: string;
  build_finished_at?: string;
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
  registry_project: string;
  image_name: string;
  deployment_name?: string;
  build_template_id?: number;
  deployment_template_id?: number;
  // 执行方式
  execution_mode?: 'auto' | 'manual';
  schedule_type?: 'immediate' | 'scheduled';
  scheduled_at?: string; // ISO datetime string
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

// 回滚相关 API
export const getRollbackHistory = (taskId: number, params?: { page?: number; size?: number }) =>
  http.get<PageResult<DeployTask>>(`/cicd/api/deploys/${taskId}/rollback-history`, params as Record<string, unknown>);

export const rollbackDeploy = (taskId: number, historyTaskId: number) =>
  http.post<{ task_id: number; image_tag: string; is_rollback: boolean; rollback_from: number }>(
    `/cicd/api/deploys/${taskId}/rollback`,
    { history_task_id: historyTaskId }
  );

// 手动触发相关 API
export const triggerBuild = (taskId: number) =>
  http.post<{ task_id: number; status: string; build_status: string; image_tag: string }>(
    `/cicd/api/deploys/${taskId}/trigger-build`
  );

export const triggerDeploy = (taskId: number) =>
  http.post<{ task_id: number; status: string; deploy_status: string }>(
    `/cicd/api/deploys/${taskId}/trigger-deploy`
  );

export const triggerAll = (taskId: number) =>
  http.post<{ task_id: number; status: string; build_status: string; deploy_status: string }>(
    `/cicd/api/deploys/${taskId}/trigger`
  );

export const cancelSchedule = (taskId: number) =>
  http.delete<{ message: string }>(`/cicd/api/deploys/${taskId}/cancel-schedule`);

export const listScheduledTasks = (params?: { page?: number; size?: number }) =>
  http.get<PageResult<DeployTask>>('/cicd/api/deploys/scheduled', params as Record<string, unknown>);