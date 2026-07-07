import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 4120,
      allowedHosts: ['.trycloudflare.com'],
      proxy: {
        '/rbac': {
          target: env.VITE_BASE_URL,
          changeOrigin: true
        },
        '/admin': {
          target: env.VITE_BASE_URL,
          changeOrigin: true
        },
        '/cicd': {
          target: env.VITE_BASE_URL,
          changeOrigin: true,
          ws: true
        },
        '/rag': {
          target: env.VITE_BASE_URL,
          changeOrigin: true,
          bypass(req) {
            // Don't proxy browser page navigations — let the SPA handle routing.
            // Otherwise typing /rag/query in the address bar hits Gateway directly
            // and shows raw JSON instead of the app.
            if (req.headers?.accept?.includes('text/html')) {
              return '/index.html';
            }
          }
        },
        '/route': {
          target: env.VITE_BASE_URL,
          changeOrigin: true
        },
        '/auth': {
          target: env.VITE_BASE_URL,
          changeOrigin: true
        }
      }
    },
    preview: {
      port: 9725
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router'],
            'vendor-antd-core': ['antd'],
            'vendor-antd-pro': ['@ant-design/pro-components'],
            'vendor-icons': ['@ant-design/icons', '@iconify/react'],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['axios', 'zustand', 'i18next', 'react-i18next', 'dayjs']
          }
        }
      }
    }
  };
});
