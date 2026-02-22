"use client";

import { useEffect, useState } from "react";
import { CheckIcon, MoonIcon, PaletteIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeName = "default" | "forest" | "blue" | "lavender" | "beach";
type ModeName = "light" | "dark";

const THEME_STORAGE_KEY = "site-theme";
const MODE_STORAGE_KEY = "site-mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `site-theme=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function applyMode(mode: ModeName) {
  if (mode === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  localStorage.setItem(MODE_STORAGE_KEY, mode);
  document.cookie = `site-mode=${mode}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("default");
  const [mode, setMode] = useState<ModeName>("light");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
    const next: ThemeName =
      saved === "forest" ||
      saved === "blue" ||
      saved === "lavender" ||
      saved === "beach" ||
      saved === "default"
        ? saved
        : "default";
    const nextMode: ModeName = savedMode === "dark" ? "dark" : "light";
    setTheme(next);
    setMode(nextMode);
    applyTheme(next);
    applyMode(nextMode);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="mr-2 h-9 w-9" aria-label="Change theme">
          <PaletteIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setTheme("default");
            applyTheme("default");
          }}
          className="flex items-center"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-black" />
          <span className="ml-2">Default</span>
          {theme === "default" ? <CheckIcon className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme("forest");
            applyTheme("forest");
          }}
          className="flex items-center"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
          <span className="ml-2">Forest</span>
          {theme === "forest" ? <CheckIcon className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme("blue");
            applyTheme("blue");
          }}
          className="flex items-center"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="ml-2">Ocean</span>
          {theme === "blue" ? <CheckIcon className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme("lavender");
            applyTheme("lavender");
          }}
          className="flex items-center"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-500" />
          <span className="ml-2">Lavender</span>
          {theme === "lavender" ? <CheckIcon className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme("beach");
            applyTheme("beach");
          }}
          className="flex items-center"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="ml-2">Beach</span>
          {theme === "beach" ? <CheckIcon className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setMode("light");
            applyMode("light");
          }}
          className="flex items-center"
        >
          <SunIcon className="h-4 w-4" />
          <span className="ml-2">Light</span>
          {mode === "light" ? <CheckIcon className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setMode("dark");
            applyMode("dark");
          }}
          className="flex items-center"
        >
          <MoonIcon className="h-4 w-4" />
          <span className="ml-2">Dark</span>
          {mode === "dark" ? <CheckIcon className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
