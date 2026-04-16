import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
type AccentColor = "blue" | "violet" | "emerald" | "orange" | "rose"

interface ThemeContextType {
  theme: Theme
  accent: AccentColor
  setTheme: (theme: Theme) => void
  setAccent: (accent: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const accentColors: Record<AccentColor, string> = {
  blue: "217 91% 60%",
  violet: "263 70% 50%",
  emerald: "160 84% 39%",
  orange: "24 95% 53%",
  rose: "350 85% 60%",
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("hrms-theme") as Theme) || "light"
    }
    return "light"
  })
  
  const [accent, setAccent] = useState<AccentColor>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("hrms-accent") as AccentColor) || "blue"
    }
    return "blue"
  })

  useEffect(() => {
    const root = document.documentElement
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    
    root.classList.remove("light", "dark")
    root.classList.add(isDark ? "dark" : "light")
    
    // Set accent color CSS variable
    root.style.setProperty("--accent-primary", accentColors[accent])
    
    localStorage.setItem("hrms-theme", theme)
    localStorage.setItem("hrms-accent", accent)
  }, [theme, accent])

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const accentOptions: { value: AccentColor; label: string; color: string }[] = [
  { value: "blue", label: "Blue", color: "#3B82F6" },
  { value: "violet", label: "Violet", color: "#8B5CF6" },
  { value: "emerald", label: "Emerald", color: "#10B981" },
  { value: "orange", label: "Orange", color: "#F97316" },
  { value: "rose", label: "Rose", color: "#F43F5E" },
]