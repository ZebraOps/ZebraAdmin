import http from '../../request';

export interface OrgNode {
  org_id: number;
  org_name: string;
  org_code?: string;
  org_type?: number;
  parent_id?: number;
  level?: number;
  order_num?: number;
  ctime?: string;
  utime?: string;
  children?: OrgNode[];
}

export interface OrgForm {
  org_name: string;
  org_code?: string;
  org_type?: number;
  parent_id?: number;
  order_num?: number;
}

export const fetchOrgTree = () =>
  http.get<OrgNode[]>('/rbac/organizations/tree');

export const fetchOrgs = (params?: Record<string, unknown>) =>
  http.get<{ total: number; records: OrgNode[] }>('/rbac/organizations', params);

export const createOrg = (data: OrgForm) =>
  http.post<OrgNode>('/rbac/organizations', data);

export const updateOrg = (id: number, data: Partial<OrgForm>) =>
  http.put<OrgNode>(`/rbac/organizations/${id}`, data);

export const deleteOrg = (id: number) =>
  http.delete(`/rbac/organizations/${id}`);

export const fetchOrgUsers = (orgId: number) =>
  http.get<{ total: number; records: unknown[] }>(`/rbac/organizations/${orgId}/users`);
