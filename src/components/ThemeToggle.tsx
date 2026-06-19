"use client";
import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "dark";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", t === "dark");
    }
  };

  const onChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border px-1 py-0.5 text-xs transition-soft">
      <button
        onClick={() => onChange("light")}
        className={`rounded-full px-2 py-1 state-hover ${theme === "light" ? "bg-white text-zinc-900" : "opacity-80"}`}
      >
        Light
      </button>
      <button
        onClick={() => onChange("system")}
        className={`rounded-full px-2 py-1 state-hover ${theme === "system" ? "bg-white text-zinc-900" : "opacity-80"}`}
      >
        System
      </button>
      <button
        onClick={() => onChange("dark")}
        className={`rounded-full px-2 py-1 state-hover ${theme === "dark" ? "bg-white text-zinc-900" : "opacity-80"}`}
      >
        Dark
      </button>
    </div>
  );
}
