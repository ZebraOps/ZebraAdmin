/* Global type declarations */

declare namespace App {
  /** i18n types */
  namespace I18n {
    type LangType = 'zh-CN' | 'en-US';
    interface LangOption {
      label: string;
      key: LangType;
    }
  }

  /** Global types */
  namespace Global {
    interface Tab {
      id: string;
      label: string;
      routeKey: string;
      fullPath: string;
      icon?: string;
      fixed?: boolean;
    }

    interface Menu {
      key: string;
      label: string;
      icon?: string;
      path?: string;
      children?: Menu[];
      order?: number;
    }
  }

  /** Auth types */
  namespace Auth {
    interface UserInfo {
      userId: number;
      userName: string;
      email?: string;
      nickName?: string;
      avatar?: string;
      roles: {
        all: boolean;
        data: string[];
      };
      menus: {
        all: boolean;
        data: Record<string, unknown>;
      };
      permissions: {
        all: boolean;
        functions: Array<{ method: string; uri: string }>;
        components: Record<string, unknown>;
      };
    }

    interface LoginToken {
      token: string;
      refreshToken: string;
    }
  }

  /** Theme types */
  namespace Theme {
    type ThemeScheme = 'light' | 'dark' | 'auto';

    interface ThemeSettings {
      themeScheme: ThemeScheme;
      themeColor: string;
      siderCollapsed: boolean;
    }
  }

  /** Service types */
  namespace Service {
    interface Response<T = unknown> {
      code: string;
      msg: string;
      data: T;
    }
  }
}

/** Route meta */
interface RouteMeta {
  title: string;
  i18nKey?: string;
  icon?: string;
  order?: number;
  constant?: boolean;
  hideInMenu?: boolean;
  keepAlive?: boolean;
}
