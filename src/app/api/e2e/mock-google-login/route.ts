import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { createSingleSessionAdapter } from "@/lib/auth/single-session"
import { SESSION_ABSOLUTE_MAX_AGE_SEC } from "@/lib/auth/session-expiry"
import { shouldUseSecureCookies } from "@/lib/auth/secure-cookies"
import {
  E2E_USER_EMAIL,
  e2eNotFoundResponse,
  isE2eEnabled,
} from "@/lib/e2e/guard"
import { db } from "@/lib/db"

export const runtime = "nodejs"

type MockLoginBody = {
  device?: string
}

export async function POST(request: Request) {
  if (!isE2eEnabled()) {
    return e2eNotFoundResponse()
  }

  const body = (await request.json().catch(() => ({}))) as MockLoginBody
  const user = await db.user.upsert({
    where: { email: E2E_USER_EMAIL },
    create: {
      email: E2E_USER_EMAIL,
      name: "E2E User",
      role: "ABOGADO",
    },
    update: {},
  })

  const sessionToken = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + SESSION_ABSOLUTE_MAX_AGE_SEC * 1000)
  const adapter = createSingleSessionAdapter(db)

  await adapter.createSession!({
    sessionToken,
    userId: user.id,
    expires,
  })

  if (body.device) {
    await db.session.updateMany({
      where: { sessionToken, userId: user.id },
      data: { device: body.device },
    })
  }

  const secure = shouldUseSecureCookies()
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

  const response = NextResponse.json({ sessionToken, userId: user.id })
  response.cookies.set({
    name: cookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
  })

  return response
}
