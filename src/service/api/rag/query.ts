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
  user_id?: number;
  query_text: string;
  answer_text?: string;
  source_docs?: number[];
  rating?: number;
  feedback?: string;
  ctime: string;
}

/** 反馈请求 */
export interface FeedbackRequest {
  rating: number; // 1-5
  feedback?: string;
}

// API 方法
export const ragQuery = (data: QueryRequest) =>
  http.post<QueryResponse>('/rag/query', data);

export const fetchQueryHistory = (params?: { page?: number; size?: number }) =>
  http.get<PageResult<QueryHistory>>('/rag/query/history', params as Record<string, unknown>);

export const fetchQueryHistoryDetail = (query_id: number) =>
  http.get<QueryHistory>(`/rag/query/history/${query_id}`);

export const submitFeedback = (query_id: number, data: FeedbackRequest) =>
  http.put<QueryHistory>(`/rag/query/history/${query_id}/feedback`, data);