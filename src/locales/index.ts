import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { localStg } from '@/utils/storage';
import zhCN from './langs/zh-cn';
import enUS from './langs/en-us';

const savedLang = localStg.get<App.I18n.LangType>('lang') || 'zh-CN';

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS }
  },
  lng: savedLang,
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
export const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
