import http from '../../request';

export interface Position {
  position_id: number;
  position_name: string;
  position_code?: string;
  description?: string;
  ctime?: string;
  utime?: string;
}

export interface PositionForm {
  position_name: string;
  position_code?: string;
  description?: string;
}

export const fetchPositions = (params?: Record<string, unknown>) =>
  http.get<{ total: number; records: Position[] }>('/rbac/positions', params);

export const createPosition = (data: PositionForm) =>
  http.post<Position>('/rbac/positions', data);

export const updatePosition = (id: number, data: Partial<PositionForm>) =>
  http.put<Position>(`/rbac/positions/${id}`, data);

export const deletePosition = (id: number) =>
  http.delete(`/rbac/positions/${id}`);
