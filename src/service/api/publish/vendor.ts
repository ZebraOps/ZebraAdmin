import http from '../../request';
import { PageResult } from '@/service/types';

export interface Vendor {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  provider?: string;
  region?: string;
  access_key?: string;
  secret_key?: string;
  endpoint?: string;
  config?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}


export const fetchVendors = (params?: Record<string, unknown>) =>
  http.get<PageResult<Vendor>>('/cicd/api/vendors', params);

export const createVendor = (data: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<Vendor>('/cicd/api/vendors', data);

export const updateVendor = (id: number, data: Partial<Vendor>) =>
  http.put<Vendor>(`/cicd/api/vendors/${id}`, data);

export const deleteVendor = (id: number) =>
  http.delete(`/cicd/api/vendors/${id}`);
