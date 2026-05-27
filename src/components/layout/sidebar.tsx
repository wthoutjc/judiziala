"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState } from "react"
import {
  Scale,
  LayoutDashboard,
  FolderOpen,
  Bell,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { label: "Procesos", href: "/procesos", icon: FolderOpen, count: 23 },
  { label: "Alertas", href: "/alertas", icon: Bell, count: 4, isUrgent: true },
  { label: "Documentos", href: "/documentos/d5", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-[var(--surface)] border-r border-[var(--line)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[var(--brand)] rounded-lg flex items-center justify-center">
            <Scale className="w-4 h-4 text-[oklch(0.99_0.004_250)]" />
          </div>
          <span className="font-semibold text-[var(--ink)] tracking-tight">Judiziala</span>
        </div>
      </div>

      {/* Workspace selector */}
      <div className="px-3 py-2 border-b border-[var(--line)]">
        <button className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-[var(--sunken)] transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[var(--brand-soft)] rounded flex items-center justify-center text-[9px] font-bold text-[var(--brand-ink)]">
              BL
            </div>
            <span className="text-sm font-medium text-[var(--ink)]">Bufete Lozano</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-subtle)]" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(
                item.href.split("/")[1] ? `/${item.href.split("/")[1]}` : item.href
              ))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-md text-sm transition-colors group",
                isActive
                  ? "bg-[var(--brand-soft)] text-[var(--brand-ink)] font-medium"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-[var(--brand-ink)]"
                      : "text-[var(--ink-subtle)] group-hover:text-[var(--ink-muted)]"
                  )}
                />
                {item.label}
              </div>
              {item.count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] font-semibold tabular px-1.5 py-0.5 rounded min-w-[18px] text-center",
                    item.isUrgent
                      ? "bg-[var(--danger-soft)] text-[var(--danger-ink)]"
                      : "text-[var(--ink-subtle)]"
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-[var(--line)] space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors"
        >
          <Settings className="w-4 h-4 text-[var(--ink-subtle)]" />
          Configuración
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-[var(--ink-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  )
}
