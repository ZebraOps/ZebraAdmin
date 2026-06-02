import type { MenuNode } from '@/store/route';

/** Static fallback menus (mirrors elegant routes.ts) */
export const staticMenus: MenuNode[] = [
  {
    key: 'home',
    label: 'route.home',
    icon: 'mdi:monitor-dashboard',
    path: '/home',
    order: 1
  },
  {
    key: 'org',
    label: 'route.org',
    icon: 'mdi:account-group-outline',
    path: '/org',
    order: 2,
    children: [
      { key: 'org_dept', label: 'route.org_dept', icon: 'mdi:office-building-cog', path: '/org/dept' },
      { key: 'org_job', label: 'route.org_job', icon: 'ic:baseline-emoji-food-beverage', path: '/org/job' },
      { key: 'org_positions', label: 'route.org_positions', icon: 'ic:sharp-switch-account', path: '/org/positions' },
      { key: 'org_users', label: 'route.org_users', icon: 'mdi:account-cog', path: '/org/users' }
    ]
  },
  {
    key: 'permission',
    label: 'route.permission',
    icon: 'ic:baseline-lock-person',
    path: '/permission',
    order: 3,
    children: [
      { key: 'permission_author', label: 'route.permission_author', icon: 'ri:shield-user-fill', path: '/permission/author' },
      { key: 'permission_component', label: 'route.permission_component', icon: 'mdi:puzzle-edit', path: '/permission/component' },
      { key: 'permission_functions', label: 'route.permission_functions', icon: 'mdi:function', path: '/permission/functions' },
      { key: 'permission_groups', label: 'route.permission_groups', icon: 'ic:sharp-category', path: '/permission/groups' },
      { key: 'permission_menus', label: 'route.permission_menus', icon: 'mdi:card-bulleted', path: '/permission/menus' },
      { key: 'permission_roles', label: 'route.permission_roles', icon: 'ph:user-switch-fill', path: '/permission/roles' }
    ]
  },
  {
    key: 'publish',
    label: 'route.publish',
    icon: 'ic:baseline-rocket-launch',
    path: '/publish',
    order: 4,
    children: [
      { key: 'publish_repos', label: 'route.publish_repos', icon: 'mdi:source-repository', path: '/publish/repos', order: 1 },
      { key: 'publish_applications', label: 'route.publish_applications', icon: 'material-symbols:apps', path: '/publish/applications', order: 2 },
      { key: 'publish_tasks', label: 'route.publish_tasks', icon: 'mdi:rocket-launch', path: '/publish/tasks', order: 3 },
      {
        key: 'publish_templates',
        label: 'route.publish_templates',
        icon: 'ic:baseline-dashboard-customize',
        path: '/publish/templates',
        order: 4,
        children: [
          { key: 'publish_templates_build', label: 'route.publish_templates_build', icon: 'ic:baseline-playlist-add-check', path: '/publish/templates/build' },
          { key: 'publish_templates_deployment', label: 'route.publish_templates_deployment', icon: 'carbon:deployment-policy', path: '/publish/templates/deployment' }
        ]
      },
      {
        key: 'publish_config',
        label: 'route.publish_config',
        icon: 'ic:baseline-tune',
        path: '/publish/config',
        order: 5,
        children: [
          { key: 'publish_config_vendor', label: 'route.publish_config_vendor', icon: 'ic:baseline-cloud-sync', path: '/publish/config/vendor' },
          { key: 'publish_config_env', label: 'route.publish_config_env', icon: 'mdi:environment', path: '/publish/config/env' },
          { key: 'publish_config_language', label: 'route.publish_config_language', icon: 'mdi:code-tags', path: '/publish/config/language' },
          { key: 'publish_config_credentials', label: 'route.publish_config_credentials', icon: 'mdi:key-variant', path: '/publish/config/credentials' },
          { key: 'publish_config_registry', label: 'route.publish_config_registry', icon: 'carbon:container-registry', path: '/publish/config/registry' },
          { key: 'publish_config_gitplatform', label: 'route.publish_config_gitplatform', icon: 'mdi:source-branch', path: '/publish/config/gitplatform' },
          { key: 'publish_config_jenkinsplatform', label: 'route.publish_config_jenkinsplatform', icon: 'mdi:engine', path: '/publish/config/jenkinsplatform' },
        ]
      },
      {
        key: 'publish_container',
        label: 'route.publish_container',
        icon: 'ic:baseline-view-in-ar',
        path: '/publish/container',
        order: 6,
        children: [
          { key: 'publish_container_k8s', label: 'route.publish_container_k8s', icon: 'mdi:kubernetes', path: '/publish/container/k8s' },
          { key: 'publish_container_linux', label: 'route.publish_container_linux', icon: 'mdi:linux', path: '/publish/container/linux' }
        ]
      }
    ]
  },
  {
    key: 'gateway',
    label: 'route.gateway',
    icon: 'mdi:api',
    path: '/gateway',
    order: 5,
    children: [
      { key: 'gateway_routes', label: 'route.gateway_routes', icon: 'mdi:routes', path: '/gateway/routes', order: 1 },
      { key: 'gateway_whitelist', label: 'route.gateway_whitelist', icon: 'mdi:format-list-checks', path: '/gateway/whitelist', order: 2 }
    ]
  }
];
