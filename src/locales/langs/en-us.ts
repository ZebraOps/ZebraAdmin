const enUS = {
  system: {
    title: 'ZebraOps',
    updateTitle: 'System Version Update Notification',
    updateContent: 'A new version has been detected. Refresh now?',
    updateConfirm: 'Refresh',
    updateCancel: 'Later'
  },
  common: {
    action: 'Action',
    add: 'Add',
    addSuccess: 'Added successfully',
    backToHome: 'Back to Home',
    batchDelete: 'Batch Delete',
    cancel: 'Cancel',
    close: 'Close',
    check: 'Check',
    expandColumn: 'Expand Column',
    columnSetting: 'Column Setting',
    config: 'Config',
    confirm: 'Confirm',
    delete: 'Delete',
    deleteSuccess: 'Deleted successfully',
    confirmDelete: 'Are you sure to delete?',
    edit: 'Edit',
    warning: 'Warning',
    error: 'Error',
    index: 'No.',
    keywordSearch: 'Enter keyword to search',
    logout: 'Logout',
    logoutConfirm: 'Are you sure to logout?',
    lookForward: 'Coming soon',
    modify: 'Modify',
    modifySuccess: 'Modified successfully',
    noData: 'No Data',
    operate: 'Operate',
    pleaseCheckValue: 'Please check the input value',
    refresh: 'Refresh',
    reset: 'Reset',
    search: 'Search',
    switch: 'Switch',
    tip: 'Tip',
    trigger: 'Trigger',
    update: 'Update',
    updateSuccess: 'Updated successfully',
    userCenter: 'User Center',
    myRoles: 'My Roles',
    myComponents: 'My Component Permissions',
    noRoleData: 'No role data',
    noComponentData: 'No component permission data',
    allComponents: 'All Components',
    superAdmin: 'Super Administrator',
    yesOrNo: {
      yes: 'Yes',
      no: 'No'
    }
  },
  request: {
    logout: 'Logout after request failed',
    logoutMsg: 'User session expired, please login again',
    logoutWithModal: 'Show modal before logout',
    logoutWithModalMsg: 'User session expired, please login again',
    refreshToken: 'Token expired, refreshing...',
    tokenExpired: 'Token expired'
  },
  route: {
    login: 'Login',
    '403': 'Forbidden',
    '404': 'Not Found',
    '500': 'Server Error',
    'iframe-page': 'Iframe Page',
    home: 'Dashboard',
    org: 'Organization',
    org_dept: 'Departments',
    org_users: 'Users',
    org_positions: 'Positions',
    org_job: 'Jobs',
    permission: 'Permissions',
    permission_author: 'Role Authorization',
    permission_groups: 'Groups',
    permission_menus: 'Menus',
    permission_roles: 'Roles',
    permission_component: 'Components',
    permission_functions: 'Functions',
    system: 'System',
    system_users: 'Users',
    system_roles: 'Roles',
    system_author: 'Authorization',
    system_menus: 'Menus',
    system_groups: 'Groups',
    publish: 'CI/CD',
    publish_repos: 'Repositories',
    publish_tasks: 'Build Tasks',
    publish_templates: 'Templates',
    publish_templates_build: 'Build Templates',
    publish_templates_deployment: 'Deploy Templates',
    publish_applications: 'Applications',
    publish_config: 'Configuration',
    publish_config_env: 'Env List',
    publish_config_vendor: 'Cloud Vendor',
        publish_config_language: 'Languages',
    publish_config_gitplatform: 'Git Platform',
    publish_config_jenkinsplatform: 'Jenkins',
    publish_config_credentials: 'Jenkins Credentials',
    publish_config_registry: 'Image Registry',
    registry_type_v2: 'Standard V2',
    registry_type_harbor: 'Harbor',
    registry_type_acr: 'Alibaba ACR',
    registry_project: 'Registry Project',
    publish_container: 'Containers',
    publish_container_k8s: 'K8s Clusters',
    publish_container_linux: 'Linux Nodes',
    gateway: 'Gateway',
    gateway_routes: 'Routes',
    gateway_whitelist: 'Whitelist'
  },
  page: {
    login: {
      common: {
        loginOrRegister: 'Login / Register',
        userNamePlaceholder: 'Enter username',
        passwordPlaceholder: 'Enter password',
        loginSuccess: 'Login successful',
        welcomeBack: 'Welcome back, {{userName}}!'
      },
      pwdLogin: {
        title: 'Password Login',
        rememberMe: 'Remember me',
        forgetPassword: 'Forgot password?'
      }
    },
    home: {
      greeting: 'Good morning, {{userName}}! Have a productive day!',
      projectCount: 'Projects',
      todo: 'Todos',
      message: 'Messages',
      visitCount: 'Visits'
    }
  },
  form: {
    required: 'This field is required',
    userName: {
      required: 'Please enter username',
      invalid: 'Invalid username format'
    },
    pwd: {
      required: 'Please enter password',
      invalid: 'Invalid password format (6-18 characters)'
    }
  },
  dropdown: {
    closeCurrent: 'Close',
    closeOther: 'Close Others',
    closeLeft: 'Close Left',
    closeRight: 'Close Right',
    closeAll: 'Close All'
  },
  icon: {
    themeConfig: 'Theme',
    themeSchema: 'Color Scheme',
    lang: 'Switch Language',
    fullscreen: 'Fullscreen',
    fullscreenExit: 'Exit Fullscreen',
    reload: 'Reload',
    collapse: 'Collapse',
    expand: 'Expand',
    globalSearch: 'Global Search'
  },
  theme: {
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    primaryColor: 'Primary Color'
  }
};

export default enUS;
