/** ZebraRBAC 所有 API 端点的静态功能定义，用于同步到功能权限数据库 */
export interface StaticFunction {
  func_name: string;
  uri: string;
  method_type: 'GET' | 'POST' | 'PUT' | 'DELETE';
  group_name: string;
}

export const staticFunctions: StaticFunction[] = [
  // === 登录认证 ===
  { func_name: '用户登录', uri: '/rbac/login', method_type: 'POST', group_name: '功能管理' },

  // === 用户管理 ===
  { func_name: '获取用户列表', uri: '/rbac/users', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建用户', uri: '/rbac/users', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取用户详情', uri: '/rbac/users/{user_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新用户', uri: '/rbac/users/{user_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除用户', uri: '/rbac/users/{user_id}', method_type: 'DELETE', group_name: '功能管理' },

  // === 角色权限 ===
  { func_name: '获取角色列表', uri: '/rbac/roles', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建角色', uri: '/rbac/roles', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取角色详情', uri: '/rbac/roles/{role_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新角色', uri: '/rbac/roles/{role_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除角色', uri: '/rbac/roles/{role_id}', method_type: 'DELETE', group_name: '功能管理' },
  { func_name: '获取角色用户', uri: '/rbac/roles/{role_id}/users', method_type: 'GET', group_name: '功能管理' },
  { func_name: '分配角色用户', uri: '/rbac/roles/{role_id}/users', method_type: 'POST', group_name: '功能管理' },
  { func_name: '移除角色用户', uri: '/rbac/roles/{role_id}/users', method_type: 'DELETE', group_name: '功能管理' },
  { func_name: '获取角色菜单', uri: '/rbac/roles/{role_id}/menus', method_type: 'GET', group_name: '功能管理' },
  { func_name: '分配角色菜单', uri: '/rbac/roles/{role_id}/menus', method_type: 'POST', group_name: '功能管理' },
  { func_name: '移除角色菜单', uri: '/rbac/roles/{role_id}/menus', method_type: 'DELETE', group_name: '功能管理' },
  { func_name: '获取角色功能', uri: '/rbac/roles/{role_id}/functions', method_type: 'GET', group_name: '功能管理' },
  { func_name: '分配角色功能', uri: '/rbac/roles/{role_id}/functions', method_type: 'POST', group_name: '功能管理' },
  { func_name: '移除角色功能', uri: '/rbac/roles/{role_id}/functions', method_type: 'DELETE', group_name: '功能管理' },
  { func_name: '获取角色组件', uri: '/rbac/roles/{role_id}/components', method_type: 'GET', group_name: '功能管理' },
  { func_name: '分配角色组件', uri: '/rbac/roles/{role_id}/components', method_type: 'POST', group_name: '功能管理' },
  { func_name: '移除角色组件', uri: '/rbac/roles/{role_id}/components', method_type: 'DELETE', group_name: '功能管理' },

  // === 菜单管理 ===
  { func_name: '获取菜单列表', uri: '/rbac/menus', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建菜单', uri: '/rbac/menus', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取菜单树', uri: '/rbac/menus/tree', method_type: 'GET', group_name: '功能管理' },
  { func_name: '同步菜单', uri: '/rbac/menus/sync', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取菜单详情', uri: '/rbac/menus/{menu_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新菜单', uri: '/rbac/menus/{menu_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除菜单', uri: '/rbac/menus/{menu_id}', method_type: 'DELETE', group_name: '功能管理' },

  // === 功能管理 ===
  { func_name: '获取功能列表', uri: '/rbac/functions', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建功能', uri: '/rbac/functions', method_type: 'POST', group_name: '功能管理' },
  { func_name: '同步功能', uri: '/rbac/functions/sync', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取功能详情', uri: '/rbac/functions/{func_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新功能', uri: '/rbac/functions/{func_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除功能', uri: '/rbac/functions/{func_id}', method_type: 'DELETE', group_name: '功能管理' },

  // === 分组管理 ===
  { func_name: '获取分组列表', uri: '/rbac/groups', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建分组', uri: '/rbac/groups', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取分组详情', uri: '/rbac/groups/{group_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新分组', uri: '/rbac/groups/{group_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除分组', uri: '/rbac/groups/{group_id}', method_type: 'DELETE', group_name: '功能管理' },

  // === 组件管理 ===
  { func_name: '获取组件列表', uri: '/rbac/components', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建组件', uri: '/rbac/components', method_type: 'POST', group_name: '功能管理' },
  { func_name: '同步组件', uri: '/rbac/components/sync', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取组件详情', uri: '/rbac/components/{comp_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新组件', uri: '/rbac/components/{comp_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除组件', uri: '/rbac/components/{comp_id}', method_type: 'DELETE', group_name: '功能管理' },

  // === 组织管理 ===
  { func_name: '获取组织列表', uri: '/rbac/organizations', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建组织', uri: '/rbac/organizations', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取组织详情', uri: '/rbac/organizations/{org_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新组织', uri: '/rbac/organizations/{org_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除组织', uri: '/rbac/organizations/{org_id}', method_type: 'DELETE', group_name: '功能管理' },
  { func_name: '获取岗位列表', uri: '/rbac/positions', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建岗位', uri: '/rbac/positions', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取岗位详情', uri: '/rbac/positions/{position_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新岗位', uri: '/rbac/positions/{position_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除岗位', uri: '/rbac/positions/{position_id}', method_type: 'DELETE', group_name: '功能管理' },
  { func_name: '获取职务列表', uri: '/rbac/jobs', method_type: 'GET', group_name: '功能管理' },
  { func_name: '创建职务', uri: '/rbac/jobs', method_type: 'POST', group_name: '功能管理' },
  { func_name: '获取职务详情', uri: '/rbac/jobs/{job_id}', method_type: 'GET', group_name: '功能管理' },
  { func_name: '更新职务', uri: '/rbac/jobs/{job_id}', method_type: 'PUT', group_name: '功能管理' },
  { func_name: '删除职务', uri: '/rbac/jobs/{job_id}', method_type: 'DELETE', group_name: '功能管理' },
  { func_name: '获取用户组织关系', uri: '/rbac/user-organizations', method_type: 'GET', group_name: '功能管理' },
  { func_name: '绑定用户组织', uri: '/rbac/user-organizations', method_type: 'POST', group_name: '功能管理' },
  { func_name: '解绑用户组织', uri: '/rbac/user-organizations', method_type: 'DELETE', group_name: '功能管理' },

  // === 授权管理 ===
  { func_name: '获取授权信息', uri: '/rbac/authorization', method_type: 'GET', group_name: '功能管理' },

  // === 路由管理 ===
  { func_name: '获取前端路由', uri: '/rbac/route', method_type: 'GET', group_name: '功能管理' },
];
