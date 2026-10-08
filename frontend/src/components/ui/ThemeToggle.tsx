"use client";
import { useEffect, useState } from 'react';
import Icon from './Icon';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('vpd.theme');
    if (stored === 'dark' || stored === 'light') {
      setIsDark(stored === 'dark');
      document.documentElement.classList.toggle('dark', stored === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('vpd.theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="p-2 text-ink-muted hover:text-brand transition-colors"
    >
      <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
    </button>
  );
}
