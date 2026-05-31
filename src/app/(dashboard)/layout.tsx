import { SidebarProvider } from "@/components/layout/sidebar-context"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { HeartbeatProvider } from "@/components/auth/heartbeat-provider"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeartbeatProvider>
      <SidebarProvider>
        <DashboardShell>{children}</DashboardShell>
      </SidebarProvider>
    </HeartbeatProvider>
  )
}
