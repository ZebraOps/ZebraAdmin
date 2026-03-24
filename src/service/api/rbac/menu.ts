import http from '../../request';

export interface MenuItem {
  menu_id: number;
  menu_name: string;
  status?: string;
  path?: string;
  parent_id?: number;
  order_num?: number;
  icon?: string;
  ctime?: string;
  utime?: string;
  children?: MenuItem[];
}

export interface MenuForm {
  menu_name: string;
  status?: string;
  path?: string;
  parent_id?: number;
  order_num?: number;
  icon?: string;
}

export const fetchMenuTree = () =>
  http.get<MenuItem[]>('/rbac/menus/tree');

export const fetchMenus = (params?: Record<string, unknown>) =>
  http.get<{ total: number; records: MenuItem[] }>('/rbac/menus', params);

export const createMenu = (data: MenuForm) =>
  http.post<MenuItem>('/rbac/menus', data);

export const updateMenu = (id: number, data: Partial<MenuForm>) =>
  http.put<MenuItem>(`/rbac/menus/${id}`, data);

export const deleteMenu = (id: number) =>
  http.delete(`/rbac/menus/${id}`);
