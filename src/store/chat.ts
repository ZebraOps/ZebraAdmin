import { create } from 'zustand';
import type { QuerySource, TokenUsage } from '@/service/api/rag/query';

const STORAGE_KEY = 'zebra_admin_chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: QuerySource[];
  queryId?: number;
  model?: string;
  usage?: TokenUsage;
  feedbackRating?: number;
  feedbackSubmitted?: boolean;
  timestamp: Date;
  loading?: boolean;
  streaming?: boolean;
}

type MessagesUpdater = ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]);

interface ChatState {
  messages: ChatMessage[];
  input: string;
  setMessages: (updater: MessagesUpdater) => void;
  setInput: (input: string) => void;
  clearChat: () => void;
}

/** 从 localStorage 恢复消息，还原 Date 类型 */
function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ChatMessage[];
    return arr.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

/** 持久化消息到 localStorage（debounce：流式更新时 500ms 写一次） */
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persistMessages(messages: ChatMessage[]) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // localStorage 满或不可用，静默忽略
    }
  }, 500);
}

/** 立即持久化（清空时调用，不能延迟） */
function flushPersist(messages: ChatMessage[]) {
  if (persistTimer) clearTimeout(persistTimer);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* ignore */ }
}

export const useChatStore = create<ChatState>((set) => ({
  messages: loadMessages(),
  input: '',

  setMessages: (updater) =>
    set((state) => {
      const next =
        typeof updater === 'function' ? updater(state.messages) : updater;
      persistMessages(next);
      return { messages: next };
    }),
  setInput: (input) => set({ input }),
  clearChat: () => {
    flushPersist([]);
    set({ messages: [], input: '' });
  },
}));
