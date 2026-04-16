import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/shared/hooks/theme-provider"
import { ToastProvider } from "@/shared/hooks/use-toast"
import { AppLayout } from "./layout"
import { useAppStore } from "@/shared/lib/store"
import Dashboard from "@/features/dashboard"
import Employees from "@/features/employees"
import Users from "@/features/users"
import Attendance from "@/features/attendance"
import Interns from "@/features/interns"
import Training from "@/features/training"
import TrainingAssignments from "@/features/training/assignments"
import Settings from "@/features/settings"
import Auth from "@/features/auth"
import EmployeePortal from "@/features/portal/profile"
import EmployeeOnboarding from "@/features/portal/onboarding"
import EmployeeAttendance from "@/features/portal/attendance"
import Leave from "@/features/leave"
import Holidays from "@/features/holidays"
import Reports from "@/features/reports"
import Recruitment from "@/features/recruitment"
import Assets from "@/features/assets"
import MasterData from "@/features/masterdata"
import Inquiries from "@/features/inquiries"
import { useEffect, useState } from "react"

const API_URL = "http://localhost:8000"

async function validateToken(token: string) {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) {
      const userData = await response.json()
      return {
        id: String(userData.id),
        email: userData.email,
        name: userData.name,
        role: userData.role,
      }
    }
  } catch {
    return null
  }
  return null
}

function AdminRouter() {
  return createBrowserRouter([
    {
      path: "/",
      element: <AppLayout isAdmin />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: "employees", element: <Employees /> },
        { path: "users", element: <Users /> },
        { path: "attendance", element: <Attendance /> },
        { path: "leave", element: <Leave /> },
        { path: "holidays", element: <Holidays /> },
        { path: "reports", element: <Reports /> },
        { path: "recruitment", element: <Recruitment /> },
        { path: "assets", element: <Assets /> },
        { path: "interns", element: <Interns /> },
        { path: "training", element: <Training /> },
        { path: "training/assignments", element: <TrainingAssignments /> },
        { path: "settings", element: <Settings /> },
        { path: "master-data", element: <MasterData /> },
        { path: "inquiries", element: <Inquiries /> },
      ],
    },
    { path: "/login", element: <Auth /> },
  ])
}

function EmployeeRouter() {
  return createBrowserRouter([
    {
      path: "/",
      element: <AppLayout isAdmin={false} />,
      children: [
        { index: true, element: <EmployeePortal /> },
        { path: "onboarding", element: <EmployeeOnboarding /> },
        { path: "attendance", element: <EmployeeAttendance /> },
        { path: "training", element: <Training /> },
        { path: "training/assignments", element: <TrainingAssignments /> },
      ],
    },
    { path: "/login", element: <Auth /> },
  ])
}

function LoginRouter() {
  return createBrowserRouter([
    { path: "/login", element: <Auth /> },
    { path: "*", element: <Auth /> },
  ])
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export function App() {
  const { user, setUser } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [router, setRouter] = useState(() => {
    if (!user) return LoginRouter()
    const isAdmin = user.role === "admin" || user.role === "hr" || user.role === "manager"
    return isAdmin ? AdminRouter() : EmployeeRouter()
  })

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token")
      console.log("Initializing auth, token exists:", !!token)
      if (token) {
        console.log("Validating token...")
        const validUser = await validateToken(token)
        if (validUser) {
          console.log("Token valid, setting user:", validUser)
          setUser(validUser)
        } else {
          console.log("Token invalid, removing...")
          localStorage.removeItem("token")
          // Force logout by resetting user
          setUser(null)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  useEffect(() => {
    console.log("User or loading changed:", { user, isLoading })
    if (!isLoading) {
      const isAdmin = user?.role === "admin" || user?.role === "hr" || user?.role === "manager"
      console.log("Setting router, isAdmin:", isAdmin)
      setRouter(user ? (isAdmin ? AdminRouter() : EmployeeRouter()) : LoginRouter())
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}