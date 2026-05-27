import http from '../../request';

export interface Component {
  component_id: number;
  component_name: string;
  comp_desc?: string;
  status?: string;
  group?: string;
  group_id?: number;
  ctime?: string;
  utime?: string;
}

export interface ComponentForm {
  component_name: string;
  comp_desc?: string;
  group_id: number;
}

export interface SyncComponentItem {
  component_name: string;
  comp_desc: string;
  group_name: string;
}

export const fetchComponents = (params?: Record<string, unknown>) =>
  http.get<{ total: number; records: Component[] }>('/rbac/components', params);

export const createComponent = (data: ComponentForm) =>
  http.post<Component>('/rbac/components', data);

export const updateComponent = (id: number, data: Partial<ComponentForm & { status?: string }>) =>
  http.put<Component>(`/rbac/components/${id}`, data);

export const deleteComponent = (id: number) =>
  http.delete(`/rbac/components/${id}`);

export const syncComponents = (items: SyncComponentItem[]) =>
  http.post<{ created: number; updated: number; skipped: number }>(
    '/rbac/components/sync',
    items
  );
