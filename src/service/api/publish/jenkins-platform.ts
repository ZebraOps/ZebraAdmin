import http from '../../request';
import { PageResult } from '@/service/types';

export interface JenkinsPlatform {
  id: number;
  name: string;
  display_name?: string;
  url?: string;
  username?: string;
  password?: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchJenkinsPlatforms = (params?: Record<string, unknown>) =>
  http.get<PageResult<JenkinsPlatform>>('/cicd/api/jenkins-platforms', params);

export const createJenkinsPlatform = (data: Omit<JenkinsPlatform, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<JenkinsPlatform>('/cicd/api/jenkins-platforms', data);

export const updateJenkinsPlatform = (id: number, data: Partial<JenkinsPlatform>) =>
  http.put<JenkinsPlatform>(`/cicd/api/jenkins-platforms/${id}`, data);

export const deleteJenkinsPlatform = (id: number) =>
  http.delete(`/cicd/api/jenkins-platforms/${id}`);

export const testJenkinsPlatformConnection = (id: number) =>
  http.post<{ message: string }>(`/cicd/api/jenkins-platforms/${id}/connect`);