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
├── components/         # Shared components
├── layouts/            # Layout components
│   ├── BaseLayout.tsx  # Main layout (sidebar + header + multi-tab)
│   ├── BlankLayout.tsx # Blank layout (login page, etc.)
│   └── components/     # GlobalSider / GlobalHeader / GlobalTab / GlobalBreadcrumb
├── locales/            # i18n language packs (zh-CN / en-US)
├── router/
│   ├── routes.tsx      # Route config (lazy-loaded)
│   ├── guard.tsx       # Route guard (auth + dynamic routes)
│   └── menus.ts        # Static menu fallback data
├── service/
│   ├── request.ts      # Axios wrapper
│   └── api/            # Modular APIs (org / permission / system / publish / gateway)
├── store/              # Zustand stores (auth / tab / app / theme / route)
├── typings/            # Global type declarations
├── views/              # Page views
│   ├── home/           # Dashboard
│   ├── login/          # Login
│   ├── error/          # 403 / 404 / 500
│   ├── org/            # Organization management
│   ├── permission/     # Permission management
│   ├── system/         # System management
│   ├── publish/        # Release management
│   └── gateway/        # Gateway management
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

## 🎨 Theme & i18n

- **Light / Dark** theme toggle — one-click switch in the header, powered by Ant Design `ConfigProvider` + CSS design tokens
- **Carbon Amber** design language — orange accent `#f97316`, pure-carbon dark background
- **Chinese / English** language switch — `react-i18next`, language packs under `src/locales/`

## 📄 License

[MIT](./LICENSE)

---

> **Note:** This project is a React rewrite of [ZebraUI](../ZebraUI) (Vue 3 + Naive UI), maintaining full feature parity. The UI library has been migrated from Arco Design to **Ant Design 5 + Pro Components**.
