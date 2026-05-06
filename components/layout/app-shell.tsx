"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { TopNavigation } from "@/components/layout/top-navigation"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith("/auth")

  if (isAuthRoute) {
    return <main className="min-h-[100svh] bg-background">{children}</main>
  }

  return (
    <>
      <TopNavigation />
      <main className="min-h-screen bg-background">{children}</main>
      <footer className="border-t bg-background/80">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Capverra</span>
            <span className="hidden h-3 w-px bg-border md:inline-block" />
            <span className="text-xs md:text-sm">
              Identity & asset management for modern teams.
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            <span>© {new Date().getFullYear()} Capverra. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
