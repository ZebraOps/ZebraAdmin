import http from '../../request';
import { PageResult } from '@/service/types';

export interface GitPlatform {
  id: number;
  name: string;
  platform_type?: string;
  url?: string;
  api_url?: string;
  auth_type?: string;
  auth_config?: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchGitPlatforms = (params?: Record<string, unknown>) =>
  http.get<PageResult<GitPlatform>>('/cicd/api/git-platforms', params);

export const createGitPlatform = (data: Omit<GitPlatform, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<GitPlatform>('/cicd/api/git-platforms', data);

export const updateGitPlatform = (id: number, data: Partial<GitPlatform>) =>
  http.put<GitPlatform>(`/cicd/api/git-platforms/${id}`, data);

export const deleteGitPlatform = (id: number) =>
  http.delete(`/cicd/api/git-platforms/${id}`);

export const testGitPlatformConnection = (id: number) =>
  http.post<{ message: string }>(`/cicd/api/git-platforms/${id}/connect`);

export const fetchGitPlatformProjects = (id: number, params?: Record<string, unknown>) =>
  http.get<any>(`/cicd/api/git-platforms/${id}/projects`, params);