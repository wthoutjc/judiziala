"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/auth/require-session"
import { cpnuClient } from "@/lib/judicial/cpnu-client"
import { NlExtractor } from "@/lib/judicial/nl-extractor"
import { procesoRepository } from "@/lib/judicial/repository"
import {
  consultarNLImpl,
  consultarNombreImpl,
  consultarRadicadoImpl,
  interpretarNLImpl,
  monitorearImpl,
  type ConsultarNLDeps,
} from "./actions.impl"
import type {
  ConsultarNLInput,
  ConsultarNombreInput,
  ConsultarRadicadoInput,
  InterpretarNLInput,
  MonitorearInput,
} from "./actions.types"

const deps = {
  cpnuClient,
  repository: procesoRepository,
}

// Singleton lazy de NlExtractor — se instancia solo cuando se llama consultarNL.
// No puede ser top-level porque env.ANTHROPIC_API_KEY puede estar ausente
// en modo demo y lanzaria al importar el modulo.
let _nlExtractor: Pick<NlExtractor, "extraer"> | undefined
function getNlExtractor(): Pick<NlExtractor, "extraer"> {
  return (_nlExtractor ??= NlExtractor.fromEnv())
}

export type {
  ConsultaResult,
  ConsultarNLInput,
  ConsultarNLResult,
  ConsultarNLSuccess,
  ConsultarNombreInput,
  ConsultarRadicadoInput,
  CodigosResueltos,
  InterpretarNLInput,
  InterpretarNLResult,
  InterpretarNLSuccess,
  MonitorearInput,
  MonitorearResult,
} from "./actions.types"

export async function consultarRadicado(input: ConsultarRadicadoInput) {
  const session = await requireSession()
  return consultarRadicadoImpl(session.user.id, input, deps)
}

export async function consultarNombre(input: ConsultarNombreInput) {
  const session = await requireSession()
  return consultarNombreImpl(session.user.id, input, deps)
}

export async function monitorear(input: MonitorearInput) {
  const session = await requireSession()
  const result = await monitorearImpl(session.user.id, input, deps)

  if (result.ok) {
    revalidatePath("/procesos")
  }

  return result
}

export async function interpretarNL(input: InterpretarNLInput) {
  const session = await requireSession()
  const nlDeps: ConsultarNLDeps = {
    ...deps,
    nlExtractor: getNlExtractor(),
  }
  return interpretarNLImpl(session.user.id, input, nlDeps)
}

export async function consultarNL(input: ConsultarNLInput) {
  const session = await requireSession()
  return consultarNLImpl(session.user.id, input, nlDepsFromSession())
}

function nlDepsFromSession(): ConsultarNLDeps {
  return {
    ...deps,
    nlExtractor: getNlExtractor(),
  }
}
