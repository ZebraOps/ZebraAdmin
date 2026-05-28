import http from '../../request';

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
  platform?: string;
  created_at?: string;
  updated_at?: string;
}

type PageResult<T> = { total: number; records: T[] };

export const fetchRepos = (params?: Record<string, unknown>) =>
  http.get<PageResult<Repo>>('/cicd/api/repos', params);

export const createRepo = (data: Omit<Repo, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<Repo>('/cicd/api/repos', data);

export const updateRepo = (id: number, data: Partial<Repo>) =>
  http.put<Repo>(`/cicd/api/repos/${id}`, data);

export const deleteRepo = (id: number) =>
  http.delete(`/cicd/api/repos/${id}`);

/** 仓库上关联的构建模板简要信息 */
export interface RepoTemplate {
  id: number;
  name: string;
  language?: string;
  creator?: string;
  updater?: string;
  created_at?: string;
  updated_at?: string;
}

/** 获取仓库关联的构建模板列表 */
export const fetchRepoTemplates = (id: number) =>
  http.get<RepoTemplate[]>(`/cicd/api/repos/${id}/templates`);

/** 从 GitLab 获取仓库信息 */
export const fetchRepoGitlabUrl = (repoId: number | string) =>
  http.get<string>(`/cicd/api/repos/gitlab-url/${repoId}`);
