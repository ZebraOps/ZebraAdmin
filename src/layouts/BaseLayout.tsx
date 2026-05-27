import { lazy, Suspense, useEffect } from 'react';
import { Layout, Drawer } from 'antd';
import { Outlet } from 'react-router';
import { useAppStore } from '@/store/app';

const { Sider, Header, Content } = Layout;
const GlobalHeader = lazy(() => import('./components/GlobalHeader'));
const GlobalSider = lazy(() => import('./components/GlobalSider'));
const GlobalTab = lazy(() => import('./components/GlobalTab'));
const GlobalBreadcrumb = lazy(() => import('./components/GlobalBreadcrumb'));
const ThemeDrawer = lazy(() => import('./components/ThemeDrawer'));

export default function BaseLayout() {
  const { siderCollapsed, setSiderCollapsed, reloadFlag, isMobile, setIsMobile, mobileSiderOpen, setMobileSiderOpen, themeDrawerVisible } = useAppStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncMobileState = (mobile: boolean) => {
      if (mobile !== useAppStore.getState().isMobile) {
        setIsMobile(mobile);
      }
    };

    const handleViewportChange = (event: MediaQueryListEvent) => syncMobileState(event.matches);

    syncMobileState(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleViewportChange);

    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, [setIsMobile]);

  const siderFallback = <div style={{ height: '100%', background: 'var(--zb-sider-bg)' }} />;
  const headerFallback = <div style={{ height: 56, background: 'transparent' }} />;
  const tabFallback = <div style={{ height: 34, borderTop: '1px solid var(--zb-border)' }} />;

  return (
    <>
      <Layout className="zb-shell" style={{ minHeight: '100vh', background: 'var(--zb-bg)' }}>
        {!isMobile && (
          <Sider
            collapsed={siderCollapsed}
            onCollapse={setSiderCollapsed}
            width={220}
            collapsedWidth={56}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 100,
              overflow: 'hidden',
              background: 'var(--zb-sider-bg)',
              borderRight: '1px solid var(--zb-border)',
              boxShadow: 'var(--zb-shadow)',
            }}
          >
            <Suspense fallback={siderFallback}>
              <GlobalSider />
            </Suspense>
          </Sider>
        )}

        {isMobile && (
          <Drawer
            placement="left"
            open={mobileSiderOpen}
            onClose={() => setMobileSiderOpen(false)}
            width={220}
            styles={{
              body: { padding: 0 },
              content: { background: 'var(--zb-sider-bg)', boxShadow: 'var(--zb-shadow)' },
              header: { display: 'none' },
              mask: { backdropFilter: 'blur(6px)' },
            }}
            closable={false}
          >
            <Suspense fallback={siderFallback}>
              <GlobalSider />
            </Suspense>
          </Drawer>
        )}

        <Layout
          className="zb-shell__viewport"
          style={{
            marginLeft: isMobile ? 0 : (siderCollapsed ? 56 : 220),
            transition: 'margin-left 0.2s',
            background: 'transparent',
          }}
        >
          <Header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 99,
              padding: 0,
              height: 'auto',
              lineHeight: 'unset',
              background: 'var(--zb-header-bg)',
              borderBottom: '1px solid var(--zb-border)',
              backdropFilter: 'blur(14px)',
              boxShadow: 'var(--zb-shadow-sm)',
            }}
          >
            <div className="zb-shell__header-inner">
              <Suspense fallback={headerFallback}>
                <GlobalHeader />
              </Suspense>
              <Suspense fallback={tabFallback}>
                <GlobalTab />
              </Suspense>
            </div>
          </Header>

          <Content
            className="zb-shell__content"
            style={{ padding: isMobile ? 12 : 18, minHeight: 'calc(100vh - 56px)', background: 'transparent' }}
          >
            <div className="zb-shell__content-inner">
              <div className="zb-shell__panel">
                <Suspense fallback={null}>
                  <GlobalBreadcrumb />
                </Suspense>
                {reloadFlag && <Outlet />}
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
      {themeDrawerVisible && (
        <Suspense fallback={null}>
          <ThemeDrawer />
        </Suspense>
      )}
    </>
  );
}

