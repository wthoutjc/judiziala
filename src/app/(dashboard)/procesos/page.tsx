import { ProcesosPageClient } from "@/components/procesos/procesos-page-client"
import { requireSession } from "@/lib/auth/require-session"
import { procesoRepository } from "@/lib/judicial/repository"

export default async function ProcesosPage() {
  const session = await requireSession()
  const procesos = await procesoRepository.listar(session.user.id)

  return <ProcesosPageClient procesos={procesos} />
}
