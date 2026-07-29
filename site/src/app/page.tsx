import type { Metadata } from 'next'
import Link from 'next/link'
import { displayFont, sansFont } from '@/app/fuentes'
import { RepartoIdioma } from '@/components/RepartoIdioma'
import { LOCALES, getLocalizedPath } from '@/config/routes'
import { EMPRESA } from '@/lib/empresa'
import './globals.css'

/**
 * Pagina de `/`: reparte al idioma del navegador.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUE EXISTE SI NETLIFY YA REDIRIGE
 *
 * En produccion esta pagina casi nunca se sirve: las dos reglas de `netlify.toml`
 * responden un 302 en el borde, sin JavaScript y antes de llegar al fichero. Pero
 * esas reglas solo existen en Netlify, y eso deja dos huecos:
 *
 *   1. **`next dev`** no las conoce: `/` daba un 404 en desarrollo.
 *   2. Si algun dia la regla se desactiva o su condicion deja de casar, `/` se
 *      queda sin nada que servir.
 *
 * Con esta pagina, `/` siempre lleva a alguna parte. Y como el reparto del borde
 * tiene `force = true`, tiene prioridad: en produccion sigue mandando Netlify, que
 * es lo preferible porque no depende de JavaScript.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **No es contenido y no debe indexarse.** El contenido vive en `/es/` y `/en/`,
 * cada uno con su canonica; esta pagina solo decide a donde va quien escribe el
 * dominio a secas, y no entra en el sitemap.
 *
 * Los dos enlaces son visibles y funcionan **sin JavaScript**: si el script no
 * llega a ejecutarse, lo que queda es una eleccion de idioma, no una pagina en
 * blanco. Van sin traducir porque aqui todavia no se sabe el idioma: cada uno esta
 * escrito en el suyo, que es como se hace en una pagina de eleccion.
 */
export const metadata: Metadata = {
  title: EMPRESA.nombre,
  robots: { index: false, follow: true },
}

const NOMBRES: Record<(typeof LOCALES)[number], string> = {
  es: 'Español',
  en: 'English',
}

export default function Raiz() {
  return (
    // Monta su propio documento, como `not-found.tsx`: el layout raiz no renderiza
    // <html> ni <body>, porque el unico que sabe que va en `lang` es el layout de
    // idioma. Aqui el idioma aun no se conoce, asi que se declara el
    // predeterminado y la pagina se retira de la indexacion.
    <html lang="es" className={`${displayFont.variable} ${sansFont.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <RepartoIdioma />

        <main className="site-container flex flex-1 flex-col items-center justify-center gap-8 py-24 text-center">
          <p className="kicker text-cyan">{EMPRESA.nombre}</p>

          <h1 className="font-display text-2xl font-bold">
            Elige idioma
            <span className="text-text-dim"> · Choose your language</span>
          </h1>

          <ul className="flex flex-wrap items-center justify-center gap-4">
            {LOCALES.map((locale) => (
              <li key={locale}>
                <Link
                  href={getLocalizedPath('home', locale)}
                  hrefLang={locale}
                  className="font-display border-border hover:border-cyan hover:text-cyan focus-visible:outline-cyan inline-flex min-h-11 items-center rounded-[10px] border px-6 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {NOMBRES[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  )
}
