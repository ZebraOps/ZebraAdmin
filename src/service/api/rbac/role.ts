import http from '../../request';

export interface Role {
  role_id: number;
  role_name: string;
  role_desc?: string;
  status?: string;
  group_id: number;
  group?: string;
  projects?: string;
  ctime?: string;
  utime?: string;
}

export interface RoleForm {
  role_name: string;
  role_desc?: string;
  status?: string;
  group_id: number;
  projects?: string;
}

export const fetchRoles = (params?: Record<string, unknown>) =>
  http.get<{ total: number; records: Role[] }>('/rbac/roles', params);

export const createRole = (data: RoleForm) =>
  http.post<Role>('/rbac/roles', data);

export const updateRole = (id: number, data: Partial<RoleForm>) =>
  http.put<Role>(`/rbac/roles/${id}`, data);

export const deleteRole = (id: number) =>
  http.delete(`/rbac/roles/${id}`);

export const fetchRoleUsers = (id: number) =>
  http.get<import('./user').User[]>(`/rbac/roles/${id}/users`);

export const addRoleUsers = (id: number, userIds: number[]) =>
  http.post(`/rbac/roles/${id}/users`, userIds);

export const removeRoleUsers = (id: number, userIds: number[]) =>
  http.delete(`/rbac/roles/${id}/users`, userIds);

export const fetchRoleMenus = (id: number) =>
  http.get<import('./menu').MenuItem[]>(`/rbac/roles/${id}/menus`);

export const addRoleMenus = (id: number, menuIds: number[]) =>
  http.post(`/rbac/roles/${id}/menus`, menuIds);

export const removeRoleMenus = (id: number, menuIds: number[]) =>
  http.delete(`/rbac/roles/${id}/menus`, menuIds);

export const fetchRoleComponents = (id: number) =>
  http.get<import('./component').Component[]>(`/rbac/roles/${id}/components`);

export const addRoleComponents = (id: number, componentIds: number[]) =>
  http.post(`/rbac/roles/${id}/components`, componentIds);

export const removeRoleComponents = (id: number, componentIds: number[]) =>
  http.delete(`/rbac/roles/${id}/components`, componentIds);

export const fetchRoleFunctions = (id: number) =>
  http.get<import('./function').FunctionItem[]>(`/rbac/roles/${id}/functions`);

export const addRoleFunctions = (id: number, functionIds: number[]) =>
  http.post(`/rbac/roles/${id}/functions`, functionIds);

export const removeRoleFunctions = (id: number, functionIds: number[]) =>
  http.delete(`/rbac/roles/${id}/functions`, functionIds);
