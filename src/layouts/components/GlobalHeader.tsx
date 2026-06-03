import { lazy, Suspense, useEffect, useState } from 'react';
import multiavatar from '@multiavatar/multiavatar';
import { App, Button, Tooltip, Dropdown, Space, Modal, Tag, Typography, Empty, type MenuProps } from 'antd';
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

const GlobalSearch = lazy(() => import('./GlobalSearch'));

export default function GlobalHeader() {
  const { t, i18n } = useTranslation();
  const { modal } = App.useApp();
  const { siderCollapsed, toggleSiderCollapse, openThemeDrawer, isMobile, mobileSiderOpen, toggleMobileSider } = useAppStore();
  const { userInfo, logout } = useAuthStore();
  const { themeScheme, setThemeScheme } = useThemeStore();
  const isDark = themeScheme === 'dark';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

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
      onClick: () => setPermissionModalOpen(true),
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

  const roleNames = userInfo?.roles?.all
    ? [t('common.superAdmin', { defaultValue: '超级管理员' })]
    : (userInfo?.roles?.data ?? []);

  const isAllPermissions = userInfo?.permissions?.all ?? false;
  const componentNames = Object.entries(userInfo?.permissions?.components ?? {})
    .filter(([, enabled]) => Boolean(enabled))
    .map(([name]) => name);

  return (
    <>
      {searchVisible && (
        <Suspense fallback={null}>
          <GlobalSearch open={searchVisible} onClose={() => setSearchVisible(false)} />
        </Suspense>
      )}

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
          icon={isMobile
            ? (mobileSiderOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />)
            : (siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)
          }
          onClick={isMobile ? toggleMobileSider : toggleSiderCollapse}
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

          {!isMobile && (
            <Tooltip title={isFullscreen ? t('icon.fullscreenExit') : t('icon.fullscreen')}>
              <Button
                type="text"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                style={btnStyle}
              />
            </Tooltip>
          )}

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

          {!isMobile && (
            <Tooltip title={t('icon.themeConfig')}>
              <Button
                type="text"
                icon={<SkinOutlined />}
                onClick={openThemeDrawer}
                style={btnStyle}
              />
            </Tooltip>
          )}

          <div style={{ width: 1, height: 16, background: 'var(--zb-border)', margin: '0 4px' }} />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
              <span
                style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}
                dangerouslySetInnerHTML={{ __html: multiavatar((userInfo?.userName || 'Admin') + (userInfo?.avatar || '')) }}
              />
              {!isMobile && (
                <span style={{ fontSize: 13, color: 'var(--zb-text-1)', fontWeight: 500 }}>
                  {userInfo?.userName || 'Admin'}
                </span>
              )}
            </Space>
          </Dropdown>
        </Space>
      </div>

      <Modal
        title={t('common.userCenter', { defaultValue: '个人中心' })}
        open={permissionModalOpen}
        onCancel={() => setPermissionModalOpen(false)}
        footer={null}
        transitionName=""
        maskTransitionName=""
        destroyOnClose
        width="min(680px, 90vw)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: multiavatar((userInfo?.userName || 'Admin') + (userInfo?.avatar || '')) }}
            />
            <div>
              <Typography.Text strong>{userInfo?.userName || 'Admin'}</Typography.Text>
              {userInfo?.email && (
                <div>
                  <Typography.Text type="secondary">{userInfo.email}</Typography.Text>
                </div>
              )}
            </div>
          </div>

          <div>
            <Typography.Text strong>{t('common.myRoles', { defaultValue: '我的角色' })}</Typography.Text>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roleNames.length > 0
                ? roleNames.map(role => <Tag key={role}>{role}</Tag>)
                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noRoleData', { defaultValue: '暂无角色数据' })} />}
            </div>
          </div>

          <div>
            <Typography.Text strong>{t('common.myComponents', { defaultValue: '我的组件权限' })}</Typography.Text>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {isAllPermissions && (
                <Tag color="gold">{t('common.allComponents', { defaultValue: '全部组件权限' })}</Tag>
              )}
              {componentNames.length > 0
                ? componentNames.map(name => <Tag color="processing" key={name}>{name}</Tag>)
                : !isAllPermissions && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noComponentData', { defaultValue: '暂无组件权限数据' })} />}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
