import http from '../request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginToken {
  token: string;
  refreshToken: string;
}

/** Login with username and password */
export const fetchLogin = (username: string, password: string) =>
  http.post<LoginToken>('/rbac/login/access-token', { username, password });

/** Refresh access token */
export const fetchRefreshToken = (refreshToken: string) =>
  http.post<LoginToken>('/rbac/login/refresh-token', { refreshToken });

/** Get current user info */
export const fetchGetUserInfo = () =>
  http.get<App.Auth.UserInfo>('/rbac/authorization');
