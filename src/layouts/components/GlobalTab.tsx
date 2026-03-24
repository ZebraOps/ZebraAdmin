import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Tooltip, Dropdown, type MenuProps } from 'antd';
import { ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined, CloseOutlined } from '@ant-design/icons';
import { Icon } from '@iconify/react';
import { useTabStore } from '@/store/tab';
import { useAppStore } from '@/store/app';
import { useEffect, useState } from 'react';
import { useRouteStore, type MenuNode } from '@/store/route';
import { staticMenus } from '@/router/menus';

/** Find icon for a path by scanning the menu tree */
function findIcon(nodes: MenuNode[], path: string): string | undefined {
  for (const node of nodes) {
    if (node.path === path) return node.icon;
    if (node.children) {
      const found = findIcon(node.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

export default function GlobalTab() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { tabs, activeTabId, addTab, removeTab, setActiveTabId, clearTabs, clearLeftTabs, clearRightTabs } = useTabStore();
  const { reloadPage } = useAppStore();
  const { menus: dynamicMenus } = useRouteStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const menus = dynamicMenus.length > 0 ? dynamicMenus : staticMenus;

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Add tab on route change
  useEffect(() => {
    const path = location.pathname;
    if (['/login', '/403', '/404', '/500'].includes(path)) return;

    const routeKey = path.replace(/^\//, '').replace(/\//g, '_');
    const icon = findIcon(menus, path);

    addTab({
      id: path,
      label: t(`route.${routeKey}`, { defaultValue: routeKey }),
      routeKey,
      fullPath: path,
      icon,
      fixed: path === '/home'
    });
    setActiveTabId(path);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleTabClick = (id: string, fullPath: string) => {
    setActiveTabId(id);
    navigate(fullPath);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const idx = tabs.findIndex(t => t.id === tabId);
    removeTab(tabId);

    if (tabId === activeTabId) {
      const next = tabs[idx + 1] ?? tabs[idx - 1];
      if (next) navigate(next.fullPath);
    }
  };

  const buildContextMenu = (tabId: string): MenuProps['items'] => {
    const tab = tabs.find(t => t.id === tabId);
    const idx = tabs.findIndex(t => t.id === tabId);
    return [
      {
        key: 'close',
        label: t('dropdown.closeCurrent'),
        disabled: tab?.fixed,
        onClick: () => {
          if (tab?.fixed) return;
          removeTab(tabId);
          if (tabId === activeTabId) {
            const next = tabs[idx + 1] ?? tabs[idx - 1];
            if (next) navigate(next.fullPath);
          }
        },
      },
      { key: 'closeOther', label: t('dropdown.closeOther'), onClick: () => clearTabs([tabId]) },
      { key: 'closeLeft', label: t('dropdown.closeLeft'), disabled: idx === 0, onClick: () => clearLeftTabs(tabId) },
      { key: 'closeRight', label: t('dropdown.closeRight'), disabled: idx === tabs.length - 1, onClick: () => clearRightTabs(tabId) },
      { key: 'closeAll', label: t('dropdown.closeAll'), onClick: () => clearTabs([]) },
    ];
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (tabs.length === 0) return null;

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 4,
    cursor: 'pointer', flexShrink: 0,
    color: 'var(--zb-text-2)',
    transition: 'background var(--zb-t), color var(--zb-t)',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 34,
      padding: '0 6px',
      background: 'var(--zb-sider-bg)',
      borderBottom: '1px solid var(--zb-border)',
    }}>
      {/* Scrollable tab list */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        flex: 1, overflowX: 'auto', overflowY: 'hidden',
        scrollbarWidth: 'none',
      }}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <Dropdown
              key={tab.id}
              menu={{ items: buildContextMenu(tab.id) }}
              trigger={['contextMenu']}
            >
              <div
                onClick={() => handleTabClick(tab.id, tab.fullPath)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '0 8px',
                  height: 24,
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  borderRadius: 'var(--zb-r-sm)',
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--zb-accent)' : 'var(--zb-text-3)',
                  background: isActive ? 'var(--zb-sider-item-active)' : 'transparent',
                  outline: isActive ? '1px solid color-mix(in srgb, var(--zb-accent) 20%, transparent)' : '1px solid transparent',
                  transition: 'all var(--zb-t)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--zb-text-2)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--zb-surface2)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--zb-text-3)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {tab.icon && (
                  <Icon icon={tab.icon} width={12} height={12} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                )}
                {!tab.icon && isActive && (
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--zb-accent)', flexShrink: 0 }} />
                )}
                <span>{tab.label}</span>
                {!tab.fixed && (
                  <span
                    onClick={(e) => handleTabClose(e, tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 13, height: 13, borderRadius: 2,
                      fontSize: 10, flexShrink: 0,
                      color: isActive ? 'var(--zb-accent)' : 'var(--zb-text-3)',
                      transition: 'background var(--zb-t)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--zb-border)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <CloseOutlined style={{ fontSize: 8 }} />
                  </span>
                )}
              </div>
            </Dropdown>
          );
        })}
      </div>

      {/* Right action buttons */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        borderLeft: '1px solid var(--zb-border)', paddingLeft: 6, marginLeft: 4,
        flexShrink: 0,
      }}>
        <Tooltip title={t('icon.reload')}>
          <div
            style={btnStyle}
            onClick={reloadPage}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--zb-sider-item-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--zb-text-1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--zb-text-2)'; }}
          >
            <ReloadOutlined style={{ fontSize: 13 }} />
          </div>
        </Tooltip>
        <Tooltip title={isFullscreen ? t('icon.fullscreenExit') : t('icon.fullscreen')}>
          <div
            style={btnStyle}
            onClick={toggleFullscreen}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--zb-sider-item-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--zb-text-1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--zb-text-2)'; }}
          >
            {isFullscreen ? <FullscreenExitOutlined style={{ fontSize: 13 }} /> : <FullscreenOutlined style={{ fontSize: 13 }} />}
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
