import http from '../../request';

export interface FunctionItem {
  func_id: number;
  func_name: string;
  uri?: string;
  status?: string;
  method_type?: string;
  group?: string;
  group_id: number;
  ctime?: string;
  utime?: string;
}

export interface FunctionForm {
  func_name: string;
  uri?: string;
  status?: string;
  method_type?: string;
  group_id: number;
}

export const fetchFunctions = (params?: Record<string, unknown>) =>
  http.get<{ total: number; records: FunctionItem[] }>('/rbac/functions', params);

export const createFunction = (data: FunctionForm) =>
  http.post<FunctionItem>('/rbac/functions', data);

export const updateFunction = (id: number, data: Partial<FunctionForm>) =>
  http.put<FunctionItem>(`/rbac/functions/${id}`, data);

export const deleteFunction = (id: number) =>
  http.delete(`/rbac/functions/${id}`);
