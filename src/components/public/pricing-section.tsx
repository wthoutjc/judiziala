"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"

type BillingCycle = "monthly" | "annual"

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  description: string
  badge?: string
  features: readonly string[]
  cta: string
  href: string
  featured: boolean
}

const DISCOUNT = 0.2

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49900,
    description: "Para abogados independientes que empiezan a escalar.",
    features: [
      "15 procesos monitoreados",
      "Alertas por email",
      "Resúmenes IA básicos",
      "Timeline procesal visual",
      "Soporte por chat",
    ],
    cta: "Comenzar gratis",
    href: "/login",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 79900,
    description: "Para abogados y firmas que ya manejan volumen real.",
    badge: "Más popular",
    features: [
      "100 procesos monitoreados",
      "Alertas email + WhatsApp + push",
      "Resúmenes IA completos",
      "Análisis de documentos PDF",
      "Exportación de reportes",
      "API básica de integración",
      "Soporte prioritario",
    ],
    cta: "Empezar con Pro",
    href: "/login",
    featured: true,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 189900,
    description: "Para firmas y departamentos jurídicos corporativos.",
    features: [
      "Procesos ilimitados",
      "Hasta 5 usuarios",
      "Todo lo de Pro incluido",
      "Integración con sistemas jurídicos",
      "API avanzada",
      "SLA 99.9% garantizado",
      "Onboarding personalizado",
      "Soporte dedicado",
    ],
    cta: "Contactar ventas",
    href: "/login",
    featured: false,
  },
]

function formatCOP(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

interface PricingSectionProps {
  showMatrixLink?: boolean
}

export function PricingSection({ showMatrixLink = false }: PricingSectionProps) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const isAnnual = cycle === "annual"

  return (
    <div className="w-full">
      {/* ── Billing toggle ── */}
      <div className="flex items-center justify-center gap-3 mb-14">
        <span
          className="text-sm transition-colors duration-150"
          style={{ color: !isAnnual ? "#0F172A" : "#94A3B8", fontWeight: !isAnnual ? 500 : 400 }}
        >
          Mensual
        </span>

        <button
          role="switch"
          aria-checked={isAnnual}
          aria-label="Cambiar ciclo de facturación"
          onClick={() => setCycle(isAnnual ? "monthly" : "annual")}
          className="relative w-11 h-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
          style={{
            background: isAnnual ? "#6366F1" : "#CBD5E1",
            transition: "background 300ms cubic-bezier(0.25,1,0.5,1)",
            boxShadow: isAnnual ? "0 0 12px rgba(99,102,241,0.4)" : "none",
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
            style={{
              transform: isAnnual ? "translateX(20px)" : "translateX(0)",
              transition: "transform 300ms cubic-bezier(0.25,1,0.5,1)",
            }}
          />
        </button>

        <div className="flex items-center gap-2">
          <span
            className="text-sm transition-colors duration-150"
            style={{ color: isAnnual ? "#0F172A" : "#94A3B8", fontWeight: isAnnual ? 500 : 400 }}
          >
            Anual
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
            style={
              isAnnual
                ? {
                    background: "rgba(99,102,241,0.15)",
                    color: "#A5B4FC",
                    borderColor: "rgba(99,102,241,0.3)",
                    transition: "all 200ms",
                  }
                : {
                    background: "transparent",
                    color: "#94A3B8",
                    borderColor: "rgba(15,23,42,0.10)",
                    transition: "all 200ms",
                  }
            }
          >
            {isAnnual ? "Ahorras 20%" : "−20% anual"}
          </span>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-center">
        {plans.map((plan) => {
          const basePrice = plan.monthlyPrice
          const displayPrice = isAnnual ? Math.round(basePrice * (1 - DISCOUNT)) : basePrice

          return (
            <div
              key={plan.id}
              className={cn("relative rounded-2xl p-6 flex flex-col", plan.featured ? "md:scale-[1.04]"  : "")}
              style={{
                border: plan.featured ? "1px solid rgba(99,102,241,0.30)" : "1px solid rgba(15,23,42,0.09)",
                background: plan.featured ? "rgba(99,102,241,0.04)" : "#FFFFFF",
                backdropFilter: "none",
                boxShadow: plan.featured
                  ? "0 8px 32px rgba(99,102,241,0.14), 0 0 0 1px rgba(99,102,241,0.08)"
                  : "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
                transition: "transform 200ms cubic-bezier(0.25,1,0.5,1), border-color 200ms cubic-bezier(0.25,1,0.5,1), box-shadow 200ms cubic-bezier(0.25,1,0.5,1)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                if (plan.featured) {
                  el.style.boxShadow = "0 16px 48px rgba(99,102,241,0.20), 0 0 0 1px rgba(99,102,241,0.15)"
                  el.style.borderColor = "rgba(99,102,241,0.45)"
                } else {
                  el.style.borderColor = "rgba(15,23,42,0.16)"
                  el.style.boxShadow = "0 4px 24px rgba(15,23,42,0.09), 0 1px 3px rgba(15,23,42,0.06)"
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                if (plan.featured) {
                  el.style.boxShadow = "0 8px 32px rgba(99,102,241,0.14), 0 0 0 1px rgba(99,102,241,0.08)"
                  el.style.borderColor = "rgba(99,102,241,0.30)"
                } else {
                  el.style.borderColor = "rgba(15,23,42,0.09)"
                  el.style.boxShadow = "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)"
                }
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="flex items-center gap-1 text-[11px] font-semibold text-white px-3 py-1 rounded-full"
                    style={{
                      background: "#6366F1",
                      boxShadow: "0 4px 16px rgba(99,102,241,0.45)",
                    }}
                  >
                    <Star className="w-2.5 h-2.5 fill-current" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-5">
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: plan.featured ? "#4F46E5" : "#64748B" }}
                >
                  {plan.name}
                </h3>
                <p className="text-xs leading-[1.6]" style={{ color: "#64748B" }}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-2">
                  {isAnnual && (
                    <span className="text-sm line-through self-center mb-0.5" style={{ color: "#94A3B8" }}>
                      ${formatCOP(basePrice)}
                    </span>
                  )}
                  <span
                    className="text-[42px] font-bold leading-none tracking-tight tabular"
                    style={{ color: "#0F172A", letterSpacing: "-0.03em" }}
                  >
                    ${formatCOP(displayPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs" style={{ color: "#64748B" }}>COP / mes</span>
                  {isAnnual && (
                    <span className="text-xs" style={{ color: "#818CF8" }}>
                      · facturado anual
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <Link
                href={plan.href}
                className="w-full text-center text-sm font-semibold px-4 py-2.5 rounded-xl mb-2"
                style={
                  plan.featured
                    ? {
                        background: "#6366F1",
                        color: "#FFFFFF",
                        boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
                        transition: "background 200ms cubic-bezier(0.25,1,0.5,1), box-shadow 200ms",
                      }
                    : {
                        border: "1px solid rgba(15,23,42,0.14)",
                        color: "#475569",
                        background: "transparent",
                        transition: "border-color 200ms, background 200ms, color 200ms",
                      }
                }
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  if (plan.featured) {
                    el.style.background = "#818CF8"
                    el.style.boxShadow = "0 4px 28px rgba(99,102,241,0.45)"
                  } else {
                    el.style.borderColor = "rgba(15,23,42,0.24)"
                    el.style.background = "rgba(15,23,42,0.04)"
                    el.style.color = "#0F172A"
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  if (plan.featured) {
                    el.style.background = "#6366F1"
                    el.style.boxShadow = "0 4px 24px rgba(99,102,241,0.3)"
                  } else {
                    el.style.borderColor = "rgba(15,23,42,0.14)"
                    el.style.background = "transparent"
                    el.style.color = "#475569"
                  }
                }}
              >
                {plan.cta}
              </Link>

              {/* Micro-copy */}
              <p className="text-[11px] text-center mb-6" style={{ color: "#94A3B8" }}>
                Cancela cuando quieras · Sin tarjeta de crédito
              </p>

              {/* Feature list */}
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      style={{ color: plan.featured ? "#6366F1" : "#10B981" }}
                    />
                    <span className="text-xs leading-[1.5]" style={{ color: "#475569" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Matrix link */}
      {showMatrixLink && (
        <p className="mt-10 text-center">
          <Link
            href="/pricing"
            className="text-sm transition-colors duration-150"
            style={{ color: "#64748B" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#6366F1")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748B")}
          >
            Ver comparación completa de características →
          </Link>
        </p>
      )}
    </div>
  )
}
