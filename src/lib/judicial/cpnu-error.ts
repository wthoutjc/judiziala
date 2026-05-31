import type { z } from "zod"

export type CpnuErrorCode =
  | "VALIDATION"
  | "HTTP"
  | "TIMEOUT"
  | "NETWORK"
  | "PARSE"
  | "RATE_LIMITED"
  | "CIRCUIT_OPEN"

export class CpnuError extends Error {
  readonly code: CpnuErrorCode
  readonly status?: number
  readonly url?: string
  readonly cause?: unknown

  constructor(
    message: string,
    code: CpnuErrorCode,
    options?: {
      cause?: unknown
      status?: number
      url?: string
    }
  ) {
    super(message, { cause: options?.cause })
    this.name = "CpnuError"
    this.code = code
    this.status = options?.status
    this.url = options?.url
    this.cause = options?.cause
  }

  static fromZod(message: string, cause: z.ZodError): CpnuError {
    return new CpnuError(message, "VALIDATION", { cause })
  }

  static isCpnuError(error: unknown): error is CpnuError {
    return error instanceof CpnuError
  }
}
