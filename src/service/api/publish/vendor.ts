import http from '../../request';

export interface Vendor {
  id: number;
  name: string;
  type: string;
  description?: string;
  createdAt?: string;
}

export const fetchVendors = (params?: Record<string, unknown>) =>
  http.get<{ items: Vendor[]; total: number }>('/cicd/api/vendors', params);

export const createVendor = (data: { name: string; type: string; description?: string }) =>
  http.post<Vendor>('/cicd/api/vendors', data);

export const updateVendor = (id: number, data: Partial<Vendor>) =>
  http.put<Vendor>(`/cicd/api/vendors/${id}`, data);

export const deleteVendor = (id: number) =>
  http.delete(`/cicd/api/vendors/${id}`);
