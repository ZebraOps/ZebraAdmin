import http from '../../request';

export interface DeployTask {
  id: number;
  project_id: number;
  env_id: number;
  git_ref?: string;
  image_tag?: string;
  status?: string;
  k8s_cluster_id?: number;
  k8s_namespace?: string;
  jenkins_job_name?: string;
  harbor_project?: string;
  image_name?: string;
  deployment_name?: string;
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
  k8s_cluster_id: number;
  k8s_namespace?: string;
  jenkins_job_name: string;
  harbor_project: string;
  image_name: string;
  deployment_name?: string;
}

export const createDeployTask = (data: CreateDeployTaskRequest) =>
  http.post<{ task_id: number }>('/cicd/api/deploys', data);

export const getDeployTask = (id: number) =>
  http.get<DeployTask>(`/cicd/api/deploys/${id}`);
