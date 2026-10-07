import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface GlobalToggleBarProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export const GlobalToggleBar: React.FC<GlobalToggleBarProps> = ({
  className = '',
  variant = 'floating'
}) => {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center justify-center p-2 rounded-lg text-xs font-semibold bg-[#161c29] hover:bg-[#1f2738] text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer shadow-xs ${className}`}
        title={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
        aria-label="تبديل الوضع النهاري والليلي"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
        ) : (
          <Moon className="w-4 h-4 text-amber-400" />
        )}
      </button>
    );
  }

  // Floating Theme Toggle Button rendered globally on all pages
  return (
    <aside
      aria-label="إعدادات المظهر"
      className={`fixed bottom-6 right-6 z-50 flex items-center p-1 rounded-full bg-[#121622]/95 backdrop-blur-md border border-amber-500/40 shadow-2xl shadow-black/60 hover:border-amber-400 transition-all group ${className}`}
    >
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-amber-500 text-black shadow-md'
            : 'text-slate-200 hover:text-white bg-[#1a2030] hover:bg-[#232b40] border border-amber-500/30'
        }`}
        title={theme === 'dark' ? 'التبديل إلى الوضع النهاري (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
        aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] text-amber-200/90 font-medium">الوضع النهاري</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-black" />
            <span className="text-[11px] text-black font-bold">الوضع الليلي</span>
          </>
        )}
      </button>
    </aside>
  );
};
