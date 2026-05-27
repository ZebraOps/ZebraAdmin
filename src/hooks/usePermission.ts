import { useAuthStore } from '@/store/auth';

/**
 * usePermission hook
 * 用于判断当前用户是否拥有指定组件权限
 */
export function usePermission() {
  const perms = useAuthStore(s => s.userInfo?.permissions);
  const hasComp = (name: string): boolean => {
    if (!perms) return false;
    if (perms.all) return true;
    return perms.components?.[name] === true;
  };
  return { hasComp };
}
