import http from '../../request';
import type { PageResult } from '@/service/types';

/** 文档类型枚举 */
export type DocType = 'incident' | 'sop' | 'guide' | 'best_practice';
/** 文档状态枚举 */
export type DocStatus = 'draft' | 'published' | 'archived';
/** 严重等级枚举 */
export type Severity = 'P0' | 'P1' | 'P2' | 'P3';

/** 文档实体 */
export interface Document {
  doc_id: number;
  title: string;
  content: string;
  doc_type: DocType;
  status: DocStatus;
  severity?: Severity;
  affected_systems?: string[];
  tags?: string[];
  org_id?: number;
  author_id?: number;
  collection_id?: number;
  version: number;
  ctime: string;
  utime?: string;
}

/** 创建文档请求 */
export interface DocumentCreate {
  title: string;
  content: string;
  doc_type: DocType;
  status?: DocStatus;
  severity?: Severity;
  affected_systems?: string[];
  tags?: string[];
  org_id?: number;
  collection_id?: number;
}

/** 更新文档请求 */
export interface DocumentUpdate {
  title?: string;
  content?: string;
  doc_type?: DocType;
  status?: DocStatus;
  severity?: Severity;
  affected_systems?: string[];
  tags?: string[];
  collection_id?: number;
}

/** 文档列表查询参数 */
export interface DocumentListParams {
  doc_type?: DocType;
  status?: DocStatus;
  severity?: Severity;
  collection_id?: number;
  org_id?: number;
  page?: number;
  size?: number;
}

/** 文档类型配置 */
export const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string }> = {
  incident: { label: '故障案例', color: 'red' },
  sop: { label: '标准流程', color: 'blue' },
  guide: { label: '操作指南', color: 'cyan' },
  best_practice: { label: '最佳实践', color: 'green' }
};

/** 严重等级配置 */
export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string }> = {
  P0: { label: 'P0 - 紧急', color: 'red' },
  P1: { label: 'P1 - 高', color: 'orange' },
  P2: { label: 'P2 - 中', color: 'default' },
  P3: { label: 'P3 - 低', color: 'default' }
};

/** 状态配置 */
export const STATUS_CONFIG: Record<DocStatus, { label: string; status: string }> = {
  draft: { label: '草稿', status: 'Default' },
  published: { label: '已发布', status: 'Success' },
  archived: { label: '已归档', status: 'Processing' }
};

// API 方法
export const fetchDocuments = (params?: DocumentListParams) =>
  http.get<PageResult<Document>>('/rag/documents', params as Record<string, unknown>);

export const getDocument = (doc_id: number) =>
  http.get<Document>(`/rag/documents/${doc_id}`);

export const createDocument = (data: DocumentCreate) =>
  http.post<Document>('/rag/documents', data);

export const updateDocument = (doc_id: number, data: Partial<DocumentUpdate>) =>
  http.put<Document>(`/rag/documents/${doc_id}`, data);

export const deleteDocument = (doc_id: number) =>
  http.delete(`/rag/documents/${doc_id}`);