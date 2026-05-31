// Revocation + expiry guards: auth.ts callbacks.authorized + session
export { auth as middleware } from "./src/auth"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
