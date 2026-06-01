import Link from "next/link"
import { Scale } from "lucide-react"

export function PublicFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(15,23,42,0.08)", background: "#F1F5F9" }} className="mt-0">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#6366F1", boxShadow: "0 0 12px rgba(99,102,241,0.3)" }}
              >
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-slate-900 tracking-tight text-sm">Judiziala</span>
            </div>
            <p className="text-sm text-slate-500 leading-[1.6] max-w-xs">
              Monitor inteligente de procesos judiciales colombianos. Impulsado por IA. Construido para abogados.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Producto</h4>
            <ul className="space-y-3.5">
              <li>
                <Link href="/#features" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150">
                  Características
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150">
                  Iniciar sesión
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Legal</h4>
            <ul className="space-y-3.5">
              <li>
                <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150">
                  Términos de uso
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150">
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}
        >
          <p className="text-xs text-slate-500">© 2025 Judiziala. Todos los derechos reservados.</p>
          <p className="text-xs text-slate-500">Hecho en Colombia 🇨🇴</p>
        </div>
      </div>
    </footer>
  )
}
