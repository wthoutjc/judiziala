"use client"

import { Sidebar } from "./sidebar"
import { useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()

  return (
    <div className="flex min-h-screen bg-[var(--canvas)]">
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/25 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar wrapper: fixed overlay on mobile, in-flow on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex-shrink-0 transition-transform duration-200 ease-out",
          "lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  )
}
