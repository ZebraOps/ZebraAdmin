import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import type { RouteObject } from 'react-router';
import BaseLayout from '@/layouts/BaseLayout';
import BlankLayout from '@/layouts/BlankLayout';
import { AuthGuard, RouteOutlet } from './guard';

// Lazy-loaded views
const LoginPage = lazy(() => import('@/views/login'));
const HomePage = lazy(() => import('@/views/home'));
const Page403 = lazy(() => import('@/views/error/403'));
const Page404 = lazy(() => import('@/views/error/404'));
const Page500 = lazy(() => import('@/views/error/500'));

// Org module
const OrgDept = lazy(() => import('@/views/org/dept'));
const OrgJob = lazy(() => import('@/views/org/job'));
const OrgPositions = lazy(() => import('@/views/org/positions'));
const OrgUsers = lazy(() => import('@/views/org/users'));

// Permission module
const PermissionAuthor = lazy(() => import('@/views/permission/author'));
const PermissionComponent = lazy(() => import('@/views/permission/component'));
const PermissionFunctions = lazy(() => import('@/views/permission/functions'));
const PermissionGroups = lazy(() => import('@/views/permission/groups'));
const PermissionMenus = lazy(() => import('@/views/permission/menus'));
const PermissionRoles = lazy(() => import('@/views/permission/roles'));

// System module
const SystemAuthor = lazy(() => import('@/views/system/author'));
const SystemGroups = lazy(() => import('@/views/system/groups'));
const SystemMenus = lazy(() => import('@/views/system/menus'));
const SystemRoles = lazy(() => import('@/views/system/roles'));
const SystemUsers = lazy(() => import('@/views/system/users'));

// Publish module
const PublishApplications = lazy(() => import('@/views/publish/applications'));
const PublishRepos = lazy(() => import('@/views/publish/repos'));
const PublishTasks = lazy(() => import('@/views/publish/tasks'));
const PublishTemplatesBuild = lazy(() => import('@/views/publish/templates/build'));
const PublishTemplatesDeployment = lazy(() => import('@/views/publish/templates/deployment'));
const PublishConfigEnv = lazy(() => import('@/views/publish/config/env'));
const PublishConfigRegistry = lazy(() => import('@/views/publish/config/registry'));
const PublishConfigVendor = lazy(() => import('@/views/publish/config/vendor'));
const PublishContainerK8s = lazy(() => import('@/views/publish/container/k8s'));
const PublishContainerLinux = lazy(() => import('@/views/publish/container/linux'));

// Gateway module
const GatewayRoutes = lazy(() => import('@/views/gateway/routes'));
const GatewayWhitelist = lazy(() => import('@/views/gateway/whitelist'));

const routeConfig: RouteObject[] = [
  // Blank layout (login, error pages) — no auth required
  {
    element: <BlankLayout />,
    children: [
      { path: '/login', element: <RouteOutlet><LoginPage /></RouteOutlet> },
      { path: '/403', element: <RouteOutlet><Page403 /></RouteOutlet> },
      { path: '/404', element: <RouteOutlet><Page404 /></RouteOutlet> },
      { path: '/500', element: <RouteOutlet><Page500 /></RouteOutlet> }
    ]
  },
  // Base layout (authenticated)
  {
    element: <AuthGuard><BaseLayout /></AuthGuard>,
    children: [
      { path: '/home', element: <RouteOutlet><HomePage /></RouteOutlet> },
      // Org
      { path: '/org/dept', element: <RouteOutlet><OrgDept /></RouteOutlet> },
      { path: '/org/job', element: <RouteOutlet><OrgJob /></RouteOutlet> },
      { path: '/org/positions', element: <RouteOutlet><OrgPositions /></RouteOutlet> },
      { path: '/org/users', element: <RouteOutlet><OrgUsers /></RouteOutlet> },
      // Permission
      { path: '/permission/author', element: <RouteOutlet><PermissionAuthor /></RouteOutlet> },
      { path: '/permission/component', element: <RouteOutlet><PermissionComponent /></RouteOutlet> },
      { path: '/permission/functions', element: <RouteOutlet><PermissionFunctions /></RouteOutlet> },
      { path: '/permission/groups', element: <RouteOutlet><PermissionGroups /></RouteOutlet> },
      { path: '/permission/menus', element: <RouteOutlet><PermissionMenus /></RouteOutlet> },
      { path: '/permission/roles', element: <RouteOutlet><PermissionRoles /></RouteOutlet> },
      // System
      { path: '/system/author', element: <RouteOutlet><SystemAuthor /></RouteOutlet> },
      { path: '/system/groups', element: <RouteOutlet><SystemGroups /></RouteOutlet> },
      { path: '/system/menus', element: <RouteOutlet><SystemMenus /></RouteOutlet> },
      { path: '/system/roles', element: <RouteOutlet><SystemRoles /></RouteOutlet> },
      { path: '/system/users', element: <RouteOutlet><SystemUsers /></RouteOutlet> },
      // Publish
      { path: '/publish/applications', element: <RouteOutlet><PublishApplications /></RouteOutlet> },
      { path: '/publish/repos', element: <RouteOutlet><PublishRepos /></RouteOutlet> },
      { path: '/publish/tasks', element: <RouteOutlet><PublishTasks /></RouteOutlet> },
      { path: '/publish/templates/build', element: <RouteOutlet><PublishTemplatesBuild /></RouteOutlet> },
      { path: '/publish/templates/deployment', element: <RouteOutlet><PublishTemplatesDeployment /></RouteOutlet> },
      { path: '/publish/config/env', element: <RouteOutlet><PublishConfigEnv /></RouteOutlet> },
      { path: '/publish/config/registry', element: <RouteOutlet><PublishConfigRegistry /></RouteOutlet> },
      { path: '/publish/config/vendor', element: <RouteOutlet><PublishConfigVendor /></RouteOutlet> },
      { path: '/publish/container/k8s', element: <RouteOutlet><PublishContainerK8s /></RouteOutlet> },
      { path: '/publish/container/linux', element: <RouteOutlet><PublishContainerLinux /></RouteOutlet> },
      // Gateway
      { path: '/gateway/routes', element: <RouteOutlet><GatewayRoutes /></RouteOutlet> },
      { path: '/gateway/whitelist', element: <RouteOutlet><GatewayWhitelist /></RouteOutlet> }
    ]
  },
  // Redirects
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '*', element: <Navigate to="/404" replace /> }
];

export const router = createBrowserRouter(routeConfig);
