import http from '../../request';

export interface User {
  user_id: number;
  username: string;
  nickname?: string;
  email?: string;
  tel?: string;
  wechat?: string;
  department?: string;
  gender?: string;
  avatar?: string;
  superuser?: string;
  status?: string;
  employee_id?: string;
  last_ip?: string;
  last_login?: string;
  disable_at?: string;
  ctime?: string;
  role_ids?: number[];
  job_ids?: number[];
}

export interface UserForm {
  username: string;
  password?: string;
  nickname?: string;
  email?: string;
  tel?: string;
  department?: string;
  superuser?: string;
  status?: string;
  role_ids?: number[];
  job_ids?: number[];
}

export interface ListParams {
  current?: number;
  size?: number;
  username?: string;
  nickname?: string;
  status?: string;
}

export const fetchUsers = (params?: ListParams) =>
  http.get<{ total: number; records: User[] }>('/rbac/users', params as Record<string, unknown>);

export const fetchUser = (id: number) =>
  http.get<User>(`/rbac/users/${id}`);

export const createUser = (data: UserForm) =>
  http.post<User>('/rbac/users', data);

export const updateUser = (id: number, data: Partial<UserForm>) =>
  http.put<User>(`/rbac/users/${id}`, data);

export const deleteUser = (id: number) =>
  http.delete(`/rbac/users/${id}`);
