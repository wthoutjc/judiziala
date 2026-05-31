import "server-only"

import { cpnuCircuitBreaker, type CircuitState } from "./cpnu-client"

export type CpnuServiceStatus = {
  available: boolean
  state: CircuitState
}

export function getCpnuServiceStatus(): CpnuServiceStatus {
  const state = cpnuCircuitBreaker.getState()
  return {
    available: state !== "open",
    state,
  }
}
