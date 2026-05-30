import http from '../../request';
import { PageResult } from '@/service/types';

export interface ImageRegistry {
  id: number;
  name: string;
  url: string;
  username?: string;
  description?: string;
  createdAt?: string;
}

export const fetchImageRegistries = (params?: Record<string, unknown>) =>
  http.get<PageResult<ImageRegistry>>('/cicd/api/image-registries', params);

export const createImageRegistry = (data: { name: string; url: string; username?: string; password?: string; description?: string }) =>
  http.post<ImageRegistry>('/cicd/api/image-registries', data);

export const updateImageRegistry = (id: number, data: Partial<ImageRegistry>) =>
  http.put<ImageRegistry>(`/cicd/api/image-registries/${id}`, data);

export const deleteImageRegistry = (id: number) =>
  http.delete(`/cicd/api/image-registries/${id}`);
