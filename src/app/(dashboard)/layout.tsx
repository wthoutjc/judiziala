import { SidebarProvider } from "@/components/layout/sidebar-context"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  )
}
