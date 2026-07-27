import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { LOCALES, ROUTES, isLocale, pathToSegments, resolveRoute } from '@/config/routes'
import { construirMetadatos } from '@/lib/metadatos'
import { RENDERIZADORES } from '@/paginas/registro'

/**
 * Una sola ruta atrapa todas las paginas y se resuelve por manifiesto
 * (seccion 2.1.2). **No se duplican componentes de pagina para ES y EN**: hay
 * un renderizador por pagina, y recibe el idioma.
 */

/**
 * No es opcional con `output: 'export'`: las rutas dinamicas con
 * `dynamicParams: true` estan en la lista oficial de funciones no soportadas.
 * Cualquier URL que no salga de `generateStaticParams` es un 404 estatico.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return ROUTES.filter((route) => route.enabled).flatMap((route) =>
    LOCALES.map((locale) => ({
      locale,
      // `/es/` produce [] y Next lo trata como la raiz del segmento opcional.
      slug: pathToSegments(route.paths[locale], locale),
    })),
  )
}

interface PropsPagina {
  params: Promise<{ locale: string; slug?: string[] }>
}

export async function generateMetadata({ params }: PropsPagina): Promise<Metadata> {
  const { locale, slug = [] } = await params
  if (!isLocale(locale)) return {}

  const route = resolveRoute(locale, slug)
  if (!route) return { robots: { index: false, follow: false } }

  return construirMetadatos(locale, route)
}

export default async function Pagina({ params }: PropsPagina) {
  const { locale, slug = [] } = await params
  if (!isLocale(locale)) notFound()

  const route = resolveRoute(locale, slug)
  if (!route) notFound()

  setRequestLocale(locale)

  const renderizar = RENDERIZADORES[route.id]
  return renderizar({ locale, route })
}
