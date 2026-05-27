import { ConfigProvider, theme as antdTheme, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { RouterProvider } from 'react-router';
import { router } from '@/router/routes';
import { useThemeStore } from '@/store/theme';

const localeMap = { 'zh-CN': zhCN, 'en-US': enUS } as const;

function App() {
  const { i18n } = useTranslation();
  const { darkMode, primaryColor } = useThemeStore();

  const locale = localeMap[i18n.language as keyof typeof localeMap] ?? zhCN;

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm: darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: primaryColor,
          borderRadius: 5,
          fontFamily: "'Outfit', 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif",
        },
        components: {
          Layout: {
            siderBg: darkMode ? '#0c0c0e' : '#fafafa',
            headerBg: darkMode ? 'rgba(9,9,11,0.85)' : 'rgba(255,255,255,0.88)',
            bodyBg: darkMode ? '#09090b' : '#f8f8f8',
          },
          Menu: {
            darkItemBg: '#0c0c0e',
            darkSubMenuItemBg: '#0f0f11',
          },
        },
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
