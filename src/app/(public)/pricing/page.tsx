"use client"

import Link from "next/link"
import { ArrowRight, Check, Minus } from "lucide-react"
import { PricingSection } from "@/components/public/pricing-section"
import { FaqAccordion } from "@/components/public/faq-accordion"

// ── Feature matrix data ───────────────────────────────────────────────────────

type FeatureVal = boolean | string

interface Feature {
  name: string
  starter: FeatureVal
  pro: FeatureVal
  business: FeatureVal
}

interface FeatureGroup {
  category: string
  features: Feature[]
}

const featureGroups: FeatureGroup[] = [
  {
    category: "Capacidad",
    features: [
      { name: "Procesos monitoreados", starter: "15", pro: "100", business: "Ilimitados" },
      { name: "Usuarios", starter: "1", pro: "1", business: "5" },
      { name: "Historial de actuaciones", starter: "90 días", pro: "1 año", business: "Ilimitado" },
    ],
  },
  {
    category: "Monitoreo y alertas",
    features: [
      { name: "Monitoreo automático CPNU", starter: true, pro: true, business: true },
      { name: "Alertas por email", starter: true, pro: true, business: true },
      { name: "Alertas por WhatsApp", starter: false, pro: true, business: true },
      { name: "Alertas push", starter: false, pro: true, business: true },
      {
        name: "Frecuencia de monitoreo",
        starter: "Cada 4 h",
        pro: "Cada 1 h",
        business: "Tiempo real",
      },
    ],
  },
  {
    category: "Inteligencia Artificial",
    features: [
      {
        name: "Resúmenes de autos con IA",
        starter: "Básicos",
        pro: "Completos",
        business: "Completos",
      },
      { name: "Análisis de documentos PDF", starter: false, pro: true, business: true },
      { name: "Extracción de términos y fechas", starter: false, pro: true, business: true },
    ],
  },
  {
    category: "Herramientas",
    features: [
      { name: "Timeline procesal visual", starter: true, pro: true, business: true },
      {
        name: "Exportación de reportes (PDF / Excel)",
        starter: false,
        pro: true,
        business: true,
      },
      {
        name: "API de integración",
        starter: false,
        pro: "Básica",
        business: "Avanzada",
      },
      {
        name: "Integración con sistemas jurídicos",
        starter: false,
        pro: false,
        business: true,
      },
    ],
  },
  {
    category: "Soporte",
    features: [
      { name: "Soporte por chat", starter: true, pro: true, business: true },
      { name: "Soporte prioritario", starter: false, pro: true, business: true },
      { name: "Gerente de cuenta dedicado", starter: false, pro: false, business: true },
      { name: "Onboarding personalizado", starter: false, pro: false, business: true },
      { name: "SLA garantizado", starter: false, pro: false, business: "99.9%" },
    ],
  },
]

function FeatureCell({
  value,
  featured = false,
}: {
  value: FeatureVal
  featured?: boolean
}) {
  if (value === true)
    return (
      <Check
        className="w-4 h-4 mx-auto"
        style={{ color: featured ? "#818CF8" : "#34D399" }}
      />
    )
  if (value === false)
    return <Minus className="w-4 h-4 mx-auto" style={{ color: "#27272A" }} />
  return (
    <span
      className="text-xs font-medium"
      style={{ color: featured ? "#4F46E5" : "#475569" }}
    >
      {value}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="pt-24">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#818CF8" }}
          >
            Precios
          </p>
          <h1
            className="text-4xl lg:text-6xl font-bold mb-4"
            style={{ color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.08 }}
          >
            Simple y transparente.
          </h1>
          <p className="text-base max-w-md mx-auto" style={{ color: "#475569", lineHeight: 1.65 }}>
            Sin costos ocultos, sin letra pequeña. Elige el plan que se ajusta a tu práctica.
          </p>
        </div>
      </section>

      {/* ── Pricing cards ────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <PricingSection />
        </div>
      </section>

      {/* ── Feature matrix ───────────────────────────────────────────────── */}
      <section
        className="px-6 pb-24"
        style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}
      >
        <div className="max-w-5xl mx-auto pt-20">
          <h2
            className="text-2xl font-bold text-center mb-12"
            style={{ color: "#0F172A", letterSpacing: "-0.02em" }}
          >
            Comparación detallada
          </h2>

          <div
            className="overflow-x-auto rounded-2xl"
            style={{
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 1px 3px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.04)",
            }}
          >
            <table className="w-full min-w-[560px] border-collapse">
              {/* Header */}
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(15,23,42,0.08)", background: "#FFFFFF" }}>
                  <th className="text-left px-5 py-4 w-[42%]">
                    <span className="text-xs font-medium" style={{ color: "#71717A" }}>
                      Característica
                    </span>
                  </th>
                  {[
                    { name: "Starter", price: "$ 49.900", featured: false },
                    { name: "Pro", price: "$ 79.900", featured: true },
                    { name: "Business", price: "$ 189.900", featured: false },
                  ].map((plan) => (
                    <th key={plan.name} className="px-5 py-4 text-center">
                      <div
                        className="text-sm font-semibold mb-0.5"
                        style={{ color: plan.featured ? "#4F46E5" : "#334155" }}
                      >
                        {plan.name}
                      </div>
                      <div className="text-xs" style={{ color: "#71717A" }}>
                        {plan.price} COP/mes
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {featureGroups.map((group) => (
                  <>
                    {/* Category row */}
                    <tr
                      key={`cat-${group.category}`}
                      style={{
                        borderBottom: "1px solid rgba(15,23,42,0.04)",
                        background: "rgba(15,23,42,0.02)",
                      }}
                    >
                      <td colSpan={4} className="px-5 py-2.5">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: "#94A3B8" }}
                        >
                          {group.category}
                        </span>
                      </td>
                    </tr>

                    {/* Feature rows */}
                    {group.features.map((feat, fi) => (
                      <tr
                        key={`${group.category}-${feat.name}`}
                        style={{
                          borderBottom:
                            fi < group.features.length - 1
                              ? "1px solid rgba(15,23,42,0.04)"
                              : "1px solid rgba(15,23,42,0.04)",
                          transition: "background 150ms",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-sm" style={{ color: "#334155" }}>
                            {feat.name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <FeatureCell value={feat.starter} />
                        </td>
                        <td
                          className="px-5 py-3.5 text-center"
                          style={{ background: "rgba(99,102,241,0.04)" }}
                        >
                          <FeatureCell value={feat.pro} featured />
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <FeatureCell value={feat.business} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}

                {/* CTA row */}
                <tr style={{ background: "rgba(15,23,42,0.02)" }}>
                  <td className="px-5 py-6" />
                  {[
                    { label: "Comenzar gratis", featured: false },
                    { label: "Empezar con Pro", featured: true },
                    { label: "Contactar ventas", featured: false },
                  ].map((cta) => (
                    <td key={cta.label} className="px-5 py-6 text-center">
                      <Link
                        href="/login"
                        className="inline-block text-xs font-semibold px-4 py-2 rounded-lg"
                        style={
                          cta.featured
                            ? {
                                background: "#6366F1",
                                color: "#FFFFFF",
                                boxShadow: "0 2px 16px rgba(99,102,241,0.30)",
                                transition: "background 200ms",
                              }
                            : {
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "#71717A",
                                transition: "border-color 200ms, color 200ms, background 200ms",
                              }
                        }
                      >
                        {cta.label}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section
        className="px-6 pb-24"
        style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}
      >
        <div className="max-w-2xl mx-auto pt-20">
          <h2
            className="text-2xl font-bold text-center mb-12"
            style={{ color: "#0F172A", letterSpacing: "-0.02em" }}
          >
            Preguntas frecuentes
          </h2>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-lg mx-auto text-center">
          <div
            className="rounded-3xl p-10"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "radial-gradient(ellipse at 50% 130%, rgba(99,102,241,0.10) 0%, transparent 60%), #FFFFFF",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#0F172A", letterSpacing: "-0.02em" }}
            >
              ¿Listo para empezar?
            </h2>
            <p className="text-sm mb-8" style={{ color: "#475569", lineHeight: 1.65 }}>
              Configura tu primer proceso en minutos.
              <br />
              Sin tarjeta de crédito.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl"
              style={{
                background: "#6366F1",
                boxShadow: "0 0 24px rgba(99,102,241,0.30)",
                transition: "background 200ms cubic-bezier(0.25,1,0.5,1)",
              }}
            >
              Comenzar gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
