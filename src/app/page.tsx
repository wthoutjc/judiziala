import type { Metadata } from "next"
import Link from "next/link"
import { Scale, Zap, Bell, FileText, Clock, ArrowRight, Shield, BarChart3 } from "lucide-react"
import { PricingSection } from "@/components/public/pricing-section"
import { PublicNav } from "@/components/public/public-nav"
import { PublicFooter } from "@/components/public/public-footer"

export const metadata: Metadata = {
  title: "Judiziala — Monitor inteligente de procesos judiciales",
  description:
    "Monitorea automáticamente tus procesos judiciales colombianos. Alertas en tiempo real y resúmenes con IA. Reducción del 70% en tiempo operativo legal.",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
  featured = false,
}: {
  children: React.ReactNode
  className?: string
  featured?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-8 ${className}`}
      style={{
        border: featured ? "1px solid rgba(99,102,241,0.22)" : "1px solid rgba(15,23,42,0.08)",
        background: featured ? "rgba(99,102,241,0.04)" : "#FFFFFF",
        backdropFilter: "none",
        boxShadow: featured
          ? "0 8px 32px rgba(99,102,241,0.12), 0 0 0 1px rgba(99,102,241,0.06)"
          : "0 1px 3px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.04)",
      }}
    >
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: "#F8FAFC", color: "#0F172A", minHeight: "100vh" }}>
      <PublicNav />

      <main>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          {/* Radial spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(99,102,241,0.10) 0%, transparent 65%)",
            }}
          />

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full mb-8"
              style={{
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.18)",
                color: "#4F46E5",
              }}
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Reducción del 70% en tiempo operativo legal</span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-[72px] font-bold mb-6"
              style={{ color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.04 }}
            >
              Monitorea cada actuación judicial.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #818CF8 0%, #C4B5FD 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Nunca pierdas un término.
              </span>
            </h1>

            {/* Sub */}
            <p
              className="text-lg max-w-2xl mx-auto mb-10"
              style={{ color: "#475569", lineHeight: 1.6 }}
            >
              Judiziala revisa automáticamente el Sistema CPNU y te alerta antes de que sea tarde.
              Resúmenes con IA incluidos. Sin revisión manual.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl"
                style={{
                  background: "#6366F1",
                  boxShadow: "0 0 24px rgba(99,102,241,0.30)",
                  transition: "background 200ms cubic-bezier(0.25,1,0.5,1), box-shadow 200ms",
                }}
              >
                Comenzar gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-xl"
                style={{
                  border: "1px solid rgba(15,23,42,0.14)",
                  color: "#475569",
                  transition: "border-color 200ms, color 200ms, background 200ms",
                }}
              >
                Ver precios
              </Link>
            </div>
          </div>

          {/* ── Dashboard mockup ── */}
          <div className="relative max-w-5xl mx-auto mt-20">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(15,23,42,0.12)",
                background: "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)",
                boxShadow: "0 32px 80px rgba(15,23,42,0.18), 0 1px 3px rgba(15,23,42,0.10)",
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: "#3F3F46" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#3F3F46" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#3F3F46" }} />
                <div className="flex-1 flex justify-center">
                  <div
                    className="px-10 py-1 rounded-md text-xs"
                    style={{ background: "#0F172A", color: "#475569" }}
                  >
                    app.judiziala.co/dashboard
                  </div>
                </div>
              </div>

              <div className="p-5 grid grid-cols-3 gap-3">
                {/* KPI cards */}
                {[
                  { label: "Procesos activos", value: "42", delta: "+3 este mes", accent: "#818CF8" },
                  { label: "Alertas pendientes", value: "7", delta: "2 urgentes", accent: "#FBBF24" },
                  { label: "Términos < 72h", value: "5", delta: "próximos", accent: "#F87171" },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-xl p-4"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)" }}
                  >
                    <p className="text-[11px] mb-1" style={{ color: "#71717A" }}>{kpi.label}</p>
                    <p
                      className="text-2xl font-bold tracking-tight tabular"
                      style={{ color: kpi.accent, letterSpacing: "-0.02em" }}
                    >
                      {kpi.value}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#52525B" }}>{kpi.delta}</p>
                  </div>
                ))}

                {/* Mock table */}
                <div
                  className="col-span-3 rounded-xl p-4"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)" }}
                >
                  <p className="text-xs font-medium mb-3" style={{ color: "#64748B" }}>Procesos recientes</p>
                  <div className="space-y-0">
                    {[
                      { rad: "05001-40-03-001-2023-00412", estado: "Activo", auto: "Auto de trámite", fecha: "Hace 2 h" },
                      { rad: "11001-02-03-000-2022-01567", estado: "En despacho", auto: "Fijación de audiencia", fecha: "Hace 1 día" },
                      { rad: "76001-31-10-011-2021-00834", estado: "Activo", auto: "Traslado de excepciones", fecha: "Hace 3 días" },
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2.5"
                        style={{ borderBottom: i < 2 ? "1px solid rgba(148,163,184,0.07)" : "none" }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: p.estado === "Activo" ? "#34D399" : "#60A5FA" }}
                          />
                          <span className="text-[11px] font-mono truncate" style={{ color: "#71717A" }}>
                            {p.rad}
                          </span>
                        </div>
                        <span className="text-[11px] hidden sm:block mx-4" style={{ color: "#52525B" }}>{p.auto}</span>
                        <span className="text-[11px] flex-shrink-0" style={{ color: "#3F3F46" }}>{p.fecha}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Glow puddle */}
            <div
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-20 pointer-events-none"
              aria-hidden
              style={{
                background: "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </div>
        </section>

        {/* ── STATS ──────────────────────────────────────────────────────────── */}
        <section
          className="py-16 px-6"
          style={{ borderTop: "1px solid rgba(15,23,42,0.08)", borderBottom: "1px solid rgba(15,23,42,0.08)" }}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {[
              { value: "70%", label: "reducción en tiempo operativo legal" },
              { value: "24/7", label: "monitoreo continuo sin interrupciones" },
              { value: "< 2 min", label: "para recibir alerta tras nueva actuación" },
            ].map((stat) => (
              <div key={stat.value}>
                <p
                  className="text-4xl font-bold tabular mb-2"
                  style={{ color: "#0F172A", letterSpacing: "-0.025em" }}
                >
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: "#475569", lineHeight: 1.5 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES BENTO ──────────────────────────────────────────────────── */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#818CF8" }}>
                Características
              </p>
              <h2
                className="text-3xl lg:text-4xl font-bold"
                style={{ color: "#0F172A", letterSpacing: "-0.025em" }}
              >
                Todo lo que necesitas.
                <br />
                <span style={{ color: "#94A3B8" }}>Nada que no necesitas.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Wide — Monitoreo */}
              <GlassCard className="sm:col-span-2" featured>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
                >
                  <Zap className="w-5 h-5" style={{ color: "#818CF8" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#1E293B", letterSpacing: "-0.01em" }}>
                  Monitoreo automático 24/7
                </h3>
                <p className="text-sm max-w-md" style={{ color: "#475569", lineHeight: 1.65 }}>
                  Consultamos el Sistema CPNU automáticamente en tu nombre. Detectamos nuevas actuaciones, autos y términos en tiempo real. Sin código, sin configuraciones técnicas.
                </p>
              </GlassCard>

              {/* Narrow — IA */}
              <GlassCard>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.20)" }}
                >
                  <FileText className="w-5 h-5" style={{ color: "#C4B5FD" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#1E293B", letterSpacing: "-0.01em" }}>
                  IA que resume autos
                </h3>
                <p className="text-sm" style={{ color: "#475569", lineHeight: 1.65 }}>
                  Claude AI lee los documentos judiciales y te entrega los puntos clave en segundos.
                </p>
              </GlassCard>

              {/* Narrow — Alertas */}
              <GlassCard>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.20)" }}
                >
                  <Bell className="w-5 h-5" style={{ color: "#FCD34D" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#1E293B", letterSpacing: "-0.01em" }}>
                  Alertas multicanal
                </h3>
                <p className="text-sm" style={{ color: "#475569", lineHeight: 1.65 }}>
                  Email, WhatsApp y push. Tú decides cuándo y cómo recibirlas.
                </p>
              </GlassCard>

              {/* Wide — Timeline */}
              <GlassCard className="sm:col-span-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.20)" }}
                >
                  <Clock className="w-5 h-5" style={{ color: "#6EE7B7" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#1E293B", letterSpacing: "-0.01em" }}>
                  Timeline procesal visual
                </h3>
                <p className="text-sm max-w-md" style={{ color: "#475569", lineHeight: 1.65 }}>
                  Ve la historia completa del proceso ordenada cronológicamente. Sin entrar al sistema, sin buscar entre PDFs. Todo el historial judicial en una sola vista.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
        <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#818CF8" }}>
                Cómo funciona
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold" style={{ color: "#0F172A", letterSpacing: "-0.025em" }}>
                Listo en 3 minutos.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  step: "01", title: "Agrega un radicado", accent: "#818CF8", icon: BarChart3,
                  desc: "Escribe el número de radicado del proceso que quieres monitorear. Lo buscamos en el CPNU automáticamente.",
                },
                {
                  step: "02", title: "Configura alertas", accent: "#FCD34D", icon: Bell,
                  desc: "Elige qué eventos te importan: nuevas actuaciones, términos próximos, documentos. Elige el canal.",
                },
                {
                  step: "03", title: "Trabaja en lo importante", accent: "#6EE7B7", icon: Shield,
                  desc: "Judiziala monitorea y te avisa. Tú dedícate a tus clientes mientras nosotros vigilamos el sistema.",
                },
              ].map((item) => (
                <div key={item.step}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xs font-bold tabular" style={{ color: item.accent }}>{item.step}</span>
                    <div className="h-px flex-1" style={{ background: "rgba(15,23,42,0.08)" }} />
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ border: "1px solid rgba(15,23,42,0.10)", background: "#FFFFFF" }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: "#94A3B8" }} />
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: "#1E293B", letterSpacing: "-0.01em" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm" style={{ color: "#475569", lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING PREVIEW ─────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 px-6" style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#818CF8" }}>
                Precios
              </p>
              <h2
                className="text-3xl lg:text-4xl font-bold mb-3"
                style={{ color: "#0F172A", letterSpacing: "-0.025em" }}
              >
                Simple y transparente.
              </h2>
              <p className="text-sm" style={{ color: "#475569" }}>Sin costos ocultos. Sin permanencia mínima.</p>
            </div>
            <PricingSection showMatrixLink />
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
        <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
          <div className="max-w-xl mx-auto text-center">
            <div
              className="rounded-3xl p-12 relative overflow-hidden"
              style={{
                border: "1px solid rgba(15,23,42,0.08)",
                background: "radial-gradient(ellipse 100% 100% at 50% 130%, rgba(99,102,241,0.10) 0%, transparent 60%), #FFFFFF",
                boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 8px 32px rgba(15,23,42,0.06)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
              >
                <Scale className="w-6 h-6" style={{ color: "#818CF8" }} />
              </div>
              <h2
                className="text-3xl font-bold mb-4"
                style={{ color: "#0F172A", letterSpacing: "-0.025em" }}
              >
                Empieza a monitorear hoy.
              </h2>
              <p className="text-sm mb-8" style={{ color: "#475569", lineHeight: 1.65 }}>
                Configura tu primer proceso en menos de 3 minutos.
                <br />Sin tarjeta de crédito. Sin compromisos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl"
                  style={{ background: "#6366F1", boxShadow: "0 0 28px rgba(99,102,241,0.30)" }}
                >
                  Comenzar gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/pricing" className="text-sm transition-colors duration-150" style={{ color: "#6366F1" }}>
                  Ver todos los planes
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
