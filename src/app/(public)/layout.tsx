import type { ReactNode } from "react"
import { PublicNav } from "@/components/public/public-nav"
import { PublicFooter } from "@/components/public/public-footer"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC", color: "#0F172A" }}>
      <PublicNav />
      <main>{children}</main>
      <PublicFooter />
    </div>
  )
}
