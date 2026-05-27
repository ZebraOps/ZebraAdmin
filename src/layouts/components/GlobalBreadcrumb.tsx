import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { HomeOutlined } from '@ant-design/icons';
import { useRouteStore, type MenuNode } from '@/store/route';
import { staticMenus } from '@/router/menus';

/** Recursively find the chain of MenuNodes matching the given path */
function findChain(nodes: MenuNode[], path: string): MenuNode[] | null {
  for (const node of nodes) {
    if (node.path === path) return [node];
    if (node.children) {
      const sub = findChain(node.children, path);
      if (sub) return [node, ...sub];
    }
  }
  return null;
}

export default function GlobalBreadcrumb() {
  const { t } = useTranslation();
  const location = useLocation();
  const { menus: dynamicMenus } = useRouteStore();

  const menus = dynamicMenus.length > 0 ? dynamicMenus : staticMenus;

  if (location.pathname === '/home') return null;

  const chain = findChain(menus, location.pathname);

  const items = [
    {
      key: 'home',
      title: <Link to="/home"><HomeOutlined /></Link>,
    },
    ...(chain ?? []).map((node, idx, arr) => {
      const isLast = idx === arr.length - 1;
      const label = t(node.label);
      return {
        key: node.key,
        title: (!isLast && node.path)
          ? <Link to={node.path}>{label}</Link>
          : label,
      };
    }),
  ];

  return (
    <Breadcrumb
      items={items}
      style={{ marginBottom: 12, fontSize: 12 }}
    />
  );
}

