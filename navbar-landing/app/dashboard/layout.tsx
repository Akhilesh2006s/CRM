import type React from "react"
import { TopBar } from "@/components/dashboard/TopBar"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { RequireAuth } from "@/components/require-auth"

// Dashboard layout with blue top bar and dark sidebar, light content area
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <div className="flex pt-2 md:pt-2">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 md:ml-64 ml-16 p-2 md:p-3 mt-12 md:mt-16" id="main-content">
          <RequireAuth>
            {children}
          </RequireAuth>
        </main>
      </div>
    </div>
  )
}


