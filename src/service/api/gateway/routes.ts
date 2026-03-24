import http from '../../request';

export interface GatewayRoute {
  id: number;
  name: string;
  uri: string;
  predicates?: unknown[];
  filters?: unknown[];
  order?: number;
  enabled: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GatewayRouteForm {
  name: string;
  uri: string;
  predicates?: unknown[];
  filters?: unknown[];
  order?: number;
  description?: string;
}

export const fetchGatewayRoutes = (params?: Record<string, unknown>) =>
  http.get<{ items: GatewayRoute[]; total: number }>('/admin/routes', params);

export const createGatewayRoute = (data: GatewayRouteForm) =>
  http.post<GatewayRoute>('/admin/routes', data);

export const updateGatewayRoute = (id: number, data: Partial<GatewayRouteForm>) =>
  http.put<GatewayRoute>(`/admin/routes/${id}`, data);

export const deleteGatewayRoute = (id: number) =>
  http.delete(`/admin/routes/${id}`);

export const enableGatewayRoute = (id: number) =>
  http.post(`/admin/routes/${id}/enable`);

export const disableGatewayRoute = (id: number) =>
  http.post(`/admin/routes/${id}/disable`);

export const reloadGatewayRoutes = () =>
  http.post('/admin/routes/reload');
