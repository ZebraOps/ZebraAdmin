import { create } from 'zustand';
import { fetchGetUserInfo, fetchLogin } from '@/service/api/auth';
import { localStg } from '@/utils/storage';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userInfo: App.Auth.UserInfo | null;
  isLogin: boolean;
  loginLoading: boolean;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initUserInfo: () => Promise<boolean>;
  resetStore: () => void;
}

const defaultUserInfo: App.Auth.UserInfo = {
  userId: 0,
  userName: '',
  roles: { all: false, data: [] },
  menus: { all: false, data: {} },
  permissions: { all: false, functions: [], components: {} }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStg.get<string>('token'),
  refreshToken: localStg.get<string>('refreshToken'),
  userInfo: localStg.get<App.Auth.UserInfo>('userInfo'),
  isLogin: Boolean(localStg.get<string>('token')),
  loginLoading: false,

  login: async (username: string, password: string) => {
    set({ loginLoading: true });
    try {
      const loginToken = await fetchLogin(username, password);
      localStg.set('token', loginToken.token);
      localStg.set('refreshToken', loginToken.refreshToken);
      set({ token: loginToken.token, refreshToken: loginToken.refreshToken });

      const userInfo = await fetchGetUserInfo();
      localStg.set('userInfo', userInfo);
      set({ userInfo, isLogin: true, loginLoading: false });
      return true;
    } catch {
      set({ loginLoading: false });
      get().resetStore();
      return false;
    }
  },

  logout: () => {
    get().resetStore();
    window.location.href = '/login';
  },

  initUserInfo: async () => {
    const token = get().token;
    if (!token) return false;
    try {
      const userInfo = await fetchGetUserInfo();
      localStg.set('userInfo', userInfo);
      set({ userInfo, isLogin: true });
      return true;
    } catch {
      get().resetStore();
      return false;
    }
  },

  resetStore: () => {
    localStg.remove('token');
    localStg.remove('refreshToken');
    localStg.remove('userInfo');
    set({
      token: null,
      refreshToken: null,
      userInfo: null,
      isLogin: false
    });
  }
}));

export function getDefaultUserInfo(): App.Auth.UserInfo {
  return { ...defaultUserInfo };
}
