import { Menu, type MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/store/app';
import { useRouteStore } from '@/store/route';
import type { MenuNode } from '@/store/route';
import { staticMenus } from '@/router/menus';

type MenuItem = Required<MenuProps>['items'][number];

function buildMenuItems(menus: MenuNode[], t: (key: string) => string): MenuItem[] {
  return menus.map((menu) => {
    const icon = menu.icon ? <Icon icon={menu.icon} width={14} height={14} /> : undefined;
    if (menu.children?.length) {
      return { key: menu.key, label: t(menu.label), icon, children: buildMenuItems(menu.children, t) };
    }
    return { key: menu.key, label: t(menu.label), icon };
  });
}

function pathToMenuKey(pathname: string): string {
  return pathname.replace(/^\//, '').replace(/\//g, '_');
}
function menuKeyToPath(key: string): string {
  return '/' + key.replace(/_/g, '/');
}

export default function GlobalSider() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { siderCollapsed } = useAppStore();
  const { menus: dynamicMenus } = useRouteStore();

  const menus = dynamicMenus.length > 0 ? dynamicMenus : staticMenus;
  const activeKey = pathToMenuKey(location.pathname);
  const pathParts = location.pathname.split('/').filter(Boolean);
  const defaultOpenKeys = pathParts.length > 1
    ? [pathParts.slice(0, pathParts.length - 1).join('_')]
    : [];

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--zb-sider-bg)', borderRight: '1px solid var(--zb-border)' }}
    >
      {/* Logo bar */}
      <div
        style={{
          height: 56,
          display: 'flex', alignItems: 'center',
          padding: siderCollapsed ? '0' : '0 16px',
          justifyContent: siderCollapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--zb-border)',
          gap: 10, flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28, height: 28,
            background: 'var(--zb-accent)', borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontFamily: 'var(--zb-font-mono)', fontSize: 10, fontWeight: 700,
            color: '#fff', letterSpacing: '-0.5px',
            boxShadow: '0 2px 8px var(--zb-accent-glow)',
          }}
        >ZB</div>
        {!siderCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontFamily: 'var(--zb-font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--zb-text-1)', letterSpacing: '0.04em' }}>
              ZEBRAOPS
            </span>
            <span style={{ fontFamily: 'var(--zb-font-mono)', fontSize: 9, fontWeight: 400, color: 'var(--zb-text-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              ops platform
            </span>
          </div>
        )}
      </div>

      {/* Nav menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingTop: 8 }}>
        <Menu
          inlineCollapsed={siderCollapsed}
          selectedKeys={[activeKey]}
          defaultOpenKeys={defaultOpenKeys}
          mode="inline"
          items={buildMenuItems(menus, t)}
          onClick={({ key }) => navigate(menuKeyToPath(key))}
          style={{ width: '100%', borderRight: 'none', background: 'transparent' }}
        />
      </div>

      {/* Bottom version strip */}
      {!siderCollapsed && (
        <div style={{
          padding: '8px 16px', borderTop: '1px solid var(--zb-border)',
          fontFamily: 'var(--zb-font-mono)', fontSize: 10, color: 'var(--zb-text-3)',
          letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--zb-success)', flexShrink: 0 }} />
          v1.0.0
        </div>
      )}
    </div>
  );
}
