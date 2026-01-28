import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/app/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors hover:bg-hover"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-secondary" />
      ) : (
        <Sun className="w-5 h-5 text-secondary" />
      )}
    </button>
  );
}