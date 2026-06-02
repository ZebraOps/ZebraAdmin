// 静态组件权限注册表
// 命名规范：{module}_{entity}_{action}，如 org_user_add、permission_role_delete
// 仅注册“操作类”按钮，查看/搜索不需要组件权限

export interface StaticComponent {
  component_name: string;
  comp_desc: string;
  group_name: string;
}

export const staticComponents: StaticComponent[] = [
  // 组织管理
  { component_name: 'org_user_add', comp_desc: '组织-新增用户', group_name: '组织管理' },
  { component_name: 'org_user_edit', comp_desc: '组织-编辑用户', group_name: '组织管理' },
  { component_name: 'org_user_delete', comp_desc: '组织-删除用户', group_name: '组织管理' },
  { component_name: 'org_dept_add', comp_desc: '组织-新增部门', group_name: '组织管理' },
  { component_name: 'org_dept_edit', comp_desc: '组织-编辑部门', group_name: '组织管理' },
  { component_name: 'org_dept_delete', comp_desc: '组织-删除部门', group_name: '组织管理' },
  { component_name: 'org_job_add', comp_desc: '组织-新增岗位', group_name: '组织管理' },
  { component_name: 'org_job_edit', comp_desc: '组织-编辑岗位', group_name: '组织管理' },
  { component_name: 'org_job_delete', comp_desc: '组织-删除岗位', group_name: '组织管理' },
  { component_name: 'org_position_add', comp_desc: '组织-新增职位', group_name: '组织管理' },
  { component_name: 'org_position_edit', comp_desc: '组织-编辑职位', group_name: '组织管理' },
  { component_name: 'org_position_delete', comp_desc: '组织-删除职位', group_name: '组织管理' },

  // 权限-分组
  { component_name: 'permission_group_add', comp_desc: '权限-新增分组', group_name: '权限管理' },
  { component_name: 'permission_group_edit', comp_desc: '权限-编辑分组', group_name: '权限管理' },
  { component_name: 'permission_group_delete', comp_desc: '权限-删除分组', group_name: '权限管理' },

  // 权限-角色
  { component_name: 'permission_role_add', comp_desc: '权限-新增角色', group_name: '权限管理' },
  { component_name: 'permission_role_edit', comp_desc: '权限-编辑角色', group_name: '权限管理' },
  { component_name: 'permission_role_delete', comp_desc: '权限-删除角色', group_name: '权限管理' },

  // 权限-菜单
  { component_name: 'permission_menu_add', comp_desc: '权限-新增菜单', group_name: '权限管理' },
  { component_name: 'permission_menu_edit', comp_desc: '权限-编辑菜单', group_name: '权限管理' },
  { component_name: 'permission_menu_delete', comp_desc: '权限-删除菜单', group_name: '权限管理' },
  { component_name: 'permission_menu_sync', comp_desc: '权限-同步菜单', group_name: '权限管理' },

  // 权限-功能
  { component_name: 'permission_function_add', comp_desc: '权限-新增功能', group_name: '权限管理' },
  { component_name: 'permission_function_edit', comp_desc: '权限-编辑功能', group_name: '权限管理' },
  { component_name: 'permission_function_delete', comp_desc: '权限-删除功能', group_name: '权限管理' },
  { component_name: 'permission_function_sync', comp_desc: '权限-同步功能', group_name: '权限管理' },

  // 权限-组件
  { component_name: 'permission_component_add', comp_desc: '权限-新增组件', group_name: '权限管理' },
  { component_name: 'permission_component_edit', comp_desc: '权限-编辑组件', group_name: '权限管理' },
  { component_name: 'permission_component_delete', comp_desc: '权限-删除组件', group_name: '权限管理' },
  { component_name: 'permission_component_sync', comp_desc: '权限-同步组件', group_name: '权限管理' },

  // 网关-路由
  { component_name: 'gateway_route_add', comp_desc: '网关-新增路由', group_name: '网关管理' },
  { component_name: 'gateway_route_edit', comp_desc: '网关-编辑路由', group_name: '网关管理' },
  { component_name: 'gateway_route_delete', comp_desc: '网关-删除路由', group_name: '网关管理' },
  { component_name: 'gateway_route_reload', comp_desc: '网关-重载路由', group_name: '网关管理' },

  // 网关-白名单
  { component_name: 'gateway_whitelist_add', comp_desc: '网关-新增白名单', group_name: '网关管理' },
  { component_name: 'gateway_whitelist_delete', comp_desc: '网关-删除白名单', group_name: '网关管理' },

  // 发布管理 - 仓库
  { component_name: 'publish_repo_add', comp_desc: '发布-新增仓库', group_name: '发布管理' },
  { component_name: 'publish_repo_edit', comp_desc: '发布-编辑仓库', group_name: '发布管理' },
  { component_name: 'publish_repo_delete', comp_desc: '发布-删除仓库', group_name: '发布管理' },
  { component_name: 'publish_repo_sync', comp_desc: '发布-同步仓库(GitLab)', group_name: '发布管理' },

  // 发布管理 - 应用
  { component_name: 'publish_app_add', comp_desc: '发布-新增应用', group_name: '发布管理' },
  { component_name: 'publish_app_edit', comp_desc: '发布-编辑应用', group_name: '发布管理' },
  { component_name: 'publish_app_delete', comp_desc: '发布-删除应用', group_name: '发布管理' },
  { component_name: 'publish_app_deploy_add', comp_desc: '发布-新增部署配置', group_name: '发布管理' },
  { component_name: 'publish_app_deploy_edit', comp_desc: '发布-编辑部署配置', group_name: '发布管理' },
  { component_name: 'publish_app_deploy_delete', comp_desc: '发布-删除部署配置', group_name: '发布管理' },

  // 发布管理 - 发布任务
  { component_name: 'publish_task_add', comp_desc: '发布-创建任务', group_name: '发布管理' },
  { component_name: 'publish_task_delete', comp_desc: '发布-删除任务', group_name: '发布管理' },
  { component_name: 'publish_task_batch_delete', comp_desc: '发布-批量删除任务', group_name: '发布管理' },

  // 发布管理 - 构建模板
  { component_name: 'publish_build_template_add', comp_desc: '发布-新增构建模板', group_name: '发布管理' },
  { component_name: 'publish_build_template_edit', comp_desc: '发布-编辑构建模板', group_name: '发布管理' },
  { component_name: 'publish_build_template_delete', comp_desc: '发布-删除构建模板', group_name: '发布管理' },

  // 发布管理 - 部署模板
  { component_name: 'publish_deploy_template_add', comp_desc: '发布-新增部署模板', group_name: '发布管理' },
  { component_name: 'publish_deploy_template_edit', comp_desc: '发布-编辑部署模板', group_name: '发布管理' },
  { component_name: 'publish_deploy_template_delete', comp_desc: '发布-删除部署模板', group_name: '发布管理' },

  // 发布管理 - K8s集群
  { component_name: 'publish_k8s_add', comp_desc: '发布-新增K8s集群', group_name: '发布管理' },
  { component_name: 'publish_k8s_edit', comp_desc: '发布-编辑K8s集群', group_name: '发布管理' },
  { component_name: 'publish_k8s_delete', comp_desc: '发布-删除K8s集群', group_name: '发布管理' },

  // 发布管理 - Linux主机
  { component_name: 'publish_linux_add', comp_desc: '发布-新增主机', group_name: '发布管理' },
  { component_name: 'publish_linux_edit', comp_desc: '发布-编辑主机', group_name: '发布管理' },
  { component_name: 'publish_linux_delete', comp_desc: '发布-删除主机', group_name: '发布管理' },
  { component_name: 'publish_linux_connect', comp_desc: '发布-测试主机连接', group_name: '发布管理' },

  // 发布管理 - 环境
  { component_name: 'publish_env_add', comp_desc: '发布-新增环境', group_name: '发布管理' },
  { component_name: 'publish_env_edit', comp_desc: '发布-编辑环境', group_name: '发布管理' },
  { component_name: 'publish_env_delete', comp_desc: '发布-删除环境', group_name: '发布管理' },

  // 发布管理 - 云厂商
  { component_name: 'publish_vendor_add', comp_desc: '发布-新增云厂商', group_name: '发布管理' },
  { component_name: 'publish_vendor_edit', comp_desc: '发布-编辑云厂商', group_name: '发布管理' },
  { component_name: 'publish_vendor_delete', comp_desc: '发布-删除云厂商', group_name: '发布管理' },

  // 发布管理 - 镜像仓库
  { component_name: 'publish_registry_add', comp_desc: '发布-新增镜像仓库', group_name: '发布管理' },
  { component_name: 'publish_registry_edit', comp_desc: '发布-编辑镜像仓库', group_name: '发布管理' },
  { component_name: 'publish_registry_delete', comp_desc: '发布-删除镜像仓库', group_name: '发布管理' },

  // 发布管理 - 开发语言
  { component_name: 'publish_language_add', comp_desc: '发布-新增语言', group_name: '发布管理' },
  { component_name: 'publish_language_edit', comp_desc: '发布-编辑语言', group_name: '发布管理' },
  { component_name: 'publish_language_delete', comp_desc: '发布-删除语言', group_name: '发布管理' },

  // 发布管理 - Git平台配置
  { component_name: 'publish_gitplatform_add', comp_desc: '发布-新增Git平台配置', group_name: '发布管理' },
  { component_name: 'publish_gitplatform_edit', comp_desc: '发布-编辑Git平台配置', group_name: '发布管理' },
  { component_name: 'publish_gitplatform_delete', comp_desc: '发布-删除Git平台配置', group_name: '发布管理' },
  { component_name: 'publish_gitplatform_connect', comp_desc: '发布-测试Git平台连接', group_name: '发布管理' },

  // 发布管理 - Jenkins平台配置
  { component_name: 'publish_jenkinsplatform_add', comp_desc: '发布-新增Jenkins平台', group_name: '发布管理' },
  { component_name: 'publish_jenkinsplatform_edit', comp_desc: '发布-编辑Jenkins平台', group_name: '发布管理' },
  { component_name: 'publish_jenkinsplatform_delete', comp_desc: '发布-删除Jenkins平台', group_name: '发布管理' },
  { component_name: 'publish_jenkinsplatform_connect', comp_desc: '发布-测试Jenkins连接', group_name: '发布管理' },
];
