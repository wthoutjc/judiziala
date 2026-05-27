"use client"

import { Bell, Search, Command, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSidebar } from "./sidebar-context"

export function Header({ title }: { title: string }) {
  const { open } = useSidebar()

  return (
    <header className="h-14 border-b border-[var(--line)] bg-[var(--surface)] flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-10">
      <button
        onClick={open}
        aria-label="Abrir menú"
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--sunken)] transition-colors flex-shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>

      <h1 className="font-semibold text-[var(--ink)] text-sm flex-1">{title}</h1>

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="hidden md:flex items-center gap-2 h-8 px-3 rounded-md border border-[var(--line)] bg-[var(--canvas)] text-xs text-[var(--ink-subtle)] hover:border-[var(--line-strong)] hover:text-[var(--ink-muted)] transition-colors w-64 group">
          <Search className="w-3.5 h-3.5" />
          <span>Buscar radicado, partes...</span>
          <span className="ml-auto flex items-center gap-0.5 text-[10px] text-[var(--ink-subtle)] bg-[var(--surface)] border border-[var(--line)] rounded px-1 py-0.5 font-mono">
            <Command className="w-2.5 h-2.5" /> K
          </span>
        </button>

        <button
          aria-label="Notificaciones"
          className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--sunken)] transition-colors"
        >
          <Bell className="w-4 h-4 text-[var(--ink-muted)]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--danger)] rounded-full ring-2 ring-[var(--surface)]" />
        </button>

        <Avatar className="w-7 h-7 cursor-pointer ring-1 ring-[var(--line)]">
          <AvatarFallback className="bg-[var(--brand)] text-[oklch(0.99_0.004_250)] text-[10px] font-semibold">
            JL
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
