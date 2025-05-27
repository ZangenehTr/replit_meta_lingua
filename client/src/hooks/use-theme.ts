import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";

export function useTheme() {
  const { user, updatePreferences } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Initialize theme from user preferences or localStorage
    const savedTheme = user?.preferences?.theme || localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    
    // Apply theme to document
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Apply to document immediately
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    
    // Save to localStorage for guests
    localStorage.setItem("theme", newTheme);
    
    // Save to user preferences if authenticated
    if (user) {
      updatePreferences({ theme: newTheme });
    }
  };

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
  };
}
