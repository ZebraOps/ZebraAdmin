import http from '../../request';
import { PageResult } from '@/service/types';

export interface Repo {
  id: number;
  repo_number?: string;
  c_name: string;
  e_name: string;
  repo_url?: string;
  repo_ssh_url?: string;
  repo_manager?: string;
  repo_department?: string;
  repo_language?: string;
  repo_desc?: string;
  repo_deploy_type?: string;
  repo_build_path?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchRepos = (params?: Record<string, unknown>) =>
  http.get<PageResult<Repo>>('/cicd/api/repos', params);

export const createRepo = (data: Omit<Repo, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<Repo>('/cicd/api/repos', data);

export const updateRepo = (id: number, data: Partial<Repo>) =>
  http.put<Repo>(`/cicd/api/repos/${id}`, data);

export const deleteRepo = (id: number) =>
  http.delete(`/cicd/api/repos/${id}`);

/** 从 GitLab 获取仓库信息 */
export const fetchRepoGitlabUrl = (repoId: number | string) =>
  http.get<string>(`/cicd/api/repos/gitlab-url/${repoId}`);

/** 通过应用ID获取关联仓库的分支列表 */
export const fetchRepoBranches = (applicationId: number) =>
  http.get<string[]>('/cicd/api/repos/branches', { application_id: applicationId });

/** 通过应用ID获取关联仓库的标签列表 */
export const fetchRepoTags = (applicationId: number) =>
  http.get<string[]>('/cicd/api/repos/tags', { application_id: applicationId });