import type { ReactNode } from 'react'
import type { Locale, RouteDefinition, RouteId } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import { SEO_POR_RUTA } from '@/lib/seo-por-ruta'
import { Blog } from './Blog'
import { CatalogoGrc, CatalogoIt, CatalogoOt } from './Catalogos'
import { Compania } from './Compania'
import { Contacto } from './Contacto'
import { Grc } from './Grc'
import { Home } from './Home'
import { AvisoLegal, Cookies, Privacidad } from './Legales'
import { Mssp } from './Mssp'
import { NoEncontrada as PaginaNoEncontrada } from './NoEncontrada'
import { Sectores } from './Sectores'
import { Software } from './Software'

/**
 * Registro de renderizadores: un componente por pagina, que recibe el idioma
 * (seccion 2.1.2). La ruta atrapatodo resuelve `locale + slug` a un `RouteId` y
 * delega aqui.
 *
 * **No se duplican componentes de pagina para ES y EN.** Un renderizador por
 * pagina, y recibe el locale.
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
 * Esqueleto de las paginas que aun no tienen contenido. Solo queda la
 * calculadora, que llega en la Fase 5 con su motor en el gateway.
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

export const RENDERIZADORES: Record<RouteId, Renderizador> = {
  home: ({ locale }) => <Home locale={locale} />,
  mssp: ({ locale }) => <Mssp locale={locale} />,
  msspIt: ({ locale }) => <CatalogoIt locale={locale} />,
  msspOt: ({ locale }) => <CatalogoOt locale={locale} />,
  grc: ({ locale }) => <Grc locale={locale} />,
  grcCatalog: ({ locale }) => <CatalogoGrc locale={locale} />,
  software: ({ locale }) => <Software locale={locale} />,
  sectors: ({ locale }) => <Sectores locale={locale} />,
  blog: ({ locale }) => <Blog locale={locale} />,
  company: ({ locale }) => <Compania locale={locale} />,
  contact: ({ locale }) => <Contacto locale={locale} />,
  calculator: EnConstruccion,
  privacy: ({ locale }) => <Privacidad locale={locale} />,
  legal: ({ locale }) => <AvisoLegal locale={locale} />,
  cookies: ({ locale }) => <Cookies locale={locale} />,
  notFound: ({ locale }) => <PaginaNoEncontrada locale={locale} />,
}
