import { create } from 'zustand';
import { localStg } from '@/utils/storage';
import i18n from '@/locales';

interface AppState {
  locale: App.I18n.LangType;
  siderCollapsed: boolean;
  isMobile: boolean;
  reloadFlag: boolean;
  themeDrawerVisible: boolean;

  setLocale: (lang: App.I18n.LangType) => void;
  toggleSiderCollapse: () => void;
  setSiderCollapsed: (val: boolean) => void;
  setIsMobile: (val: boolean) => void;
  reloadPage: () => Promise<void>;
  openThemeDrawer: () => void;
  closeThemeDrawer: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  locale: localStg.get<App.I18n.LangType>('lang') || 'zh-CN',
  siderCollapsed: false,
  isMobile: window.innerWidth < 640,
  reloadFlag: true,
  themeDrawerVisible: false,

  setLocale: (lang) => {
    localStg.set('lang', lang);
    i18n.changeLanguage(lang);
    set({ locale: lang });
  },

  toggleSiderCollapse: () => {
    set(state => ({ siderCollapsed: !state.siderCollapsed }));
  },

  setSiderCollapsed: (val) => {
    set({ siderCollapsed: val });
  },

  setIsMobile: (val) => {
    set({ isMobile: val });
    if (val) {
      set({ siderCollapsed: true });
    }
  },

  reloadPage: async () => {
    set({ reloadFlag: false });
    await new Promise(resolve => setTimeout(resolve, 300));
    set({ reloadFlag: true });
  },

  openThemeDrawer: () => set({ themeDrawerVisible: true }),
  closeThemeDrawer: () => set({ themeDrawerVisible: false })
}));
