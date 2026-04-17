import { create } from 'zustand';
import type { RouteItem } from '@/service/api/route';
import { staticMenus } from '@/router/menus';

export interface MenuNode {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  order?: number;
  children?: MenuNode[];
}

/** 从静态菜单树中按 key 查找图标 */
function findIconByKey(key: string, menus: MenuNode[] = staticMenus): string | undefined {
  for (const m of menus) {
    if (m.key === key) return m.icon;
    if (m.children) {
      const found = findIconByKey(key, m.children);
      if (found) return found;
    }
  }
  return undefined;
}

interface RouteState {
  menus: MenuNode[];
  isInitialized: boolean;
  homeRoute: string;

  setMenus: (menus: MenuNode[]) => void;
  setInitialized: (val: boolean) => void;
  setHomeRoute: (route: string) => void;
  resetStore: () => void;
}

/** Transform backend route items to menu nodes */
export function transformRoutesToMenus(routes: RouteItem[]): MenuNode[] {
  return routes
    .filter(r => !r.meta?.hideInMenu && !r.meta?.constant)
    .map(r => ({
      key: r.name,
      label: r.meta?.title || r.name,
      icon: r.meta?.icon || findIconByKey(r.name),
      path: r.path,
      order: r.meta?.order,
      children: r.children ? transformRoutesToMenus(r.children) : undefined
    }))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export const useRouteStore = create<RouteState>((set) => ({
  menus: [],
  isInitialized: false,
  homeRoute: import.meta.env.VITE_ROUTE_HOME || 'home',

  setMenus: (menus) => set({ menus }),
  setInitialized: (val) => set({ isInitialized: val }),
  setHomeRoute: (route) => set({ homeRoute: route }),
  resetStore: () => set({ menus: [], isInitialized: false })
}));
