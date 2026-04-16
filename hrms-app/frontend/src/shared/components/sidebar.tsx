import { Link, useLocation } from "react-router-dom"
import { cn } from "@/shared/lib/utils"
import { useAppStore } from "@/shared/lib/store"
import { Button } from "@/shared/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Separator } from "@/shared/ui/separator"
import {
  LayoutDashboard,
  Users,
  Clock,
  GraduationCap,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
  UserCog,
  ClipboardList,
  Building2,
  CalendarOff,
  Palmtree,
  BarChart3,
  Briefcase,
  Package,
  Database,
  MessageSquare,
} from "lucide-react"

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: UserCog, label: "User Management", to: "/users" },
  { icon: Users, label: "Employees", to: "/employees" },
  { icon: Clock, label: "Attendance", to: "/attendance" },
  { icon: CalendarOff, label: "Leave", to: "/leave" },
  { icon: Palmtree, label: "Holidays", to: "/holidays" },
  { icon: BarChart3, label: "Reports", to: "/reports" },
  { icon: Briefcase, label: "Recruitment", to: "/recruitment" },
  { icon: Package, label: "Assets", to: "/assets" },
  { icon: GraduationCap, label: "Interns", to: "/interns" },
  { icon: Calendar, label: "Training Events", to: "/training" },
  { icon: GraduationCap, label: "Training Tasks", to: "/training/assignments" },
  { icon: Database, label: "Master Data", to: "/master-data" },
  { icon: MessageSquare, label: "Inquiries", to: "/inquiries" },
  { icon: Settings, label: "Settings", to: "/settings" },
]

const employeeNavItems = [
  { icon: LayoutDashboard, label: "My Profile", to: "/" },
  { icon: ClipboardList, label: "Onboarding", to: "/onboarding" },
  { icon: Clock, label: "Attendance", to: "/attendance" },
  { icon: Calendar, label: "Training", to: "/training" },
]

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin = true }: SidebarProps) {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, user, setUser } = useAppStore()

  let navItems = isAdmin ? adminNavItems : employeeNavItems
  
  // Filter based on role
  if (user?.role !== "admin") {
    navItems = navItems.filter(item => 
      !["/users", "/master-data", "/inquiries"].includes(item.to)
    )
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r bg-card transition-all duration-200 hidden md:flex",
        "shadow-sm",
        sidebarCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        {!sidebarCollapsed && (
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Gradyens HR</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Management</p>
            </div>
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-md mx-auto">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className={cn(
            "h-7 w-7 hover:bg-primary/10",
            sidebarCollapsed && "absolute right-2"
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className={cn(
          "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2",
          sidebarCollapsed ? "text-center" : "px-3"
        )}>
          {sidebarCollapsed ? "•••" : isAdmin ? "Admin Menu" : "My Portal"}
        </div>
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              )} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User Section */}
      <div className="p-3">
        {user ? (
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-muted/50",
            sidebarCollapsed && "justify-center"
          )}>
            <Avatar className="h-9 w-9 ring-2 ring-primary/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
            {sidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              sidebarCollapsed && "justify-center"
            )}
          >
            <UserCircle className="h-5 w-5" />
            {!sidebarCollapsed && <span>Sign In</span>}
          </Link>
        )}
      </div>
    </aside>
  )
}