import http from '../../request';
import { PageResult } from '@/service/types';

export type RegistryType = 'v2' | 'harbor' | 'acr';

export interface ImageRegistry {
  id: number;
  name: string;
  type: RegistryType;
  url: string;
  username?: string;
  access_key?: string;
  secret_key?: string;
  description?: string;
  createdAt?: string;
}

export const fetchImageRegistries = (params?: Record<string, unknown>) =>
  http.get<PageResult<ImageRegistry>>('/cicd/api/image-registries', params);

export const createImageRegistry = (data: { name: string; type: RegistryType; url: string; username?: string; password?: string; access_key?: string; secret_key?: string; description?: string }) =>
  http.post<ImageRegistry>('/cicd/api/image-registries', data);

export const updateImageRegistry = (id: number, data: Partial<ImageRegistry>) =>
  http.put<ImageRegistry>(`/cicd/api/image-registries/${id}`, data);

export const deleteImageRegistry = (id: number) =>
  http.delete(`/cicd/api/image-registries/${id}`);

export const fetchImageTags = (id: number, project: string, imageName: string) =>
  http.get<{ tags: string[] }>(`/cicd/api/image-registries/${id}/tags`, { project, imageName });

export const testImageRegistryConnection = (id: number) =>
  http.post<{ message: string }>(`/cicd/api/image-registries/${id}/connect`);
