# ZebraAdmin

[English](./README.en.md) | 中文

基于 React 19 + TypeScript + Vite 构建的现代化运维管理平台前端。

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign)

## ✨ 技术栈

| 分类      | 技术                                                                                      |
| --------- | ----------------------------------------------------------------------------------------- |
| 框架      | [React 19](https://react.dev/)                                                            |
| 构建工具  | [Vite 6](https://vitejs.dev/)                                                             |
| UI 组件库 | [Ant Design 5](https://ant.design/) + [Pro Components](https://procomponents.ant.design/) |
| 路由      | [React Router v7](https://reactrouter.com/)                                               |
| 状态管理  | [Zustand 5](https://zustand.docs.pmnd.rs/)                                                |
| CSS       | [Tailwind CSS v4](https://tailwindcss.com/)                                               |
| 国际化    | [react-i18next](https://react.i18next.com/)（支持中/英文切换）                            |
| 图表      | [Recharts](https://recharts.org/)                                                         |
| HTTP      | [Axios](https://axios-http.com/)                                                          |
| 多标签页  | [keepalive-for-react](https://github.com/irychen/keepalive-for-react)                     |

## 🗂️ 功能模块

- **工作台** — 数据统计仪表盘，构建/部署趋势图、状态饼图
- **组织管理** — 部门、岗位、职位、用户
- **权限管理（RBAC）** — 菜单、角色、功能权限、组件权限、用户组、授权管理
- **系统管理** — 系统菜单、角色、用户、用户组、授权
- **发布管理** — 应用、代码仓库、发布任务、构建/部署模板、环境配置、镜像仓库、云厂商、K8s 集群、Linux 主机
- **网关管理** — 路由规则、白名单

## 📁 项目结构

```
src/
├── assets/             # 静态资源
├── components/
│   └── CountdownButton.tsx  # 倒计时确认删除按钮（Popconfirm + 3s 倒计时）
├── hooks/
│   └── usePermission.ts     # 组件权限检查 Hook（hasComp 方法）
├── layouts/            # 布局组件
│   ├── BaseLayout.tsx  # 主布局（侧边栏 + 顶栏 + 多标签页）
│   ├── BlankLayout.tsx # 空白布局（登录页等）
│   └── components/     # GlobalSider / GlobalHeader / GlobalTab / GlobalBreadcrumb
├── locales/            # i18n 语言包（zh-CN / en-US）
├── router/
│   ├── routes.tsx      # 路由配置（懒加载）
│   ├── guard.tsx       # 路由守卫（鉴权 + 动态菜单注入）
│   ├── menus.ts        # 静态菜单（图标兜底数据源）
│   ├── staticComponents.ts  # 静态组件权限注册表（38 个按钮权限）
│   └── staticFunctions.ts   # 静态功能权限注册表
├── service/
│   ├── request/        # Axios 封装（拦截器统一处理 400/403 错误弹窗）
│   └── api/            # 模块化 API（auth / route / rbac / publish / gateway）
├── store/              # Zustand 状态
│   ├── auth.ts         # 登录态、用户信息、权限（functions/menus/components）
│   ├── route.ts        # 动态菜单、路由转换、图标兜底
│   ├── tab.ts          # 多标签页管理（首页始终置顶）
│   ├── app.ts          # 全局应用状态
│   └── theme.ts        # 主题切换
├── typings/            # 全局类型声明
├── views/              # 页面视图
│   ├── home/           # 工作台
│   ├── login/          # 登录
│   ├── error/          # 403 / 404 / 500
│   ├── org/            # 组织管理（已集成组件权限）
│   ├── permission/     # 权限管理（已集成组件权限）
│   ├── system/         # 系统管理
│   ├── publish/        # 发布管理
│   └── gateway/        # 网关管理（已集成组件权限）
└── App.tsx
```

## 🚀 快速开始

**环境要求：** Node.js ≥ 20，pnpm ≥ 9

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认端口 4120）
pnpm dev

# 类型检查
pnpm typecheck

# 生产构建
pnpm build

# 预览构建产物（端口 9725）
pnpm preview
```

## ⚙️ 环境变量

在项目根目录创建 `.env.local` 文件（已在 `.gitignore` 中）：

```env
# 后端服务地址
VITE_BASE_URL=http://localhost:8080
```

内置代理转发规则（`vite.config.ts`）：

| 前缀     | 用途          |
| -------- | ------------- |
| `/rbac`  | RBAC 权限服务 |
| `/admin` | 管理后台服务  |
| `/cicd`  | CI/CD 服务    |
| `/route` | 网关路由服务  |
| `/auth`  | 认证服务      |

## 🔌 后端服务

本项目配套以下后端服务（均在 ZebraOps 项目根目录）：

| 服务                                  | 说明                               |
| ------------------------------------- | ---------------------------------- |
| [ZebraRBAC](../ZebraRBAC)             | Python FastAPI，权限/用户/角色管理 |
| [ZebraCICD](../ZebraCICD)             | Go，CI/CD 流水线管理               |
| [ZebraGateway](../ZebraGateway)       | Go，API 网关管理                   |
| [ZebraDeployment](../ZebraDeployment) | Docker Compose 部署脚本            |

## 🔐 权限体系集成

前端与 ZebraRBAC + ZebraGateway 深度集成，实现三级权限控制：

### 鉴权流程

```
登录 → POST /rbac/login/access-token → JWT Token
    │
请求 → Authorization: Bearer <token>
    │
    ▼
ZebraGateway（:8080）
    ├── 白名单放行
    ├── JWT 验证 + RBAC 权限校验
    ├── 路径重写（/rbac/* → /api/*）
    └── 反向代理到上游服务
```

### 三级权限模型

| 级别     | 控制粒度               | 前端实现                                            |
| -------- | ---------------------- | --------------------------------------------------- |
| 功能权限 | API 接口（Method+URI） | 网关层拦截，前端无感知                              |
| 菜单权限 | 页面可见性             | 动态菜单 `getUserRoutes`，路由守卫自动注入          |
| 组件权限 | 按钮/元素可见性        | `usePermission().hasComp('permission_name')` 条件渲染 |

### 动态菜单

- 登录后调用 `GET /rbac/route/getUserRoutes` 获取当前用户可见菜单
- 后端自动补全祖先菜单（子菜单有权限则父菜单自动可见）
- 图标优先取后端返回值，为空时从静态菜单 `menus.ts` 兜底
- 首页（`/home`）对所有角色始终可见

### 组件权限系统

本项目实现了完整的**组件级别权限控制**，可以精确控制每个按钮的可见性：

#### 权限命名规范

格式：`{module}_{entity}_{action}`

| 模块       | 前缀         | 示例                                         |
| ---------- | ------------ | -------------------------------------------- |
| 组织管理   | `org_`       | `org_user_add`, `org_dept_edit`              |
| 权限管理   | `permission_`| `permission_role_delete`, `permission_menu_sync` |
| 网关管理   | `gateway_`   | `gateway_route_add`, `gateway_whitelist_delete` |
| 发布管理   | `publish_`   | `publish_app_deploy`, `publish_task_cancel`  |
| 系统管理   | `system_`    | `system_config_edit`                         |

#### 使用方式

```tsx
import { usePermission } from '@/hooks/usePermission';

function MyPage() {
  const { hasComp } = usePermission();
  
  return (
    <div>
      {/* 条件渲染按钮 */}
      {hasComp('org_user_add') && (
        <Button type="primary" icon={<PlusOutlined />}>
          新增用户
        </Button>
      )}
      
      {/* ProTable 操作列中使用 filter(Boolean) 过滤 */}
      {[
        hasComp('org_user_edit') && <Button key="edit">编辑</Button>,
        hasComp('org_user_delete') && <Button key="del" danger>删除</Button>
      ].filter(Boolean)}
    </div>
  );
}
```

#### 静态权限注册

在 `src/router/staticComponents.ts` 中维护全局组件权限清单（共 38 个），支持一键同步到后端：

```typescript
export const staticComponents: StaticComponent[] = [
  { component_name: 'org_user_add', comp_desc: '新增用户', group_name: '组织管理' },
  { component_name: 'org_user_edit', comp_desc: '编辑用户', group_name: '组织管理' },
  // ... 更多权限
];
```

在**权限管理 → 组件管理**页面点击"同步组件"按钮，自动调用 `POST /rbac/components/sync` 将静态权限同步到数据库。

#### 已集成的页面

| 页面                  | 权限控制                                            |
| --------------------- | --------------------------------------------------- |
| 组织管理 - 用户       | add / edit / delete                                 |
| 组织管理 - 部门       | add / edit / delete                                 |
| 组织管理 - 职位       | add / edit / delete                                 |
| 组织管理 - 岗位       | add / edit / delete                                 |
| 权限管理 - 用户组     | add / edit / delete                                 |
| 权限管理 - 角色       | add / edit / delete                                 |
| 权限管理 - 菜单       | add / delete / sync                                 |
| 权限管理 - 功能       | add / delete / sync                                 |
| 权限管理 - 组件       | add / delete / sync                                 |
| 权限管理 - 授权       | edit / delete（角色授权）                           |
| 网关管理 - 路由       | add / edit / delete / reload                        |
| 网关管理 - 白名单     | add / delete                                        |

### 公共组件

- **CountdownButton**：替代原生 Popconfirm 的删除确认组件，点击"确定"后 3 秒倒计时自动执行，防止误操作
- **usePermission Hook**：从 Zustand store 读取用户权限，提供 `hasComp(name: string)` 方法检查组件权限

## 🎨 主题与国际化

- 支持 **亮色 / 暗色** 主题切换（顶栏一键切换，基于 Ant Design `ConfigProvider` + CSS 设计变量）
- 主色调为 **Carbon Amber** 风格（橙色 `#f97316`），深色模式采用纯碳黑背景
- 支持 **中文 / English** 切换（`react-i18next`，语言包位于 `src/locales/`）

## �️ 开发工具

### ZebraOps 代码生成器

项目配备了专用的代码生成 Skill（位于 `/.github/skills/zebraops-generator/`），可快速生成：

- ✅ **完整 CRUD 页面** — ProTable + Modal 表单 + 权限控制
- ✅ **后端 API 接口** — FastAPI 路由 + CRUD + 数据库迁移
- ✅ **React 组件** — TypeScript + Ant Design 集成
- ✅ **网关路由** — Go Gin Handler + 权限检查
- ✅ **权限批量注册** — 组件权限 + 功能权限

**使用方式：** 在 VS Code Copilot Chat 中输入

```
/zebraops-generator 创建设备管理页面,包含设备名称、IP地址、状态字段
```

详见：[ZebraOps Generator 快速指南](../.github/skills/zebraops-generator/README.md)

## �📄 License

[MIT](./LICENSE)
