import http from '../../request';
import type { PageResult } from '@/service/types';

/** 查询请求 */
export interface QueryRequest {
  question: string;
  collection_ids?: number[];
  doc_types?: string[];
  top_k?: number;
}

/** 知识来源 */
export interface QuerySource {
  doc_id: number;
  content: string;
  chunk_index: number;
}

/** 查询响应 */
export interface QueryResponse {
  answer: string;
  sources: QuerySource[];
  query_id: number;
}

/** 查询历史记录 */
export interface QueryHistory {
  query_id: number;
  question: string;
  answer: string;
  sources?: QuerySource[];
  user_id?: number;
  ctime: string;
}

// API 方法
export const ragQuery = (data: QueryRequest) =>
  http.post<QueryResponse>('/rag/query', data);

export const fetchQueryHistory = (params?: { page?: number; size?: number }) =>
  http.get<PageResult<QueryHistory>>('/rag/query/history', params as Record<string, unknown>);