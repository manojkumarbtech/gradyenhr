import { Link, useLocation } from "react-router-dom"
import { cn } from "@/shared/lib/utils"
import {
  LayoutDashboard,
  Clock,
  Calendar,
  CalendarOff,
  Users,
  User,
} from "lucide-react"

const adminNavItems = [
  { icon: LayoutDashboard, label: "Home", to: "/" },
  { icon: Clock, label: "Attendance", to: "/attendance" },
  { icon: CalendarOff, label: "Leave", to: "/leave" },
  { icon: Users, label: "Team", to: "/employees" },
]

const employeeNavItems = [
  { icon: LayoutDashboard, label: "Home", to: "/" },
  { icon: Clock, label: "Attendance", to: "/attendance" },
  { icon: Calendar, label: "Training", to: "/training" },
  { icon: User, label: "Profile", to: "/" },
]

interface BottomNavProps {
  isAdmin?: boolean
}

export function BottomNav({ isAdmin = true }: BottomNavProps) {
  const location = useLocation()
  const navItems = isAdmin ? adminNavItems : employeeNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}