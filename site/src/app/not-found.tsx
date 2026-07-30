import Link from 'next/link'
import { displayFont, sansFont } from '@/app/fuentes'
import { DEFAULT_LOCALE, getLocalizedPath } from '@/config/routes'
import './globals.css'

/**
 * 404 de ultimo recurso, para lo que no lleva idioma reconocible.
 *
 * Es una de las tres piezas que hacen falta (seccion 4.13); las otras dos son
 * `app/[locale]/not-found.tsx`, para un `notFound()` lanzado dentro de una ruta
 * con idioma valido, y la ruta comodin `app/[locale]/[[...slug]]`, que atrapa
 * `/es/soluciones/inventado`.
 *
 * Va **sin traducciones**: si la URL no dice el idioma, no hay forma honesta de
 * saberlo, y detectarlo por `Accept-Language` es justo lo que la seccion 2.1
 * descarta. Monta su propio documento porque el layout raiz no lo hace.
 */
export default function NotFoundRaiz() {
  const inicio = getLocalizedPath('home', DEFAULT_LOCALE)

  return (
    <html lang={DEFAULT_LOCALE} className={`${displayFont.variable} ${sansFont.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <main className="site-container flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
          <p className="kicker text-cyan">404</p>
          <h1 className="heading-display">Página no encontrada</h1>
          <p className="texto-cuerpo">Page not found</p>
          <Link
            href={inicio}
            className="font-display border-border hover:border-cyan hover:text-cyan inline-flex min-h-11 items-center rounded-[10px] border px-6 text-sm font-bold transition-colors"
          >
            ISN Labs
          </Link>
        </main>
      </body>
    </html>
  )
}
