import type { Metadata } from 'next'
import {
  DEFAULT_LOCALE,
  LOCALES,
  getBlogPostPath,
  type Locale,
  type RouteDefinition,
} from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import { existeArticulo } from './blog/datos'
import type { Articulo } from './blog/esquema'
import { dimensionesImagen, rutaImagenSocial } from './blog/imagenes'
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

/**
 * Metadatos de un articulo del blog.
 *
 * Va aparte de `construirMetadatos` porque un articulo no es una ruta del
 * manifiesto: su titulo, su descripcion y su fecha salen del front matter, no de
 * los ficheros de mensajes.
 *
 * La diferencia que mas importa esta en `alternates.languages`: **solo se declara
 * el idioma en el que el articulo existe de verdad**. Anunciar en `hreflang` una
 * version inglesa que no esta traducida manda al rastreador a un 404 y, con el
 * tiempo, a desconfiar del resto de las alternativas del sitio.
 */
export function construirMetadatosArticulo(locale: Locale, articulo: Articulo): Metadata {
  const canonical = urlAbsoluta(getBlogPostPath(locale, articulo.slug))

  const languages = Object.fromEntries(
    LOCALES.filter((otro) => existeArticulo(otro, articulo.slug)).map((otro) => [
      otro,
      urlAbsoluta(getBlogPostPath(otro, articulo.slug)),
    ]),
  )

  // La imagen social tiene que ser absoluta y de una sola variante: los clientes
  // que la consumen no interpretan `srcset`. La ruta se resuelve contra el
  // manifiesto porque el pipeline no amplia, y una anchura fija seria un 404 en
  // los originales pequenos.
  const rutaImagen = rutaImagenSocial(articulo.image)
  const imagen = rutaImagen ? urlAbsoluta(rutaImagen) : undefined
  const medidas = articulo.image ? dimensionesImagen(articulo.image) : undefined

  return {
    title: articulo.titleSeo,
    description: articulo.descriptionSeo,
    alternates: {
      canonical,
      languages: {
        ...languages,
        // Si el articulo existe en espanol -y `content:build` obliga a que sea
        // asi-, esa es la version por defecto para quien no encaje con ningun
        // hreflang.
        'x-default': urlAbsoluta(getBlogPostPath(DEFAULT_LOCALE, articulo.slug)),
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      siteName: EMPRESA.nombre,
      title: articulo.title,
      description: articulo.description,
      url: canonical,
      locale: locale === 'es' ? 'es_ES' : 'en_GB',
      publishedTime: articulo.date,
      authors: [articulo.author],
      ...(imagen ? { images: [{ url: imagen, ...medidas }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: articulo.title,
      description: articulo.description,
      ...(imagen ? { images: [imagen] } : {}),
    },
  }
}
