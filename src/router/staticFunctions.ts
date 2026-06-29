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

  // === CICD 发布管理 - 仓库 ===
  { func_name: '获取仓库列表', uri: '/cicd/api/repos', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建仓库', uri: '/cicd/api/repos', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取仓库详情', uri: '/cicd/api/repos/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新仓库', uri: '/cicd/api/repos/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除仓库', uri: '/cicd/api/repos/{id}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '获取仓库GitLab地址', uri: '/cicd/api/repos/gitlab-url/{repoID}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '获取仓库关联模板', uri: '/cicd/api/repos/{id}/templates', method_type: 'GET', group_name: '发布功能' },

  // === CICD 发布管理 - 应用 ===
  { func_name: '获取应用列表', uri: '/cicd/api/applications', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建应用', uri: '/cicd/api/applications', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取应用详情', uri: '/cicd/api/applications/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新应用', uri: '/cicd/api/applications/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除应用', uri: '/cicd/api/applications/{id}', method_type: 'DELETE', group_name: '发布功能' },

  // === CICD 发布管理 - 应用部署配置 ===
  { func_name: '获取应用部署配置列表', uri: '/cicd/api/application/template', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建应用部署配置', uri: '/cicd/api/application/template', method_type: 'POST', group_name: '发布功能' },
  { func_name: '按环境获取部署配置', uri: '/cicd/api/application/template/environment', method_type: 'GET', group_name: '发布功能' },
  { func_name: '获取部署配置详情', uri: '/cicd/api/application/template/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新部署配置', uri: '/cicd/api/application/template/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除部署配置', uri: '/cicd/api/application/template/{id}', method_type: 'DELETE', group_name: '发布功能' },

  // === CICD 发布管理 - 发布任务 ===
  { func_name: '获取发布任务列表', uri: '/cicd/api/deploys', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建发布任务', uri: '/cicd/api/deploys', method_type: 'POST', group_name: '发布功能' },
  { func_name: '批量删除发布任务', uri: '/cicd/api/deploys/batch-delete', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取可用模板', uri: '/cicd/api/deploys/templates', method_type: 'GET', group_name: '发布功能' },
  { func_name: '获取发布任务详情', uri: '/cicd/api/deploys/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '获取任务控制台输出', uri: '/cicd/api/deploys/{id}/console', method_type: 'GET', group_name: '发布功能' },
  { func_name: '删除发布任务', uri: '/cicd/api/deploys/{id}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '流式获取任务日志', uri: '/cicd/api/deploys/{id}/console/stream', method_type: 'GET', group_name: '发布功能' },

  // === CICD 发布管理 - 构建模板 ===
  { func_name: '获取构建模板列表', uri: '/cicd/api/templates/build', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建构建模板', uri: '/cicd/api/templates/build', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取构建模板详情', uri: '/cicd/api/templates/build/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新构建模板', uri: '/cicd/api/templates/build/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除构建模板', uri: '/cicd/api/templates/build/{id}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '获取构建模板历史', uri: '/cicd/api/templates/build/{id}/history', method_type: 'GET', group_name: '发布功能' },
  { func_name: '关联仓库和构建模板', uri: '/cicd/api/templates/build/{id}/repos/{repoId}', method_type: 'POST', group_name: '发布功能' },
  { func_name: '取消仓库和构建模板关联', uri: '/cicd/api/templates/build/{id}/repos/{repoId}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '回退构建模板', uri: '/cicd/api/templates/build/{id}/rollback/{historyId}', method_type: 'POST', group_name: '发布功能' },

  // === CICD 发布管理 - 部署模板 ===
  { func_name: '获取部署模板列表', uri: '/cicd/api/templates/deployment', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建部署模板', uri: '/cicd/api/templates/deployment', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取部署模板详情', uri: '/cicd/api/templates/deployment/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新部署模板', uri: '/cicd/api/templates/deployment/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除部署模板', uri: '/cicd/api/templates/deployment/{id}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '获取部署模板历史', uri: '/cicd/api/templates/deployment/{id}/history', method_type: 'GET', group_name: '发布功能' },
  { func_name: '关联仓库和部署模板', uri: '/cicd/api/templates/deployment/{id}/repos/{repoId}', method_type: 'POST', group_name: '发布功能' },
  { func_name: '取消仓库和部署模板关联', uri: '/cicd/api/templates/deployment/{id}/repos/{repoId}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '获取部署模板关联仓库', uri: '/cicd/api/templates/deployment/{id}/repos', method_type: 'GET', group_name: '发布功能' },
  { func_name: '回退部署模板', uri: '/cicd/api/templates/deployment/{id}/rollback/{historyId}', method_type: 'POST', group_name: '发布功能' },

  // === CICD 发布管理 - K8s集群 ===
  { func_name: '获取K8s集群列表', uri: '/cicd/api/k8s/clusters', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建K8s集群', uri: '/cicd/api/k8s/clusters', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取K8s集群详情', uri: '/cicd/api/k8s/clusters/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新K8s集群', uri: '/cicd/api/k8s/clusters/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除K8s集群', uri: '/cicd/api/k8s/clusters/{id}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '测试K8s集群连接', uri: '/cicd/api/k8s/clusters/{id}/connect', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取K8s集群Pod列表', uri: '/cicd/api/k8s/clusters/{id}/pods', method_type: 'GET', group_name: '发布功能' },

  // === CICD 发布管理 - Linux主机 ===
  { func_name: '获取服务器列表', uri: '/cicd/api/linux-machines', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建服务器', uri: '/cicd/api/linux-machines', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取服务器详情', uri: '/cicd/api/linux-machines/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新服务器', uri: '/cicd/api/linux-machines/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除服务器', uri: '/cicd/api/linux-machines/{id}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '测试服务器连接', uri: '/cicd/api/linux-machines/{id}/connect', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取服务器容器列表', uri: '/cicd/api/linux-machines/{id}/containers', method_type: 'GET', group_name: '发布功能' },

  // === CICD 发布管理 - 容器操作 ===
  { func_name: '在容器中执行命令', uri: '/cicd/api/servers/{id}/containers/{containerID}/exec', method_type: 'POST', group_name: '发布功能' },
  { func_name: '连接到容器终端', uri: '/cicd/api/servers/{id}/containers/{containerID}/attach', method_type: 'GET', group_name: '发布功能' },

  // === CICD 发布管理 - K8s容器操作 ===
  { func_name: '重启K8s Deployment', uri: '/cicd/api/k8s/clusters/{id}/deployments/{name}/restart', method_type: 'POST', group_name: '发布功能' },
  { func_name: '删除K8s Pod', uri: '/cicd/api/k8s/clusters/{id}/pods/{podName}', method_type: 'DELETE', group_name: '发布功能' },

  // === CICD 发布管理 - Docker容器操作 ===
  { func_name: '重启Docker容器', uri: '/cicd/api/servers/{id}/containers/{containerID}/restart', method_type: 'POST', group_name: '发布功能' },
  { func_name: '删除Docker容器', uri: '/cicd/api/servers/{id}/containers/{containerID}', method_type: 'DELETE', group_name: '发布功能' },

  // === CICD 发布管理 - 容器操作历史 ===
  { func_name: '获取容器操作历史列表', uri: '/cicd/api/container-operations', method_type: 'GET', group_name: '发布功能' },
  { func_name: '记录容器操作历史', uri: '/cicd/api/container-operations', method_type: 'POST', group_name: '发布功能' },

  // === CICD 发布管理 - 环境 ===
  { func_name: '获取环境列表', uri: '/cicd/api/environments', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建环境', uri: '/cicd/api/environments', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取环境详情', uri: '/cicd/api/environments/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新环境', uri: '/cicd/api/environments/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除环境', uri: '/cicd/api/environments/{id}', method_type: 'DELETE', group_name: '发布功能' },

  // === CICD 发布管理 - 云厂商 ===
  { func_name: '获取云厂商列表', uri: '/cicd/api/vendors', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建云厂商', uri: '/cicd/api/vendors', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取云厂商详情', uri: '/cicd/api/vendors/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新云厂商', uri: '/cicd/api/vendors/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除云厂商', uri: '/cicd/api/vendors/{id}', method_type: 'DELETE', group_name: '发布功能' },

  // === CICD 发布管理 - 镜像仓库 ===
  { func_name: '获取镜像仓库列表', uri: '/cicd/api/image-registries', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建镜像仓库', uri: '/cicd/api/image-registries', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取镜像仓库详情', uri: '/cicd/api/image-registries/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新镜像仓库', uri: '/cicd/api/image-registries/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除镜像仓库', uri: '/cicd/api/image-registries/{id}', method_type: 'DELETE', group_name: '发布功能' },

  // === CICD 发布管理 - 开发语言 ===
  { func_name: '获取语言列表', uri: '/cicd/api/languages', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建语言', uri: '/cicd/api/languages', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取语言详情', uri: '/cicd/api/languages/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新语言', uri: '/cicd/api/languages/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除语言', uri: '/cicd/api/languages/{id}', method_type: 'DELETE', group_name: '发布功能' },

  // === CICD 发布管理 - Git平台配置 ===
  { func_name: '获取Git平台配置列表', uri: '/cicd/api/git-platforms', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建Git平台配置', uri: '/cicd/api/git-platforms', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取Git平台配置详情', uri: '/cicd/api/git-platforms/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新Git平台配置', uri: '/cicd/api/git-platforms/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除Git平台配置', uri: '/cicd/api/git-platforms/{id}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '测试Git平台连接', uri: '/cicd/api/git-platforms/{id}/connect', method_type: 'POST', group_name: '发布功能' },

  // === CICD 发布管理 - Jenkins平台配置 ===
  { func_name: '获取Jenkins平台列表', uri: '/cicd/api/jenkins-platforms', method_type: 'GET', group_name: '发布功能' },
  { func_name: '创建Jenkins平台', uri: '/cicd/api/jenkins-platforms', method_type: 'POST', group_name: '发布功能' },
  { func_name: '获取Jenkins平台详情', uri: '/cicd/api/jenkins-platforms/{id}', method_type: 'GET', group_name: '发布功能' },
  { func_name: '更新Jenkins平台', uri: '/cicd/api/jenkins-platforms/{id}', method_type: 'PUT', group_name: '发布功能' },
  { func_name: '删除Jenkins平台', uri: '/cicd/api/jenkins-platforms/{id}', method_type: 'DELETE', group_name: '发布功能' },
  { func_name: '测试Jenkins连接', uri: '/cicd/api/jenkins-platforms/{id}/connect', method_type: 'POST', group_name: '发布功能' },
];
