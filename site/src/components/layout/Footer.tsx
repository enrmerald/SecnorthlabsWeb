import Link from 'next/link'
import type { Locale } from '@/config/routes'
import { construirPie } from '@/lib/navegacion'
import { LogoMarca } from '@/components/ui/LogoMarca'
import { LOGO_ISNLABS } from '@/config/logos'

/**
 * Pie del sitio (seccion 3.2, mockup image3.png).
 *
 * Componente de build entero: no lleva ni una linea de JavaScript al navegador.
 *
 * Cuatro zonas: marca (wordmark + claim + razon social) y tres columnas
 * (Soluciones, Empresa, Legal), todas leidas del array de enlaces. Debajo, el
 * copyright y, a la derecha, el aviso «SentryN3t® es una marca de Ewala», que
 * es **obligatorio y no se omite**.
 *
 * El boton «Configurar cookies» solo aparece si el CMP esta activo. Un boton que
 * abre un gestor de consentimiento inexistente es peor que no tenerlo.
 */
export function Footer({ locale }: { locale: Locale }) {
  const pie = construirPie(locale)

  return (
    <footer className="border-border bg-bg mt-auto border-t">
      <div className="site-container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link href={pie.inicio} className="w-fit" aria-label={LOGO_ISNLABS.alt}>
            <LogoMarca logo={LOGO_ISNLABS} alto={24} ancho={160} />
          </Link>
          <p className="font-display text-text-dim text-xs tracking-wide">{pie.claim}</p>
          <p className="text-text-dim text-xs">{pie.legalLine}</p>
        </div>

        {pie.columnas.map((columna) => (
          <nav key={columna.title} aria-label={columna.title}>
            <h2 className="etiqueta text-text-dim mb-4">{columna.title}</h2>
            <ul className="flex flex-col gap-2.5">
              {columna.links.map((enlace) => (
                <li key={enlace.href}>
                  {/* `min-h-6` para cumplir el objetivo tactil minimo de WCAG
                      2.2: sin el, un enlace de pie mide 21px de alto. */}
                  <Link
                    href={enlace.href}
                    className="text-text-dim hover:text-cyan inline-flex min-h-6 items-center text-sm transition-colors"
                  >
                    {enlace.label}
                  </Link>
                </li>
              ))}
              {/* Escenario B de la Fase 8: solo si hay CMP que abrir. */}
              {columna.cookieSettings && (
                <li>
                  <button
                    type="button"
                    data-cmp-open
                    className="text-text-dim hover:text-cyan inline-flex min-h-6 items-center text-left text-sm transition-colors"
                  >
                    {columna.cookieSettings}
                  </button>
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-border border-t">
        <div className="site-container flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-text-dim">{pie.copyright}</p>
          <p className="font-display text-text-dim">{pie.ewalaNotice}</p>
        </div>
      </div>
    </footer>
  )
}
