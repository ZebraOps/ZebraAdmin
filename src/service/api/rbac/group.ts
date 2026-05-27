import http from '../../request';

export interface Group {
  group_id: number;
  group_name: string;
  description?: string;
  status?: string;
  ctime?: string;
  utime?: string;
}

export interface GroupForm {
  group_name: string;
  description?: string;
  status?: string;
}

export const fetchGroups = (params?: Record<string, unknown>) =>
  http.get<{ total: number; records: Group[] }>('/rbac/groups', params);

export const createGroup = (data: GroupForm) =>
  http.post<Group>('/rbac/groups', data);

export const updateGroup = (id: number, data: Partial<GroupForm>) =>
  http.put<Group>(`/rbac/groups/${id}`, data);

export const deleteGroup = (id: number) =>
  http.delete(`/rbac/groups/${id}`);
