"use client"

import * as React from "react"
import { useTheme, accentOptions } from "@/shared/hooks/theme-provider"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Moon, Sun, Palette } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme, accent, setAccent } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9" />
  }

  const currentAccent = accentOptions.find(a => a.value === accent)

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Palette className="h-4 w-4" style={{ color: currentAccent?.color }} />
            <span className="sr-only">Theme settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem className="text-xs text-muted-foreground py-1.5">
            Accent Color
          </DropdownMenuItem>
          {accentOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setAccent(option.value)}
              className="flex items-center gap-2"
            >
              <div
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: option.color }}
              />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  )
}