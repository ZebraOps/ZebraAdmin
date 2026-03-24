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
          borderRadius: 6,
          fontFamily: "'IBM Plex Sans', 'PingFang SC', system-ui, sans-serif",
        },
        components: {
          Layout: {
            siderBg: darkMode ? '#0d0d0d' : '#fafafa',
            headerBg: darkMode ? 'rgba(10,10,10,0.88)' : 'rgba(255,255,255,0.92)',
            bodyBg: darkMode ? '#0a0a0a' : '#f4f4f5',
          },
          Menu: {
            darkItemBg: '#0d0d0d',
            darkSubMenuItemBg: '#111111',
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
