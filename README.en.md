# ZebraAdmin

[中文](./README.md) | English

A modern DevOps management platform frontend built with React 19 + TypeScript + Vite. This is a React rewrite of [ZebraUI](../ZebraUI) (the Vue 3 version), maintaining full feature parity.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign)

## ✨ Tech Stack

| Category   | Technology                                                                                |
| ---------- | ----------------------------------------------------------------------------------------- |
| Framework  | [React 19](https://react.dev/)                                                            |
| Build Tool | [Vite 6](https://vitejs.dev/)                                                             |
| UI Library | [Ant Design 5](https://ant.design/) + [Pro Components](https://procomponents.ant.design/) |
| Routing    | [React Router v7](https://reactrouter.com/)                                               |
| State      | [Zustand 5](https://zustand.docs.pmnd.rs/)                                                |
| CSS        | [Tailwind CSS v4](https://tailwindcss.com/)                                               |
| i18n       | [react-i18next](https://react.i18next.com/) (zh-CN / en-US)                               |
| Charts     | [Recharts](https://recharts.org/)                                                         |
| HTTP       | [Axios](https://axios-http.com/)                                                          |
| Multi-tab  | [keepalive-for-react](https://github.com/irychen/keepalive-for-react)                     |

## 🗂️ Feature Modules

- **Dashboard** — Data statistics, build/deploy trend charts, status pie charts
- **Organization** — Departments, positions, job titles, users
- **Permission (RBAC)** — Menus, roles, function permissions, component permissions, user groups, authorization
- **System** — System menus, roles, users, user groups, authorization
- **Release Management** — Applications, repositories, release tasks, build/deploy templates, environments, image registries, cloud providers, K8s clusters, Linux hosts
- **Gateway** — Route rules, whitelist

## 📁 Project Structure

```
src/
├── assets/             # Static assets
├── components/
│   └── CountdownButton.tsx  # Delete confirmation button with 3s countdown
├── hooks/
│   └── usePermission.ts     # Component permission check hook (hasComp method)
├── layouts/            # Layout components
│   ├── BaseLayout.tsx  # Main layout (sidebar + header + multi-tab)
│   ├── BlankLayout.tsx # Blank layout (login page, etc.)
│   └── components/     # GlobalSider / GlobalHeader / GlobalTab / GlobalBreadcrumb
├── locales/            # i18n language packs (zh-CN / en-US)
├── router/
│   ├── routes.tsx      # Route config (lazy-loaded)
│   ├── guard.tsx       # Route guard (auth + dynamic routes)
│   ├── menus.ts        # Static menu fallback data
│   ├── staticComponents.ts  # Static component permission registry (38 permissions)
│   └── staticFunctions.ts   # Static function permission registry
├── service/
│   ├── request/        # Axios wrapper (error interceptor for 400/403)
│   └── api/            # Modular APIs (auth / route / rbac / publish / gateway)
├── store/              # Zustand stores
│   ├── auth.ts         # Auth state, user info, permissions (functions/menus/components)
│   ├── route.ts        # Dynamic menu, route transformation, icon fallback
│   ├── tab.ts          # Multi-tab management (home always pinned)
│   ├── app.ts          # Global app state
│   └── theme.ts        # Theme toggle
├── typings/            # Global type declarations
├── views/              # Page views
│   ├── home/           # Dashboard
│   ├── login/          # Login
│   ├── error/          # 403 / 404 / 500
│   ├── org/            # Organization management (with component permissions)
│   ├── permission/     # Permission management (with component permissions)
│   ├── system/         # System management
│   ├── publish/        # Release management
│   └── gateway/        # Gateway management (with component permissions)
└── App.tsx
```

## 🚀 Quick Start

**Requirements:** Node.js ≥ 20, pnpm ≥ 9

```bash
# Install dependencies
pnpm install

# Start dev server (default port 4120)
pnpm dev

# Type check
pnpm typecheck

# Production build
pnpm build

# Preview build output (port 9725)
pnpm preview
```

## ⚙️ Environment Variables

Create a `.env.local` file in the project root (already in `.gitignore`):

```env
# Backend service base URL
VITE_BASE_URL=http://localhost:8080
```

Built-in proxy forwarding rules (`vite.config.ts`):

| Prefix   | Purpose                 |
| -------- | ----------------------- |
| `/rbac`  | RBAC permission service |
| `/admin` | Admin backend service   |
| `/cicd`  | CI/CD service           |
| `/route` | Gateway routing service |
| `/auth`  | Authentication service  |

## 🔌 Backend Services

This project is designed to work with the following backend services (all located in the ZebraOps root):

| Service                               | Description                                |
| ------------------------------------- | ------------------------------------------ |
| [ZebraRBAC](../ZebraRBAC)             | Python FastAPI — permissions, users, roles |
| [ZebraCICD](../ZebraCICD)             | Go — CI/CD pipeline management             |
| [ZebraGateway](../ZebraGateway)       | Go — API gateway management                |
| [ZebraDeployment](../ZebraDeployment) | Docker Compose deployment scripts          |

## 🔐 Permission System Integration

Deep integration with ZebraRBAC + ZebraGateway for three-level permission control:

### Authentication Flow

```
Login → POST /rbac/login/access-token → JWT Token
    │
Request → Authorization: Bearer <token>
    │
    ▼
ZebraGateway (:8080)
    ├── Whitelist passthrough
    ├── JWT verification + RBAC permission check
    ├── Path rewrite (/rbac/* → /api/*)
    └── Reverse proxy to upstream service
```

### Three-Level Permission Model

| Level                | Granularity                  | Frontend Implementation                          |
| -------------------- | ---------------------------- | ------------------------------------------------ |
| Function Permission  | API endpoint (Method + URI)  | Intercepted at gateway, transparent to frontend  |
| Menu Permission      | Page visibility              | Dynamic menu via `getUserRoutes`, route guard    |
| Component Permission | Button/element visibility    | `usePermission().hasComp('permission_name')` conditional render |

### Dynamic Menu

- After login, call `GET /rbac/route/getUserRoutes` to fetch user's visible menus
- Backend auto-completes ancestor menus (parent menu visible if child has permission)
- Icons prioritize backend response, fallback to static `menus.ts`
- Home page (`/home`) always visible to all roles

### Component Permission System

This project implements a complete **component-level permission control** system for precise button visibility control:

#### Permission Naming Convention

Format: `{module}_{entity}_{action}`

| Module       | Prefix        | Examples                                          |
| ------------ | ------------- | ------------------------------------------------- |
| Organization | `org_`        | `org_user_add`, `org_dept_edit`                   |
| Permission   | `permission_` | `permission_role_delete`, `permission_menu_sync`  |
| Gateway      | `gateway_`    | `gateway_route_add`, `gateway_whitelist_delete`   |
| Publish      | `publish_`    | `publish_app_deploy`, `publish_task_cancel`       |
| System       | `system_`     | `system_config_edit`                              |

#### Usage

```tsx
import { usePermission } from '@/hooks/usePermission';

function MyPage() {
  const { hasComp } = usePermission();
  
  return (
    <div>
      {/* Conditional rendering */}
      {hasComp('org_user_add') && (
        <Button type="primary" icon={<PlusOutlined />}>
          Add User
        </Button>
      )}
      
      {/* Use filter(Boolean) in ProTable action column */}
      {[
        hasComp('org_user_edit') && <Button key="edit">Edit</Button>,
        hasComp('org_user_delete') && <Button key="del" danger>Delete</Button>
      ].filter(Boolean)}
    </div>
  );
}
```

#### Static Permission Registry

Maintain global component permission list (38 total) in `src/router/staticComponents.ts`, support one-click sync to backend:

```typescript
export const staticComponents: StaticComponent[] = [
  { component_name: 'org_user_add', comp_desc: 'Add User', group_name: 'Organization' },
  { component_name: 'org_user_edit', comp_desc: 'Edit User', group_name: 'Organization' },
  // ... more permissions
];
```

Click "Sync Components" button on **Permission → Component Management** page to auto-call `POST /rbac/components/sync` and sync static permissions to database.

#### Pages with Integration

| Page                          | Permission Controls                            |
| ----------------------------- | ---------------------------------------------- |
| Organization - Users          | add / edit / delete                            |
| Organization - Departments    | add / edit / delete                            |
| Organization - Positions      | add / edit / delete                            |
| Organization - Job Titles     | add / edit / delete                            |
| Permission - User Groups      | add / edit / delete                            |
| Permission - Roles            | add / edit / delete                            |
| Permission - Menus            | add / delete / sync                            |
| Permission - Functions        | add / delete / sync                            |
| Permission - Components       | add / delete / sync                            |
| Permission - Authorization    | edit / delete (role authorization)             |
| Gateway - Routes              | add / edit / delete / reload                   |
| Gateway - Whitelist           | add / delete                                   |

### Shared Components

- **CountdownButton**: Replaces native Popconfirm for delete confirmation with 3s countdown after clicking "Confirm", prevents accidental operations
- **usePermission Hook**: Reads user permissions from Zustand store, provides `hasComp(name: string)` method to check component permissions

## 🎨 Theme & i18n

- **Light / Dark** theme toggle — one-click switch in the header, powered by Ant Design `ConfigProvider` + CSS design tokens
- **Carbon Amber** design language — orange accent `#f97316`, pure-carbon dark background
- **Chinese / English** language switch — `react-i18next`, language packs under `src/locales/`

## �️ Development Tools

### ZebraOps Code Generator

The project comes with a dedicated code generation Skill (located at `/.github/skills/zebraops-generator/`) that can quickly generate:

- ✅ **Full CRUD pages** — ProTable + Modal forms + permission control
- ✅ **Backend API endpoints** — FastAPI routers + CRUD + database migrations
- ✅ **React components** — TypeScript + Ant Design integration
- ✅ **Gateway routes** — Go Gin handlers + permission checks
- ✅ **Batch permission registration** — Component & function permissions

**Usage:** Type in VS Code Copilot Chat

```
/zebraops-generator create device management page with fields: device name, IP address, status
```

See: [ZebraOps Generator Quick Guide](../.github/skills/zebraops-generator/README.md)

## �📄 License

[MIT](./LICENSE)

---

> **Note:** This project is a React rewrite of [ZebraUI](../ZebraUI) (Vue 3 + Naive UI), maintaining full feature parity. The UI library has been migrated from Arco Design to **Ant Design 5 + Pro Components**.
