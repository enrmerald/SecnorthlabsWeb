import type { ReactNode } from 'react'
import type { Locale, RouteDefinition, RouteId } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import { SEO_POR_RUTA } from '@/lib/seo-por-ruta'

/**
 * Registro de renderizadores: un componente por pagina, que recibe el idioma
 * (seccion 2.1.2). La ruta atrapatodo resuelve `locale + slug` a un `RouteId` y
 * delega aqui.
 *
 * El `Record<RouteId, …>` no es decorativo: si manana se anade un `RouteId` al
 * manifiesto y nadie escribe su renderizador, **no compila**.
 */
export interface PropsRenderizador {
  locale: Locale
  route: RouteDefinition
}

export type Renderizador = (props: PropsRenderizador) => ReactNode | Promise<ReactNode>

/**
 * Provisional: hasta la Fase 4 todas las paginas comparten un esqueleto que
 * solo pinta su titulo SEO. Existe para que el enrutado, los metadatos, el
 * sitemap y `verify:export` se puedan verificar antes de escribir el contenido.
 */
function EnConstruccion({ route, locale }: PropsRenderizador) {
  const { title, description } = SEO_POR_RUTA[route.id](cargarMensajes(locale))

  return (
    <main id="contenido" className="site-container seccion">
      <h1 className="heading-display">{title}</h1>
      <p className="texto-cuerpo mt-4">{description}</p>
    </main>
  )
}

const enConstruccion = (): Renderizador => EnConstruccion

export const RENDERIZADORES: Record<RouteId, Renderizador> = {
  home: enConstruccion(),
  mssp: enConstruccion(),
  msspIt: enConstruccion(),
  msspOt: enConstruccion(),
  grc: enConstruccion(),
  grcCatalog: enConstruccion(),
  software: enConstruccion(),
  sectors: enConstruccion(),
  blog: enConstruccion(),
  company: enConstruccion(),
  contact: enConstruccion(),
  calculator: enConstruccion(),
  privacy: enConstruccion(),
  legal: enConstruccion(),
  cookies: enConstruccion(),
  notFound: enConstruccion(),
}
