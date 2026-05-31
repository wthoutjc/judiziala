import { createCpnuClient } from "./cpnu-client.impl"
import { CpnuError } from "./cpnu-error"

async function main() {
  const client = createCpnuClient()

  await client.detalle(29498455)
  console.log("OK detalle-proceso")

  await client.porRadicado("05001600020620201819700")
  console.log("OK consulta-radicado")

  await client.porNombre("EDIBER CEFERINO RINCON", "nat")
  console.log("OK consulta-nombre")

  await client.actuaciones(29498455, { pagina: 1 })
  console.log("OK actuaciones-proceso")

  try {
    await client.porRadicado("123")
  } catch (error) {
    if (!CpnuError.isCpnuError(error) || error.code !== "VALIDATION") {
      throw error
    }
    console.log("OK validation-error")
  }

  console.log("OK smoke-cpnu-client")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
