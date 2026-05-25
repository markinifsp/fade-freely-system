import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "dark" | "light";
export type ColorScheme = "gold" | "blue" | "emerald" | "purple" | "rose";

export const colorSchemes: { value: ColorScheme; label: string; swatch: string }[] = [
  { value: "gold", label: "Ouro", swatch: "hsl(38, 80%, 55%)" },
  { value: "blue", label: "Azul", swatch: "hsl(217, 90%, 60%)" },
  { value: "emerald", label: "Esmeralda", swatch: "hsl(155, 65%, 45%)" },
  { value: "purple", label: "Púrpura", swatch: "hsl(265, 75%, 62%)" },
  { value: "rose", label: "Rosa", swatch: "hsl(345, 80%, 58%)" },
];

interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  setMode: (m: ThemeMode) => void;
  setColorScheme: (c: ColorScheme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme-mode") as ThemeMode) || "dark";
  });
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    if (typeof window === "undefined") return "gold";
    return (localStorage.getItem("theme-color") as ColorScheme) || "gold";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
    root.setAttribute("data-theme", colorScheme);
    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("theme-color", colorScheme);
  }, [mode, colorScheme]);

  const setMode = (m: ThemeMode) => setModeState(m);
  const setColorScheme = (c: ColorScheme) => setColorSchemeState(c);
  const toggleMode = () => setModeState((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ mode, colorScheme, setMode, setColorScheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
