/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_SERVICE_SUCCESS_CODE: string;
  readonly VITE_SERVICE_LOGOUT_CODES: string;
  readonly VITE_SERVICE_MODAL_LOGOUT_CODES: string;
  readonly VITE_SERVICE_EXPIRED_TOKEN_CODES: string;
  readonly VITE_AUTH_ROUTE_MODE: 'static' | 'dynamic';
  readonly VITE_ROUTE_HOME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
