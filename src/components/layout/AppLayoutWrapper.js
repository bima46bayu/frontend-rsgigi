"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import Navbar from "@/components/layout/navbar"
import AuthGuard from "@/components/layout/AuthGuard"

export default function AppLayoutWrapper({ children }) {
  const pathname = usePathname()

  // Hide Sidebar and Navbar on Login page
  if (pathname === "/login") {
    return <>{children}</>
  }

  // Dashboard / Authenticated Layout
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-bgSoft">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Navbar />
          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
