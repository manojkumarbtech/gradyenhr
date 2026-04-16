import { Outlet } from "react-router-dom"
import { Sidebar } from "@/shared/components/sidebar"
import { TopBar } from "@/shared/components/topbar"
import { BottomNav } from "@/shared/components/bottom-nav"
import { useEffect, useState } from "react"

interface AppLayoutProps {
  isAdmin?: boolean
}

export function AppLayout({ isAdmin = true }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const mainClass = isMobile 
    ? "flex-1 overflow-y-auto p-4 bg-background pb-20" 
    : "flex-1 overflow-y-auto p-4 lg:p-6 bg-background transition-all duration-200"

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className={mainClass}>
          <Outlet />
        </main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className={mainClass}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}