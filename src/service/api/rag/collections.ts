import http from '../../request';
import type { PageResult } from '@/service/types';

/** 知识集合实体 */
export interface Collection {
  collection_id: number;
  name: string;
  description?: string;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  org_id?: number;
  created_by?: number;
  ctime: string;
}

/** 创建集合请求 */
export interface CollectionCreate {
  name: string;
  description?: string;
  embedding_model?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

/** 更新集合请求 */
export interface CollectionUpdate {
  name?: string;
  description?: string;
  embedding_model?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

/** 集合列表查询参数 */
export interface CollectionListParams {
  page?: number;
  size?: number;
}

/** Embedding 模型选项 */
export const EMBEDDING_MODEL_OPTIONS = [
  { label: 'OpenAI text-embedding-3-small', value: 'text-embedding-3-small' },
  { label: 'OpenAI text-embedding-3-large', value: 'text-embedding-3-large' },
  { label: '腾讯 CodingPlan glm-5', value: 'glm-5' }
];

// API 方法
export const fetchCollections = (params?: CollectionListParams) =>
  http.get<PageResult<Collection>>('/rag/collections', params as Record<string, unknown>);

export const getCollection = (collection_id: number) =>
  http.get<Collection>(`/rag/collections/${collection_id}`);

export const createCollection = (data: CollectionCreate) =>
  http.post<Collection>('/rag/collections', data);

export const updateCollection = (collection_id: number, data: Partial<CollectionUpdate>) =>
  http.put<Collection>(`/rag/collections/${collection_id}`, data);

export const deleteCollection = (collection_id: number) =>
  http.delete(`/rag/collections/${collection_id}`);