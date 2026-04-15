import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'glass';

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
  effects: {
    blur: string;
    shadow: string;
    gradient: string;
  };
}

const themes: Record<ThemeMode, ThemeConfig> = {
  light: {
    mode: 'light',
    colors: {
      primary: '#1d4ed8',
      secondary: '#6b7280',
      background: '#f3eee2',
      surface: '#fffdf7',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#d9cfbf',
      accent: '#c2410c',
    },
    effects: {
      blur: 'backdrop-blur-sm',
      shadow: 'shadow-xl',
      gradient: 'bg-gradient-to-br from-stone-50 to-amber-50',
    },
  },
  dark: {
    mode: 'dark',
    colors: {
      primary: '#7dd3fc',
      secondary: '#94a3b8',
      background: '#0f1720',
      surface: '#16202b',
      text: '#e6edf5',
      textSecondary: '#9aa7b6',
      border: '#2b394b',
      accent: '#f59e0b',
    },
    effects: {
      blur: 'backdrop-blur-sm',
      shadow: 'shadow-2xl shadow-black/40',
      gradient: 'bg-gradient-to-br from-slate-950 to-slate-900',
    },
  },
  glass: {
    mode: 'glass',
    colors: {
      primary: '#a5d8ff',
      secondary: '#cbd5e1',
      background: 'transparent',
      surface: 'rgba(10, 18, 28, 0.72)',
      text: '#f8fbff',
      textSecondary: 'rgba(226, 232, 240, 0.84)',
      border: 'rgba(148, 163, 184, 0.24)',
      accent: '#7dd3fc',
    },
    effects: {
      blur: 'backdrop-blur-2xl',
      shadow: 'glass-shadow',
      gradient: 'glass-gradient',
    },
  },
};

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diary-theme');
      return (saved as ThemeMode) || 'light';
    }
    return 'light';
  });

  const theme = themes[currentTheme];

  const setTheme = (mode: ThemeMode) => {
    setCurrentTheme(mode);
    localStorage.setItem('diary-theme', mode);
    
    // 更新 CSS 变量
    const root = document.documentElement;
    const themeConfig = themes[mode];
    
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // 更新 body 类名
    document.body.className = `theme-${mode}`;

    const themeColor = mode === 'dark' ? '#0f1720' : mode === 'glass' ? '#0a121c' : '#f3eee2';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  };

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'glass'];
    const currentIndex = modes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme(modes[nextIndex]);
  };

  return {
    theme,
    currentTheme,
    setTheme,
    toggleTheme,
    themes,
  };
}
