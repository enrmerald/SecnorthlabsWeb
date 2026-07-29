import type { Locale } from '@/config/routes'
import compilado from '../../generated/blog.json'
import type { Articulo, ArticuloIndice, BlogCompilado, Categoria } from './esquema'

/**
 * Acceso a los articulos ya compilados por `content:build`.
 *
 * Todo lo de aqui se ejecuta **en build**, dentro de componentes de servidor: el
 * JSON generado no viaja al navegador, igual que no viajan los mensajes de i18n
 * (seccion 1.4.1). Lo que llega al cliente son las props que se le pasan
 * explicitamente, y para eso existe `ArticuloIndice`.
 *
 * El fichero generado esta versionado para que el repositorio compile sin haber
 * ejecutado antes el pipeline; `content:build` lo regenera en cada build.
 */
const ARTICULOS = compilado as unknown as BlogCompilado

/**
 * Articulos publicados en un idioma, del mas reciente al mas antiguo.
 *
 * El ingles va por detras del espanol a proposito: mientras un articulo no este
 * traducido, no existe en `/en/`. Es preferible a publicar una traduccion
 * automatica o una pagina en el idioma equivocado.
 */
export function listarArticulos(locale: Locale): Articulo[] {
  return ARTICULOS[locale] ?? []
}

/** Solo los campos que puede recibir un componente de cliente. */
export function listarIndice(locale: Locale): ArticuloIndice[] {
  return listarArticulos(locale).map(
    ({ slug, title, description, date, category, tags, image, imageAlt, readingMinutes }) => ({
      slug,
      title,
      description,
      date,
      category,
      tags,
      image,
      imageAlt,
      readingMinutes,
    }),
  )
}

export function obtenerArticulo(locale: Locale, slug: string): Articulo | undefined {
  return listarArticulos(locale).find((articulo) => articulo.slug === slug)
}

/** `true` si el articulo existe en ese idioma. Lo usa el selector de idioma. */
export function existeArticulo(locale: Locale, slug: string): boolean {
  return obtenerArticulo(locale, slug) !== undefined
}

/**
 * Categorias con contenido, en el orden en que aparecen los articulos mas
 * recientes. Una categoria vacia no se muestra: un filtro que no filtra nada es
 * una promesa incumplida.
 */
export function categoriasConArticulos(locale: Locale): Categoria[] {
  const vistas: Categoria[] = []
  for (const articulo of listarArticulos(locale)) {
    if (!vistas.includes(articulo.category)) vistas.push(articulo.category)
  }
  return vistas
}

/** El mas reciente, que el listado destaca en grande. */
export function articuloDestacado(locale: Locale): Articulo | undefined {
  return listarArticulos(locale)[0]
}

/**
 * Fecha legible en el idioma de la pagina. Se formatea aqui, en build, y no en
 * el navegador: `toLocaleDateString` en cliente daria un resultado distinto
 * segun la configuracion del visitante y rompería la hidratacion.
 */
export function formatearFecha(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
}
