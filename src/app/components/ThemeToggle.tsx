"use client";
import { useTheme } from "@/app/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isValentines = theme === "valentines";

  return (
    <button
      onClick={toggleTheme}
      title={isValentines ? "Switch to default theme" : "Switch to Valentine's theme"}
      className="flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 border-valentine-red text-valentine-red hover:bg-valentine-light transition-colors text-sm font-semibold font-jakarta"
    >
      {isValentines ? "💙 Default" : "❤️ Valentine's"}
    </button>
  );
}
