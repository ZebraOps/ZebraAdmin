const zhCN = {
  system: {
    title: '斑马运维',
    updateTitle: '系统版本更新通知',
    updateContent: '检测到系统有新版本发布，是否立即刷新页面？',
    updateConfirm: '立即刷新',
    updateCancel: '稍后再说'
  },
  common: {
    action: '操作',
    add: '新增',
    addSuccess: '添加成功',
    backToHome: '返回首页',
    batchDelete: '批量删除',
    cancel: '取消',
    close: '关闭',
    check: '勾选',
    expandColumn: '展开列',
    columnSetting: '列设置',
    config: '配置',
    confirm: '确认',
    delete: '删除',
    deleteSuccess: '删除成功',
    confirmDelete: '确认删除吗？',
    edit: '编辑',
    warning: '警告',
    error: '错误',
    index: '序号',
    keywordSearch: '请输入关键词搜索',
    logout: '退出登录',
    logoutConfirm: '确认退出登录吗？',
    lookForward: '敬请期待',
    modify: '修改',
    modifySuccess: '修改成功',
    noData: '无数据',
    operate: '操作',
    pleaseCheckValue: '请检查输入的值是否合法',
    refresh: '刷新',
    reset: '重置',
    search: '搜索',
    switch: '切换',
    tip: '提示',
    trigger: '触发',
    update: '更新',
    updateSuccess: '更新成功',
    userCenter: '个人中心',
    myRoles: '我的角色',
    myComponents: '我的组件权限',
    noRoleData: '暂无角色数据',
    noComponentData: '暂无组件权限数据',
    allComponents: '全部组件权限',
    superAdmin: '超级管理员',
    yesOrNo: {
      yes: '是',
      no: '否'
    }
  },
  request: {
    logout: '请求失败后登出用户',
    logoutMsg: '用户状态失效，请重新登录',
    logoutWithModal: '请求失败后弹出模态框再登出用户',
    logoutWithModalMsg: '用户状态失效，请重新登录',
    refreshToken: '请求的token已过期，刷新token',
    tokenExpired: 'token已过期'
  },
  route: {
    login: '登录',
    '403': '无权限',
    '404': '页面不存在',
    '500': '服务器错误',
    'iframe-page': '外链页面',
    home: '首页',
    org: '企业组织',
    org_dept: '组织管理',
    org_users: '用户管理',
    org_positions: '职务管理',
    org_job: '岗位管理',
    permission: '菜单权限',
    permission_author: '角色授权',
    permission_groups: '分组管理',
    permission_menus: '菜单管理',
    permission_roles: '角色管理',
    permission_component: '组件管理',
    permission_functions: '功能管理',
    system: '系统管理',
    system_users: '用户管理',
    system_roles: '角色管理',
    system_author: '角色授权',
    system_menus: '菜单管理',
    system_groups: '分组管理',
    publish: '发布中心',
    publish_repos: '项目管理',
    publish_tasks: '构建任务',
    publish_templates: '模板配置',
    publish_templates_build: '构建模板',
    publish_templates_deployment: '部署模板',
    publish_applications: '应用管理',
    publish_config: '配置管理',
    publish_config_env: '环境列表',
    publish_config_vendor: '云厂商',
        publish_config_language: '开发语言',
    publish_config_gitplatform: 'Git平台配置',
    publish_config_jenkinsplatform: 'Jenkins平台',
    publish_config_credentials: 'Jenkins凭据',
    publish_config_registry: '镜像仓库',
    registry_type_v2: '标准 V2',
    registry_type_harbor: 'Harbor',
    registry_type_acr: '阿里云 ACR',
    registry_project: '仓库项目',
    publish_container: '容器管理',
    publish_container_k8s: 'K8s集群管理',
    publish_container_linux: 'Linux节点管理',
    gateway: '网关配置',
    gateway_routes: '路由管理',
    gateway_whitelist: '白名单管理',
    rag: '知识库',
    rag_query: '智能问答',
    rag_documents: '文档管理',
    rag_collections: '集合管理'
  },
  page: {
    login: {
      common: {
        loginOrRegister: '登录 / 注册',
        userNamePlaceholder: '请输入用户名',
        passwordPlaceholder: '请输入密码',
        loginSuccess: '登录成功',
        welcomeBack: '欢迎回来，{{userName}} ！'
      },
      pwdLogin: {
        title: '密码登录',
        rememberMe: '记住我',
        forgetPassword: '忘记密码？'
      }
    },
    home: {
      greeting: '早安，{{userName}}, 今天又是充满活力的一天！',
      projectCount: '项目数',
      todo: '待办',
      message: '消息',
      visitCount: '访问量'
    }
  },
  form: {
    required: '不能为空',
    userName: {
      required: '请输入用户名',
      invalid: '用户名格式不正确'
    },
    pwd: {
      required: '请输入密码',
      invalid: '密码格式不正确，6-18位字符'
    }
  },
  dropdown: {
    closeCurrent: '关闭',
    closeOther: '关闭其它',
    closeLeft: '关闭左侧',
    closeRight: '关闭右侧',
    closeAll: '关闭所有'
  },
  icon: {
    themeConfig: '主题配置',
    themeSchema: '主题模式',
    lang: '切换语言',
    fullscreen: '全屏',
    fullscreenExit: '退出全屏',
    reload: '刷新页面',
    collapse: '折叠菜单',
    expand: '展开菜单',
    globalSearch: '全局搜索'
  },
  theme: {
    light: '浅色',
    dark: '深色',
    auto: '跟随系统',
    primaryColor: '主题色'
  }
};

export default zhCN;
