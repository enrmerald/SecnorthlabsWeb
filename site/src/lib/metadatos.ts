import type { Metadata } from 'next'
import { DEFAULT_LOCALE, LOCALES, type Locale, type RouteDefinition } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import { EMPRESA, urlAbsoluta } from './empresa'
import { SEO_POR_RUTA } from './seo-por-ruta'

/**
 * Fabrica el objeto `Metadata` de cada pagina a partir de su namespace SEO
 * (seccion 3.3). **Todas las paginas lo usan; nadie escribe metadatos a mano.**
 *
 * No se usa `export const metadata`: con contenido traducido hace falta la
 * version asincrona, porque hay que esperar a `params` y resolver las
 * traducciones.
 */
export function construirMetadatos(locale: Locale, route: RouteDefinition): Metadata {
  // Los mensajes se leen directamente y no con getTranslations, para no
  // depender del contexto de la peticion: cualquier lectura contextual dentro
  // de generateMetadata fuerza renderizado dinamico, y con output: 'export' eso
  // es un fallo de build.
  const { title, description } = SEO_POR_RUTA[route.id](cargarMensajes(locale))
  const canonical = urlAbsoluta(route.paths[locale])

  // Cada version lleva canonical hacia SI MISMA, en su propio idioma. Apuntar
  // las dos al espanol anularia la version inglesa (seccion 7.4).
  const languages = Object.fromEntries(
    LOCALES.map((otro) => [otro, urlAbsoluta(route.paths[otro])]),
  ) as Record<Locale, string>

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        'x-default': urlAbsoluta(route.paths[DEFAULT_LOCALE]),
      },
    },
    robots: route.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName: EMPRESA.nombre,
      title,
      description,
      url: canonical,
      locale: locale === 'es' ? 'es_ES' : 'en_GB',
      alternateLocale: LOCALES.filter((otro) => otro !== locale).map((otro) =>
        otro === 'es' ? 'es_ES' : 'en_GB',
      ),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
