import { Bell, Search, PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { ThemeToggle } from "@/shared/hooks/theme-toggle"
import { useAppStore } from "@/shared/lib/store"
import { cn } from "@/shared/lib/utils"
import { useState, useEffect } from "react"

export function TopBar() {
  const { sidebarCollapsed, toggleSidebar, user } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <header className={cn(
      "flex items-center justify-between h-14 lg:h-16 px-4 lg:px-6 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 transition-all duration-200",
      (sidebarCollapsed || isMobile) ? "pl-4" : "pl-0"
    )}>
      <div className="flex items-center gap-2 lg:gap-4 flex-1">
        {/* Sidebar Toggle - hidden on mobile */}
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-9 w-9 hidden md:flex"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        )}
        
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search employees, interns, training..." 
            className="pl-9 bg-muted/50 border-transparent focus:bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <Button variant="ghost" size="sm" className="hidden md:flex">
          <span className="text-xs text-muted-foreground">Quick Actions</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{user.name.charAt(0)}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}