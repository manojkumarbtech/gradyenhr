import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'hr' | 'manager' | 'employee' | 'intern'
  avatar?: string
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  setUser: (user: User | null) => void
  setAuthenticated: (value: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: 'hrms-app-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
)