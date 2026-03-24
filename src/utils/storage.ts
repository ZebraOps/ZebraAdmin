/** Local storage helper */
const STORAGE_PREFIX = 'zebra_admin_';

type StorageKey =
  | 'token'
  | 'refreshToken'
  | 'userInfo'
  | 'lang'
  | 'themeSettings'
  | 'globalTabs'
  | 'lastLoginUserId'
  | 'darkMode'
  | 'themeScheme'
  | 'primaryColor';

function getKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

export const localStg = {
  get<T>(key: StorageKey): T | null {
    try {
      const str = localStorage.getItem(getKey(key));
      if (str === null) return null;
      return JSON.parse(str) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(getKey(key), JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  },

  remove(key: StorageKey): void {
    localStorage.removeItem(getKey(key));
  },

  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
};
