import { Suspense, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/auth';
import { useRouteStore, transformRoutesToMenus } from '@/store/route';
import { fetchGetUserRoutes } from '@/service/api/route';
import { staticMenus } from '@/router/menus';

/** Pages that don't require authentication */
const PUBLIC_PATHS = ['/login', '/403', '/404', '/500'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLogin, userInfo } = useAuthStore();
  const { isInitialized, setMenus, setInitialized, setHomeRoute } = useRouteStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(p => location.pathname.startsWith(p));

    if (!isLogin) {
      if (!isPublic) {
        navigate('/login', { replace: true, state: { from: location.pathname } });
      }
      return;
    }

    // Logged in - init routes if not yet
    if (!isInitialized) {
      // 超级管理员直接使用完整的静态菜单
      if (userInfo?.menus?.all) {
        setMenus(staticMenus);
        setHomeRoute('home');
        setInitialized(true);
        if (location.pathname === '/' || location.pathname === '/login') {
          navigate('/home', { replace: true });
        }
      } else {
        fetchGetUserRoutes()
          .then(({ routes, home }) => {
            const menus = transformRoutesToMenus(routes);
            // 首页菜单始终展示，不受角色权限控制
            const homeMenu: import('@/store/route').MenuNode = {
              key: 'home', label: 'route.home', icon: 'mdi:monitor-dashboard', path: '/home', order: 1
            };
            const hasHome = menus.some(m => m.key === 'home');
            setMenus(hasHome ? menus : [homeMenu, ...menus]);
            setHomeRoute(home);
            setInitialized(true);
            if (location.pathname === '/' || location.pathname === '/login') {
              navigate(`/${home}`, { replace: true });
            }
          })
          .catch(() => {
            setInitialized(true);
          });
      }
    }

    if (isPublic && location.pathname === '/login') {
      navigate('/home', { replace: true });
    }
  }, [isLogin, location.pathname, isInitialized]);

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export function RouteOutlet({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center py-16">
          <Spin size="default" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
