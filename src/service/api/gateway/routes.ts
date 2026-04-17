import http from '../../request';

export interface GatewayRoute {
  ID: number;
  prefix: string;
  target: string;
  rewrite?: string;
  enabled: boolean;
  description?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface GatewayRouteForm {
  prefix: string;
  target: string;
  rewrite?: string;
  description?: string;
}

export const fetchGatewayRoutes = (params?: Record<string, unknown>) =>
  http.get<GatewayRoute[]>('/admin/routes', params);

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
