"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "default" | "valentines";

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "default" });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("default");

  // Fetch the admin-controlled theme from the server on mount
  useEffect(() => {
    fetch("/api/theme")
      .then((r) => r.json())
      .then((data) => {
        if (data.theme === "valentines" || data.theme === "default") {
          setTheme(data.theme);
        }
      })
      .catch(() => {/* keep default */});
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

