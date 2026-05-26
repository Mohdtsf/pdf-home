"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    let activeTheme: "light" | "dark" = "light";
    try {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      activeTheme = savedTheme || (systemDark ? "dark" : "light");
    } catch (e) {
      console.warn("Client theme detection fallback applied:", e);
    }
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    if (!theme) return;
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!theme) {
    return <div className="w-9 h-9 rounded-lg border border-[var(--color-border-glass)] opacity-0" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all shadow-sm flex items-center justify-center cursor-pointer relative group"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100 group-hover:rotate-45 text-amber-500" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100 group-hover:-rotate-12 text-indigo-400" />
      )}
    </button>
  );
}
