import { useEffect, useState } from 'react';
import { App, Button, Tooltip, Dropdown, Avatar, Space, type MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  TranslationOutlined,
  UserOutlined,
  LogoutOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SkinOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import GlobalSearch from './GlobalSearch';

export default function GlobalHeader() {
  const { t, i18n } = useTranslation();
  const { modal } = App.useApp();
  const { siderCollapsed, toggleSiderCollapse, openThemeDrawer } = useAppStore();
  const { userInfo, logout } = useAuthStore();
  const { themeScheme, setThemeScheme } = useThemeStore();
  const isDark = themeScheme === 'dark';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('common.userCenter'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span style={{ color: '#ef4444' }}>{t('common.logout')}</span>,
      onClick: () => {
        modal.confirm({
          title: t('common.logout'),
          content: t('common.logoutConfirm'),
          okText: t('common.confirm'),
          cancelText: t('common.cancel'),
          okButtonProps: { danger: true },
          onOk: logout,
        });
      },
    },
  ];

  const btnStyle: React.CSSProperties = {
    color: 'var(--zb-text-2)',
    border: 'none',
    background: 'transparent',
    boxShadow: 'none',
  };

  return (
    <>
      <GlobalSearch open={searchVisible} onClose={() => setSearchVisible(false)} />

      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        width: '100%',
      }}>
        {/* Left: collapse toggle */}
        <Button
          type="text"
          icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSiderCollapse}
          style={btnStyle}
        />

        {/* Right: actions */}
        <Space size={4}>
          <Tooltip title={t('icon.globalSearch')}>
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => setSearchVisible(true)}
              style={btnStyle}
            />
          </Tooltip>

          <Tooltip title={isFullscreen ? t('icon.fullscreenExit') : t('icon.fullscreen')}>
            <Button
              type="text"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              style={btnStyle}
            />
          </Tooltip>

          <Tooltip title={t('icon.lang')}>
            <Button type="text" icon={<TranslationOutlined />} onClick={toggleLang} style={btnStyle} />
          </Tooltip>

          <Tooltip title={isDark ? t('theme.light') : t('theme.dark')}>
            <Button
              type="text"
              icon={<BulbOutlined />}
              onClick={() => setThemeScheme(isDark ? 'light' : 'dark')}
              style={btnStyle}
            />
          </Tooltip>

          <Tooltip title={t('icon.themeConfig')}>
            <Button
              type="text"
              icon={<SkinOutlined />}
              onClick={openThemeDrawer}
              style={btnStyle}
            />
          </Tooltip>

          <div style={{ width: 1, height: 16, background: 'var(--zb-border)', margin: '0 4px' }} />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
              <Avatar
                size={28}
                style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', fontSize: 11, fontWeight: 700 }}
                icon={<UserOutlined />}
              />
              <span style={{ fontSize: 13, color: 'var(--zb-text-1)', fontWeight: 500 }}>
                {userInfo?.userName || 'Admin'}
              </span>
            </Space>
          </Dropdown>
        </Space>
      </div>
    </>
  );
}
