import { create } from 'zustand';
import { localStg } from '@/utils/storage';

type ThemeScheme = 'light' | 'dark' | 'auto';

interface ThemeState {
  themeScheme: ThemeScheme;
  primaryColor: string;
  darkMode: boolean;

  setThemeScheme: (scheme: ThemeScheme) => void;
  toggleThemeScheme: () => void;
  setPrimaryColor: (color: string) => void;
  applyDarkMode: (dark: boolean) => void;
}

function getPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function computeDarkMode(scheme: ThemeScheme): boolean {
  if (scheme === 'auto') return getPrefersDark();
  return scheme === 'dark';
}

const savedDark = localStg.get<boolean>('darkMode');
const savedScheme = localStg.get<ThemeScheme>('themeScheme') ?? 'light';
const savedPrimaryColor = localStg.get<string>('primaryColor') ?? '#14B8A6';
const initialScheme: ThemeScheme = savedScheme;
const initialDark = savedDark !== null ? savedDark : computeDarkMode(initialScheme);

// Apply immediately
if (initialDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
document.documentElement.style.setProperty('--color-primary', savedPrimaryColor);

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeScheme: initialScheme,
  primaryColor: savedPrimaryColor,
  darkMode: initialDark,

  setThemeScheme: (scheme) => {
    const dark = computeDarkMode(scheme);
    get().applyDarkMode(dark);
    localStg.set('themeScheme', scheme);
    set({ themeScheme: scheme });
  },

  toggleThemeScheme: () => {
    const schemes: ThemeScheme[] = ['light', 'dark', 'auto'];
    const current = get().themeScheme;
    const idx = schemes.indexOf(current);
    const next = schemes[(idx + 1) % schemes.length];
    get().setThemeScheme(next);
  },

  setPrimaryColor: (color) => {
    set({ primaryColor: color });
    localStg.set('primaryColor', color);
    document.documentElement.style.setProperty('--color-primary', color);
  },

  applyDarkMode: (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStg.set('darkMode', dark);
    set({ darkMode: dark });
  }
}));

// Listen to system theme changes for auto mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const { themeScheme, applyDarkMode } = useThemeStore.getState();
  if (themeScheme === 'auto') {
    applyDarkMode(getPrefersDark());
  }
});
