export type NlExtractorErrorCode = "NO_TOOL_USE" | "VALIDATION" | "API_ERROR"

export class NlExtractorError extends Error {
  readonly code: NlExtractorErrorCode
  readonly cause: unknown

  constructor(message: string, code: NlExtractorErrorCode, cause?: unknown) {
    super(message)
    this.name = "NlExtractorError"
    this.code = code
    this.cause = cause
  }

  static isNlExtractorError(error: unknown): error is NlExtractorError {
    return error instanceof NlExtractorError
  }
}
