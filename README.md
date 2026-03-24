# ZebraAdmin

[English](./README.en.md) | 中文

基于 React 19 + TypeScript + Vite 构建的现代化运维管理平台前端，是 [ZebraUI](../ZebraUI)（Vue 3 版本）的 React 重构版本。

![版本](https://img.shields.io/badge/version-1.0.0-orange)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
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
├── components/         # 公共组件
├── layouts/            # 布局组件
│   ├── BaseLayout.tsx  # 主布局（侧边栏 + 顶栏 + 多标签页）
│   ├── BlankLayout.tsx # 空白布局（登录页等）
│   └── components/     # GlobalSider / GlobalHeader / GlobalTab / GlobalBreadcrumb
├── locales/            # i18n 语言包（zh-CN / en-US）
├── router/
│   ├── routes.tsx      # 路由配置（懒加载）
│   ├── guard.tsx       # 路由守卫（鉴权 + 动态路由）
│   └── menus.ts        # 静态菜单兜底数据
├── service/
│   ├── request.ts      # Axios 封装
│   └── api/            # 模块化 API（org / permission / system / publish / gateway）
├── store/              # Zustand 状态（auth / tab / app / theme / route）
├── typings/            # 全局类型声明
├── views/              # 页面视图
│   ├── home/           # 工作台
│   ├── login/          # 登录
│   ├── error/          # 403 / 404 / 500
│   ├── org/            # 组织管理
│   ├── permission/     # 权限管理
│   ├── system/         # 系统管理
│   ├── publish/        # 发布管理
│   └── gateway/        # 网关管理
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

## 🎨 主题与国际化

- 支持 **亮色 / 暗色** 主题切换（顶栏一键切换，基于 Ant Design `ConfigProvider` + CSS 设计变量）
- 主色调为 **Carbon Amber** 风格（橙色 `#f97316`），深色模式采用纯碳黑背景
- 支持 **中文 / English** 切换（`react-i18next`，语言包位于 `src/locales/`）

## 📄 License

[MIT](./LICENSE)

---

> **注意：** 本项目由 [ZebraUI](../ZebraUI)（Vue 3 + Naive UI）重构而来，保持功能对等。UI 组件库已从 Arco Design 迁移至 **Ant Design 5 + Pro Components**。
> },
> ]);

```

```
