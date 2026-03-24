import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date with dayjs */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  import('dayjs').then(({ default: dayjs }) => dayjs(date).format(format));
  // sync fallback
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
}

/** Get query params from URL */
export function getQueryParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const search = window.location.search.slice(1);
  search.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
}
