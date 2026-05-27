import { useEffect } from 'react';
import { Layout, Drawer } from 'antd';
import { Outlet } from 'react-router';
import { useAppStore } from '@/store/app';
import GlobalHeader from './components/GlobalHeader';
import GlobalSider from './components/GlobalSider';
import GlobalTab from './components/GlobalTab';
import GlobalBreadcrumb from './components/GlobalBreadcrumb';
import ThemeDrawer from './components/ThemeDrawer';

const { Sider, Header, Content } = Layout;

export default function BaseLayout() {
  const { siderCollapsed, setSiderCollapsed, reloadFlag, isMobile, setIsMobile, mobileSiderOpen, setMobileSiderOpen } = useAppStore();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Layout style={{ minHeight: '100vh', background: 'var(--zb-bg)' }}>
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
            }}
          >
            <GlobalSider />
          </Sider>
        )}

        {isMobile && (
          <Drawer
            placement="left"
            open={mobileSiderOpen}
            onClose={() => setMobileSiderOpen(false)}
            width={220}
            styles={{ body: { padding: 0 } }}
            closable={false}
          >
            <GlobalSider />
          </Drawer>
        )}

        <Layout style={{
          marginLeft: isMobile ? 0 : (siderCollapsed ? 56 : 220),
          transition: 'margin-left 0.2s',
          background: 'var(--zb-bg)',
        }}>
          <Header style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            padding: 0,
            height: 'auto',
            lineHeight: 'unset',
            background: 'var(--zb-header-bg)',
            borderBottom: '1px solid var(--zb-border)',
          }}>
            <GlobalHeader />
            <GlobalTab />
          </Header>

          <Content style={{ padding: isMobile ? 12 : 16, minHeight: 'calc(100vh - 56px)', background: 'var(--zb-bg)' }}>
            <GlobalBreadcrumb />
            {reloadFlag && <Outlet />}
          </Content>
        </Layout>
      </Layout>
      <ThemeDrawer />
    </>
  );
}

