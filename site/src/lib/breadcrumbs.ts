import { getLocalizedPath, isEnabled, type Locale, type RouteId } from '@/config/routes'
import type { TramoBreadcrumb } from './tipos'

/** Tramo tal y como esta escrito en los ficheros de mensajes. */
export interface TramoMensaje {
  label: string
  routeId: string | null
}

/**
 * Convierte los tramos de los mensajes en migas con destino resuelto.
 *
 * `routeId: null` significa dos cosas distintas y las dos acaban sin enlace: o
 * es la pagina actual, o es un nivel intermedio que no tiene pagina propia
 * —«Soluciones» no existe como URL, pero si aparece en la jerarquia del brief—.
 *
 * Una ruta desactivada tampoco se enlaza: la regla general del plan es que o el
 * destino es real, o el elemento no se enlaza.
 */
export function resolverMigas(
  tramos: readonly TramoMensaje[],
  locale: Locale,
): TramoBreadcrumb[] {
  return tramos.map(({ label, routeId }) => {
    if (routeId === null) return { label, href: null }
    const id = routeId as RouteId
    return { label, href: isEnabled(id) ? getLocalizedPath(id, locale) : null }
  })
}
