import http from '../request';

export interface RouteItem {
  name: string;
  path: string;
  component?: string;
  meta?: {
    title: string;
    i18nKey?: string;
    icon?: string;
    order?: number;
    constant?: boolean;
    hideInMenu?: boolean;
    keepAlive?: boolean;
  };
  children?: RouteItem[];
}

export interface UserRoutesData {
  routes: RouteItem[];
  home: string;
}

export const fetchGetConstantRoutes = () =>
  http.get<RouteItem[]>('/rbac/route/getConstantRoutes');

export const fetchGetUserRoutes = () =>
  http.get<UserRoutesData>('/rbac/route/getUserRoutes');

export const fetchIsRouteExist = (routeName: string) =>
  http.get<boolean>('/rbac/route/isRouteExist', { routeName });
