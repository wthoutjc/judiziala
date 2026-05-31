import { HeartbeatProvider } from "@/components/auth/heartbeat-provider"
import { CpnuStatusBanner } from "@/components/judicial/cpnu-status-banner"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { SidebarProvider } from "@/components/layout/sidebar-context"
import { requireSession } from "@/lib/auth/require-session"
import { getCpnuServiceStatus } from "@/lib/judicial/cpnu-status"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()
  const cpnuStatus = getCpnuServiceStatus()

  return (
    <HeartbeatProvider>
      <SidebarProvider>
        <DashboardShell>
          <CpnuStatusBanner unavailable={!cpnuStatus.available} />
          {children}
        </DashboardShell>
      </SidebarProvider>
    </HeartbeatProvider>
  )
}
