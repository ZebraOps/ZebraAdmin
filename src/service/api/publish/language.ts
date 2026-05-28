import http from '../../request';

export interface Language {
  id: number;
  name: string;
  display_name?: string;
  icon?: string;
  status?: string;
  sort_order?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

type PageResult<T> = { total: number; records: T[] };

export const fetchLanguages = (params?: Record<string, unknown>) =>
  http.get<PageResult<Language>>('/cicd/api/languages', params);

export const createLanguage = (data: Omit<Language, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<Language>('/cicd/api/languages', data);

export const updateLanguage = (id: number, data: Partial<Language>) =>
  http.put<Language>(`/cicd/api/languages/${id}`, data);

export const deleteLanguage = (id: number) =>
  http.delete(`/cicd/api/languages/${id}`);
