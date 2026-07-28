import { getLocale } from 'next-intl/server'
import { DEFAULT_LOCALE, isLocale } from '@/config/routes'
import { PaginaNoEncontrada } from '@/paginas/NoEncontrada'

/**
 * 404 traducida, para un `notFound()` lanzado dentro de una ruta con idioma
 * valido.
 *
 * No captura por si sola todas las rutas desconocidas: es una limitacion
 * documentada de next-intl, porque una URL que no encaja con ningun segmento
 * conocido nunca llega al layout del idioma. Por eso hacen falta las otras dos
 * piezas de la seccion 4.13: la ruta comodin `[[...slug]]`, que atrapa
 * `/es/soluciones/inventado`, y `app/not-found.tsx`, el ultimo recurso para lo
 * que no lleva idioma reconocible.
 */
export default async function NoEncontradaIdioma() {
  const locale = await getLocale()
  return <PaginaNoEncontrada locale={isLocale(locale) ? locale : DEFAULT_LOCALE} />
}
