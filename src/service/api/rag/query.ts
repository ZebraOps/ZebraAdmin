import http from '../../request';
import { localStg } from '@/utils/storage';
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

// SSE 事件类型
export type StreamEvent =
  | { type: 'retrieval_done'; sources: QuerySource[] }
  | { type: 'token'; content: string }
  | { type: 'done'; query_id: number }
  | { type: 'error'; message: string };

// API 方法
export const ragQuery = (data: QueryRequest) =>
  http.post<QueryResponse>('/rag/query', data);

/**
 * 流式 RAG 查询 — 使用 fetch + ReadableStream 逐 token 接收
 * 返回 AbortController 用于中止，以及一个异步迭代器用于读取事件
 */
export function ragQueryStream(data: QueryRequest): {
  abort: () => void;
  [Symbol.asyncIterator]: () => AsyncIterator<StreamEvent>;
} {
  const controller = new AbortController();

  async function* streamEvents(): AsyncIterator<StreamEvent> {
    const baseURL = (import.meta.env.VITE_BASE_URL || '').trim().replace(/\/$/, '') || '';
    const token = localStg.get<string>('token');

    let response: Response;
    try {
      response = await fetch(`${baseURL}/rag/query/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // 用户取消，静默结束
      }
      yield { type: 'error', message: `请求失败: ${(err as Error).message || String(err)}` };
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      yield {
        type: 'error',
        message: (errorData as { message?: string })?.message || `HTTP ${response.status}`,
      };
      return;
    }

    if (!response.body) {
      yield { type: 'error', message: '浏览器不支持流式响应' };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // 最后一个不完整行保留在 buffer 中
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const event = JSON.parse(dataStr) as StreamEvent;
              yield event;
            } catch {
              // 忽略解析失败的行
            }
          }
        }
      }

      // 处理剩余 buffer
      if (buffer.startsWith('data: ')) {
        try {
          const event = JSON.parse(buffer.slice(6)) as StreamEvent;
          yield event;
        } catch {
          // 忽略
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      yield { type: 'error', message: `流读取中断: ${(err as Error).message || String(err)}` };
    } finally {
      reader.releaseLock();
    }
  }

  return {
    abort: () => controller.abort(),
    [Symbol.asyncIterator]: () => streamEvents(),
  };
}

export const fetchQueryHistory = (params?: { page?: number; size?: number }) =>
  http.get<PageResult<QueryHistory>>('/rag/query/history', params as Record<string, unknown>);

export const fetchQueryHistoryDetail = (query_id: number) =>
  http.get<QueryHistory>(`/rag/query/history/${query_id}`);

export const submitFeedback = (query_id: number, data: FeedbackRequest) =>
  http.put<QueryHistory>(`/rag/query/history/${query_id}/feedback`, data);