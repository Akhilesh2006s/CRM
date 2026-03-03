'use client'

import type React from "react"
import { TopBar } from "@/components/dashboard/TopBar"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { RequireAuth } from "@/components/require-auth"
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext"

// Main content component that uses sidebar state
function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main 
      className="flex-1 p-6 md:p-8 pt-24 md:pt-24 ml-16 md:ml-0 overflow-x-auto" 
      id="main-content"
      style={{ minWidth: 0 }}
    >
      <RequireAuth>
        <div className="w-full min-w-0">
          {children}
        </div>
      </RequireAuth>
    </main>
  )
}

// Premium Dashboard layout - Apple x Notion x Linear x Stripe inspired
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <TopBar />
      <div className="flex pt-0">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}


