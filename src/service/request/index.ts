import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { message as antMessage } from 'antd';
import { localStg } from '@/utils/storage';

export interface ServiceResponse<T = unknown> {
  code: string;
  msg: string;
  data: T;
}

/** Track pending refresh */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/** Create axios instance */
const instance: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/** Request interceptor - inject Authorization header */
instance.interceptors.request.use(
  config => {
    const token = localStg.get<string>('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

/** Response interceptor */
instance.interceptors.response.use(
  async (response: AxiosResponse<ServiceResponse>) => {
    const successCode = import.meta.env.VITE_SERVICE_SUCCESS_CODE || '0000';
    const data = response.data;
    const code = String(data?.code);

    if (code === successCode) {
      return response;
    }

    // Handle expired token codes
    const expiredTokenCodes = (import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES || '').split(',').filter(Boolean);
    if (expiredTokenCodes.includes(code)) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshed = await refreshToken();
          if (refreshed) {
            onRefreshed(refreshed);
            // Retry original request
            const originalRequest = response.config;
            originalRequest.headers.Authorization = `Bearer ${refreshed}`;
            return instance(originalRequest);
          }
        } catch {
          forceLogout();
          return Promise.reject(response.data);
        } finally {
          isRefreshing = false;
        }
      }

      // Queue request until token refresh is done
      return new Promise<AxiosResponse>(resolve => {
        subscribeTokenRefresh(token => {
          response.config.headers.Authorization = `Bearer ${token}`;
          resolve(instance(response.config));
        });
      });
    }

    // Handle logout codes
    const logoutCodes = (import.meta.env.VITE_SERVICE_LOGOUT_CODES || '').split(',').filter(Boolean);
    if (logoutCodes.includes(code)) {
      forceLogout();
      return Promise.reject(response.data);
    }

    // Handle modal logout codes
    const modalLogoutCodes = (import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES || '').split(',').filter(Boolean);
    if (modalLogoutCodes.includes(code)) {
      // Show modal then logout - handled by caller via error interceptor
      forceLogout();
      return Promise.reject(response.data);
    }

    return Promise.reject(response.data);
  },
  error => {
    if (error.response?.status === 401) {
      forceLogout();
    }
    // 统一提取后端 {code, message} 格式的错误信息
    const serverData = error.response?.data as { code?: number; message?: string; detail?: string } | undefined;
    const msg = serverData?.message || serverData?.detail || error.message || '请求失败';

    // 权限不足时弹窗提示，并标记已处理，业务代码不再重复提示
    if (error.response?.status === 400 || error.response?.status === 403) {
      antMessage.error(msg);
      return Promise.reject({ code: serverData?.code ?? error.response?.status, message: msg, _handled: true });
    }

    return Promise.reject({ code: serverData?.code ?? error.response?.status, message: msg });
  }
);

async function refreshToken(): Promise<string | null> {
  const refreshTokenValue = localStg.get<string>('refreshToken');
  if (!refreshTokenValue) return null;

  try {
    const response = await axios.post<ServiceResponse<{ token: string; refreshToken: string }>>(
      '/rbac/login/refresh-token',
      { refreshToken: refreshTokenValue }
    );
    const data = response.data;
    if (String(data.code) === (import.meta.env.VITE_SERVICE_SUCCESS_CODE || '0000')) {
      localStg.set('token', data.data.token);
      localStg.set('refreshToken', data.data.refreshToken);
      return data.data.token;
    }
    return null;
  } catch {
    return null;
  }
}

function forceLogout() {
  localStg.remove('token');
  localStg.remove('refreshToken');
  localStg.remove('userInfo');
  // Navigate to login
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

/** 判断是否已在拦截器中处理过的错误（400/403权限不足等） */
export function isHandledError(error: unknown): boolean {
  return (error as any)?._handled === true;
}

/** Generic request helper with typed response */
async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await instance.request<ServiceResponse<T>>(config);
  return response.data.data;
}

export const http = {
  get: <T = unknown>(url: string, params?: Record<string, unknown>) =>
    request<T>({ method: 'GET', url, params }),

  post: <T = unknown>(url: string, data?: unknown) =>
    request<T>({ method: 'POST', url, data }),

  put: <T = unknown>(url: string, data?: unknown) =>
    request<T>({ method: 'PUT', url, data }),

  delete: <T = unknown>(url: string, data?: unknown) =>
    request<T>({ method: 'DELETE', url, data }),

  patch: <T = unknown>(url: string, data?: unknown) =>
    request<T>({ method: 'PATCH', url, data })
};

export default http;
