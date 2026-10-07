import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AppTheme = 'dark' | 'light';

export interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'rdn_app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  // Ensure document is always Arabic RTL
  useEffect(() => {
    const html = document.documentElement;
    html.lang = 'ar';
    html.dir = 'rtl';
    document.body.dir = 'rtl';
    html.classList.remove('lang-en');
    html.classList.add('lang-ar');
    try {
      localStorage.removeItem('rdn_app_lang');
    } catch {}
  }, []);

  // Apply theme class and data-theme to html/body
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}

    const html = document.documentElement;
    html.setAttribute('data-theme', theme);

    if (theme === 'light') {
      html.classList.add('light');
      html.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }

    window.dispatchEvent(new CustomEvent('app-theme-changed', { detail: { theme } }));
  }, [theme]);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
