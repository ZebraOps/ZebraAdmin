import { create } from 'zustand';
import { localStg } from '@/utils/storage';
import i18n from '@/locales';

interface AppState {
  locale: App.I18n.LangType;
  siderCollapsed: boolean;
  isMobile: boolean;
  mobileSiderOpen: boolean;
  reloadFlag: boolean;
  themeDrawerVisible: boolean;

  setLocale: (lang: App.I18n.LangType) => void;
  toggleSiderCollapse: () => void;
  setSiderCollapsed: (val: boolean) => void;
  setIsMobile: (val: boolean) => void;
  setMobileSiderOpen: (val: boolean) => void;
  toggleMobileSider: () => void;
  reloadPage: () => Promise<void>;
  openThemeDrawer: () => void;
  closeThemeDrawer: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  locale: localStg.get<App.I18n.LangType>('lang') || 'zh-CN',
  siderCollapsed: false,
  isMobile: window.innerWidth < 768,
  mobileSiderOpen: false,
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
    const state = get();
    const nextState: Partial<AppState> = {};

    if (state.isMobile !== val) {
      nextState.isMobile = val;
    }

    if (val) {
      if (!state.siderCollapsed) {
        nextState.siderCollapsed = true;
      }
    } else if (state.mobileSiderOpen) {
      nextState.mobileSiderOpen = false;
    }

    if (Object.keys(nextState).length > 0) {
      set(nextState);
    }
  },

  setMobileSiderOpen: (val) => set({ mobileSiderOpen: val }),
  toggleMobileSider: () => set(state => ({ mobileSiderOpen: !state.mobileSiderOpen })),

  reloadPage: async () => {
    set({ reloadFlag: false });
    await new Promise(resolve => setTimeout(resolve, 300));
    set({ reloadFlag: true });
  },

  openThemeDrawer: () => set({ themeDrawerVisible: true }),
  closeThemeDrawer: () => set({ themeDrawerVisible: false })
}));
