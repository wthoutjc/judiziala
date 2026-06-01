"use client"

import { useState } from "react"

const faqItems = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Puedes cambiar de plan mensualmente sin restricciones. El cambio se aplica al siguiente ciclo de facturación sin penalizaciones.",
  },
  {
    q: "¿Cómo funciona el monitoreo del CPNU?",
    a: "Judiziala consulta automáticamente el Sistema de Consultas de Procesos de la Rama Judicial (CPNU) en tu nombre. No necesitas acceso al sistema — nosotros lo hacemos y te notificamos cuando hay cambios.",
  },
  {
    q: "¿Puedo probar el sistema antes de pagar?",
    a: "Sí. El plan Starter comienza sin costo. No se requiere tarjeta de crédito para empezar. Cuando superes el límite de procesos, puedes decidir si actualizas.",
  },
  {
    q: "¿Mis datos son seguros?",
    a: "Sí. Usamos cifrado en tránsito (TLS 1.3) y en reposo. Solo almacenamos los radicados y datos de procesos que tú registras. No compartimos ni vendemos información a terceros.",
  },
  {
    q: "¿Qué pasa si un proceso no aparece en el CPNU?",
    a: "Algunos procesos muy antiguos o de ciertos juzgados pueden no estar indexados en el CPNU. En esos casos, te notificamos y el proceso no cuenta para tu cuota mensual.",
  },
  {
    q: "¿El plan Business incluye soporte en español?",
    a: "Sí. Todos nuestros planes incluyen soporte en español colombiano. El plan Business tiene un gerente de cuenta dedicado disponible de lunes a viernes.",
  },
]

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {faqItems.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={i}
            className="rounded-xl overflow-hidden"
            style={{
              border: isOpen ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(15,23,42,0.08)",
              background: isOpen ? "rgba(99,102,241,0.04)" : "#FFFFFF",
              boxShadow: isOpen
                ? "0 4px 16px rgba(99,102,241,0.08)"
                : "0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.02)",
              transition: "border-color 200ms cubic-bezier(0.25,1,0.5,1), background 200ms",
            }}
          >
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium" style={{ color: isOpen ? "#0F172A" : "#334155" }}>
                {item.q}
              </span>
              <span
                className="ml-4 flex-shrink-0"
                style={{
                  color: isOpen ? "#6366F1" : "#94A3B8",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 250ms cubic-bezier(0.25,1,0.5,1), color 200ms",
                  display: "block",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div
                className="px-5 pb-4 text-sm leading-[1.65]"
                style={{
                  color: "#475569",
                  borderTop: "1px solid rgba(15,23,42,0.07)",
                  paddingTop: "14px",
                }}
              >
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
