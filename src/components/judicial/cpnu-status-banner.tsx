import { AlertTriangle } from "lucide-react"

type Props = {
  unavailable?: boolean
}

export function CpnuStatusBanner({ unavailable }: Props) {
  if (!unavailable) return null

  return (
    <div
      role="status"
      className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--warning-ink)] bg-[var(--warning-soft)] border-b border-[var(--warning-ink)]/20"
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <p>
        La fuente judicial (CPNU) no esta disponible temporalmente. Puedes revisar
        tu cartera; las consultas nuevas fallaran hasta que se restablezca el
        servicio.
      </p>
    </div>
  )
}
