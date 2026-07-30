import type { RouteId } from '@/config/routes'
import type { Mensajes } from '@/i18n/mensajes'

export interface TextosSeo {
  title: string
  description: string
}

/**
 * Titulo y descripcion SEO de cada ruta.
 *
 * Son accesores explicitos y no una busqueda dinamica por `${namespace}.seo`,
 * por dos razones:
 *
 * 1. `NamespaceKeys` de next-intl no resuelve rutas de esa profundidad con un
 *    arbol de mil nodos: TypeScript abandona la recursion y rechaza claves que
 *    existen. Un `as any` para taparlo desactivaria justo la comprobacion que
 *    justifica el aumento de tipos de la seccion 2.3.
 * 2. Asi el compilador verifica **cada** acceso contra la forma real de
 *    `es.json`, y el `Record<RouteId, …>` obliga a que ninguna ruta se quede sin
 *    metadatos: anadir un `RouteId` sin su entrada aqui no compila.
 */
export const SEO_POR_RUTA: Record<RouteId, (mensajes: Mensajes) => TextosSeo> = {
  home: (m) => m.home.seo,
  mssp: (m) => m.mssp.seo,
  msspIt: (m) => m.msspItCatalog.seo,
  msspOt: (m) => m.msspOtCatalog.seo,
  grc: (m) => m.grc.seo,
  grcCatalog: (m) => m.grcCatalog.seo,
  software: (m) => m.software.seo,
  sectors: (m) => m.sectors.seo,
  blog: (m) => m.blog.seo,
  company: (m) => m.company.seo,
  contact: (m) => m.contact.seo,
  calculator: (m) => m.calculator.seo,
  privacy: (m) => m.privacy.seo,
  legal: (m) => m.legal.seo,
  cookies: (m) => m.cookies.seo,
  notFound: (m) => m.common.notFound.seo,
}
