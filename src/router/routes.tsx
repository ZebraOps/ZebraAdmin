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

// Publish module
const PublishApplications = lazy(() => import('@/views/publish/applications'));
const PublishRepos = lazy(() => import('@/views/publish/repos'));
const PublishTasks = lazy(() => import('@/views/publish/tasks'));
const PublishTaskDetail = lazy(() => import('@/views/publish/task-detail'));
const PublishTemplatesBuild = lazy(() => import('@/views/publish/templates/build'));
const PublishTemplatesDeployment = lazy(() => import('@/views/publish/templates/deployment'));
const PublishConfigEnv = lazy(() => import('@/views/publish/config/env'));
const PublishConfigRegistry = lazy(() => import('@/views/publish/config/registry'));
const PublishConfigVendor = lazy(() => import('@/views/publish/config/vendor'));
const PublishConfigLanguage = lazy(() => import('@/views/publish/config/language'));
const PublishConfigGitRepo = lazy(() => import('@/views/publish/config/git-repo'));
const PublishConfigJenkinsPlatform = lazy(() => import('@/views/publish/config/jenkins-platform'));
const PublishConfigCredentials = lazy(() => import('@/views/publish/config/credentials'));

// Publish - Cluster Management (NEW)
const PublishClusterK8s = lazy(() => import('@/views/publish/cluster/k8s'));
const PublishClusterLinux = lazy(() => import('@/views/publish/cluster/linux'));

// Publish - Container Management (NEW)
const PublishContainerList = lazy(() => import('@/views/publish/container/list'));
const PublishContainerHistory = lazy(() => import('@/views/publish/container/history'));

// Gateway module
const GatewayRoutes = lazy(() => import('@/views/gateway/routes'));
const GatewayWhitelist = lazy(() => import('@/views/gateway/whitelist'));

// RAG module (ZebraRAG 知识库)
const RAGDocuments = lazy(() => import('@/views/rag/documents'));
const RAGCollections = lazy(() => import('@/views/rag/collections'));
const RAGQuery = lazy(() => import('@/views/rag/query'));

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
      // Publish
      { path: '/publish/applications', element: <RouteOutlet><PublishApplications /></RouteOutlet> },
      { path: '/publish/repos', element: <RouteOutlet><PublishRepos /></RouteOutlet> },
      { path: '/publish/tasks', element: <RouteOutlet><PublishTasks /></RouteOutlet> },
      { path: '/publish/tasks/:id', element: <RouteOutlet><PublishTaskDetail /></RouteOutlet> },
      { path: '/publish/templates/build', element: <RouteOutlet><PublishTemplatesBuild /></RouteOutlet> },
      { path: '/publish/templates/deployment', element: <RouteOutlet><PublishTemplatesDeployment /></RouteOutlet> },
      { path: '/publish/config/env', element: <RouteOutlet><PublishConfigEnv /></RouteOutlet> },
      { path: '/publish/config/registry', element: <RouteOutlet><PublishConfigRegistry /></RouteOutlet> },
      { path: '/publish/config/vendor', element: <RouteOutlet><PublishConfigVendor /></RouteOutlet> },
      { path: '/publish/config/language', element: <RouteOutlet><PublishConfigLanguage /></RouteOutlet> },
      { path: '/publish/config/gitplatform', element: <RouteOutlet><PublishConfigGitRepo /></RouteOutlet> },
      { path: '/publish/config/jenkinsplatform', element: <RouteOutlet><PublishConfigJenkinsPlatform /></RouteOutlet> },
      { path: '/publish/config/credentials', element: <RouteOutlet><PublishConfigCredentials /></RouteOutlet> },
      { path: '/publish/cluster/k8s', element: <RouteOutlet><PublishClusterK8s /></RouteOutlet> },
      { path: '/publish/cluster/linux', element: <RouteOutlet><PublishClusterLinux /></RouteOutlet> },
      { path: '/publish/container/list', element: <RouteOutlet><PublishContainerList /></RouteOutlet> },
      { path: '/publish/container/history', element: <RouteOutlet><PublishContainerHistory /></RouteOutlet> },
      // Backward-compat redirects for old container paths
      { path: '/publish/container/k8s', element: <Navigate to="/publish/cluster/k8s" replace /> },
      { path: '/publish/container/linux', element: <Navigate to="/publish/cluster/linux" replace /> },
      // Gateway
      { path: '/gateway/routes', element: <RouteOutlet><GatewayRoutes /></RouteOutlet> },
      { path: '/gateway/whitelist', element: <RouteOutlet><GatewayWhitelist /></RouteOutlet> },
      // RAG (ZebraRAG 知识库)
      { path: '/rag/documents', element: <RouteOutlet><RAGDocuments /></RouteOutlet> },
      { path: '/rag/collections', element: <RouteOutlet><RAGCollections /></RouteOutlet> },
      { path: '/rag/query', element: <RouteOutlet><RAGQuery /></RouteOutlet> }
    ]
  },
  // Redirects
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '*', element: <Navigate to="/404" replace /> }
];

export const router = createBrowserRouter(routeConfig);
