import http from '../../request';
import { PageResult } from '@/service/types';

export interface Environment {
  id: number;
  name: string;
  description?: string;
  type?: string;
  status?: string;
  config?: string;
  created_at?: string;
  updated_at?: string;
}


export const fetchEnvironments = (params?: Record<string, unknown>) =>
  http.get<PageResult<Environment>>('/cicd/api/environments', params);

export const createEnvironment = (data: Omit<Environment, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<Environment>('/cicd/api/environments', data);

export const updateEnvironment = (id: number, data: Partial<Environment>) =>
  http.put<Environment>(`/cicd/api/environments/${id}`, data);

export const deleteEnvironment = (id: number) =>
  http.delete(`/cicd/api/environments/${id}`);
