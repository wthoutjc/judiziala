"use client"

import { signOut, useSession } from "next-auth/react"
import { useEffect, useRef } from "react"
import { isDemoMode } from "@/lib/demo-mode"

const HEARTBEAT_MS = 45_000
const LOCK_NAME = "judiziala-session-heartbeat"
const HEARTBEAT_URL = "/api/heartbeat"

type PingResult = "ok" | "revoked" | "stop"

async function handleHeartbeatResponse(response: Response): Promise<PingResult> {
  if (response.status === 204 || response.ok) return "ok"
  if (response.status !== 401) return "ok"

  try {
    const body = (await response.json()) as { error?: string }
    if (body.error === "session_revoked") {
      await signOut({ callbackUrl: "/sesion-cerrada" })
      return "revoked"
    }

    if (body.error === "session_idle" || body.error === "session_expired") {
      await signOut({ callbackUrl: "/login?reason=session-expired" })
      return "stop"
    }
  } catch {
    // sendBeacon or empty body
  }

  await signOut({ callbackUrl: "/login" })
  return "stop"
}

async function pingHeartbeat(): Promise<PingResult> {
  try {
    const response = await fetch(HEARTBEAT_URL, {
      method: "POST",
      credentials: "same-origin",
    })
    return handleHeartbeatResponse(response)
  } catch {
    return "ok"
  }
}

function beaconHeartbeat() {
  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(HEARTBEAT_URL, "")
  }
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => resolve(), ms)

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId)
        reject(new DOMException("Aborted", "AbortError"))
      },
      { once: true },
    )
  })
}

async function leaderHeartbeatLoop(signal: AbortSignal) {
  while (!signal.aborted) {
    if (document.visibilityState === "visible") {
      const result = await pingHeartbeat()
      if (result !== "ok") return
    }

    try {
      await sleep(HEARTBEAT_MS, signal)
    } catch {
      return
    }
  }
}

async function runLeaderHeartbeat(signal: AbortSignal) {
  if (!navigator.locks?.request) {
    await leaderHeartbeatLoop(signal)
    return
  }

  try {
    await navigator.locks.request(
      LOCK_NAME,
      { ifAvailable: true, signal },
      async (lock) => {
        if (!lock) return
        await leaderHeartbeatLoop(signal)
      },
    )
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return
    throw error
  }
}

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const leaderAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (status !== "authenticated" || isDemoMode()) return

    const attemptLeader = () => {
      leaderAbortRef.current?.abort()
      const controller = new AbortController()
      leaderAbortRef.current = controller
      void runLeaderHeartbeat(controller.signal)
    }

    attemptLeader()

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        attemptLeader()
        return
      }

      leaderAbortRef.current?.abort()
    }

    const onPageHide = () => {
      beaconHeartbeat()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pagehide", onPageHide)

    return () => {
      leaderAbortRef.current?.abort()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pagehide", onPageHide)
    }
  }, [status])

  return children
}
