import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import {
  DEFAULT_LOCALE,
  IDIOMAS_ACTIVOS,
  ROUTES,
  getBlogPostPath,
  pathToSegments,
  resolveBlogPostSlug,
  resolveRoute,
  type Locale,
} from '@/config/routes'
import { listarArticulos, obtenerArticulo } from '@/lib/blog/datos'
import { construirMetadatos, construirMetadatosArticulo } from '@/lib/metadatos'
import { Articulo } from '@/paginas/Articulo'
import { RENDERIZADORES } from '@/paginas/registro'

/**
 * Una sola ruta atrapa todas las paginas y se resuelve por manifiesto
 * (seccion 2.1.2). **No se duplican componentes de pagina por idioma**: hay un
 * renderizador por pagina.
 *
 * Sin segmento `[locale]`: con `IDIOMAS_ACTIVOS = ['es']` la URL no lleva
 * prefijo, y el idioma que se renderiza es siempre `DEFAULT_LOCALE`. Devolver
 * el ingles exige recuperar el segmento (`PLAN-solo-espanol.md`).
 */

/**
 * No es opcional con `output: 'export'`: las rutas dinamicas con
 * `dynamicParams: true` estan en la lista oficial de funciones no soportadas.
 * Cualquier URL que no salga de `generateStaticParams` es un 404 estatico.
 */
export const dynamicParams = false

export function generateStaticParams() {
  const paginas = ROUTES.filter((route) => route.enabled).flatMap((route) =>
    IDIOMAS_ACTIVOS.map((locale) => ({
      // `/` produce [] y Next lo trata como la raiz del segmento opcional.
      slug: pathToSegments(route.paths[locale], locale),
    })),
  )

  // Los articulos del blog salen del contenido, no del manifiesto: cada `.md` de
  // `content/blog/<idioma>/` es una pagina. Con `dynamicParams = false`, lo que no
  // este en esta lista es un 404 estatico, asi que anadir un articulo es anadir un
  // fichero y volver a construir.
  const articulos = IDIOMAS_ACTIVOS.flatMap((locale) =>
    listarArticulos(locale).map((articulo) => ({
      slug: pathToSegments(getBlogPostPath(locale, articulo.slug), locale),
    })),
  )

  return [...paginas, ...articulos]
}

interface PropsPagina {
  params: Promise<{ slug?: string[] }>
}

export async function generateMetadata({ params }: PropsPagina): Promise<Metadata> {
  const { slug = [] } = await params
  const locale = DEFAULT_LOCALE

  const route = resolveRoute(locale, slug)
  if (route) return construirMetadatos(locale, route)

  const articulo = resolverArticulo(locale, slug)
  if (articulo) return construirMetadatosArticulo(locale, articulo)

  return { robots: { index: false, follow: false } }
}

/**
 * Resuelve una URL con forma de articulo a su contenido.
 *
 * La forma la reconoce el manifiesto y la existencia la decide el contenido: una
 * URL como `/blog/inventado/` tiene forma valida pero no tiene fichero, y debe
 * acabar en la 404 y no en una pagina con el cuerpo vacio.
 */
function resolverArticulo(locale: Locale, slug: string[]) {
  const slugArticulo = resolveBlogPostSlug(locale, slug)
  return slugArticulo ? obtenerArticulo(locale, slugArticulo) : undefined
}

export default async function Pagina({ params }: PropsPagina) {
  const { slug = [] } = await params
  const locale = DEFAULT_LOCALE

  setRequestLocale(locale)

  const route = resolveRoute(locale, slug)
  if (route) {
    const renderizar = RENDERIZADORES[route.id]
    return renderizar({ locale, route })
  }

  const articulo = resolverArticulo(locale, slug)
  if (articulo) return <Articulo locale={locale} articulo={articulo} />

  notFound()
}
