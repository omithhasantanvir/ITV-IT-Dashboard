import { useCallback, useEffect, useState } from 'react';

export const THEME_KEY = 'it_management_theme';

// Light is the product default, so dark mode stays opt-in. Reading
// `prefers-color-scheme` here would flip the whole dashboard to the dark
// palette on any machine that happens to run a dark OS theme.
const readStoredTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
};

// Toggles the `dark` class that both tailwind.config.js (darkMode: ['class'])
// and the `.dark { --… }` token block in src/index.css react to.
export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    // Keeps native form controls and scrollbars in step with the palette.
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage can be unavailable (private mode); the toggle still works.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), []);

  return { theme, setTheme, toggleTheme };
}

export default useTheme;
