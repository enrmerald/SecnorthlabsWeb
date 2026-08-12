import type { Locale, RouteDefinition } from '../../config/routes'

/**
 * Validacion de los enlaces internos de un articulo contra el manifiesto de
 * rutas.
 *
 * Existe por un fallo concreto: la comprobacion anterior era una regex montada
 * sobre una constante `PREFIJO_BLOG` copiada a mano del manifiesto. El dia que
 * el espanol paso a servirse en la raiz se actualizo la copia, los 22 articulos
 * se quedaron con sus `/es/…` escritos, y la regex dejo de casar con un solo
 * enlace: la guardia siguio en verde sin validar nada. Por eso aqui no hay
 * ningun prefijo escrito a mano -todo sale de `ROUTES`- y por eso cada error
 * tiene su propio mensaje, porque cada uno se arregla de otra forma.
 *
 * Va en `src/lib/blog/` y no dentro del script porque es el patron que ya siguen
 * `frontmatter.ts` y `esquema.ts`, que `content-build.mjs` carga con el type
 * stripping de Node 24, y porque asi los casos negativos se pueden probar sin
 * fabricar `.md` rotos en `content/`.
 *
 * El manifiesto llega **por parametro** en vez de importarse: el type stripping
 * de Node no resuelve un import relativo sin extension, y un `import type` como
 * el de arriba se borra antes de ejecutar. De paso, las pruebas pueden pasar un
 * manifiesto de mentira sin tocar el real.
 */

export interface Manifiesto {
  rutas: readonly RouteDefinition[]
  /** Catalogo completo de idiomas, no solo los activos. */
  locales: readonly Locale[]
}

export interface RevisionEnlaces {
  /** El HTML, con los enlaces al otro idioma ya reescritos. */
  html: string
  errores: string[]
  reescrituras: number
}

export interface ParametrosRevision {
  html: string
  locale: Locale
  /** Ruta del `.md` de origen, para que el error diga que fichero abrir. */
  origen: string
  /** Slugs publicados por idioma; los de un idioma inactivo llegan vacios. */
  slugsPorIdioma: Record<Locale, ReadonlySet<string>>
  manifiesto: Manifiesto
}

/** Enlaces que no apuntan a una pagina del sitio: no hay nada que validar. */
const EXTERNO = /^(?:[a-z]+:|\/\/|#)/i

/** Las imagenes las valida el bloque de `images:build`, no esta funcion. */
const IMAGEN = '/img/'

export function revisarEnlacesInternos({
  html,
  locale,
  origen,
  slugsPorIdioma,
  manifiesto,
}: ParametrosRevision): RevisionEnlaces {
  const errores: string[] = []
  let reescrituras = 0

  const { rutas, locales } = manifiesto
  const otros = locales.filter((otro) => otro !== locale)
  const blog = rutas.find((route) => route.id === 'blog')
  if (!blog) throw new Error('enlaces: el manifiesto no declara la ruta "blog"')
  const rutaArticulo = (idioma: Locale, slug: string) => `${blog.paths[idioma]}${slug}/`

  const htmlRevisado = html.replace(/href="([^"]+)"/g, (completo, destino: string) => {
    if (EXTERNO.test(destino) || destino.startsWith(IMAGEN)) return completo

    const [ruta, ancla] = separar(destino)
    const prefijoBlog = blog.paths[locale]

    // 1 · Articulo del blog en este idioma.
    if (ruta.startsWith(prefijoBlog) && ruta !== prefijoBlog) {
      const slug = ruta.slice(prefijoBlog.length).replace(/\/$/, '')
      if (slugsPorIdioma[locale]?.has(slug)) return completo

      // Existe traducido pero no en este idioma: se reescribe al idioma en el
      // que si existe, por el motivo largo que explica `content-build.mjs`.
      const conTraduccion = otros.find((otro) => slugsPorIdioma[otro]?.has(slug))
      if (conTraduccion) {
        reescrituras += 1
        return `href="${rutaArticulo(conTraduccion, slug)}${ancla}"`
      }

      errores.push(`${origen} · enlaza a ${ruta}, que no existe en ningun idioma`)
      return completo
    }

    // 2 · Pagina fija del manifiesto, en este idioma.
    const propia = rutas.find((route) => route.paths[locale] === ruta)
    if (propia) {
      if (!propia.enabled) {
        errores.push(
          `${origen} · enlaza a ${ruta}, que es la ruta "${propia.id}" y esta `
            + 'desactivada (enabled: false en src/config/routes.ts)',
        )
      } else if (ancla && !propia.anchors?.[ancla.slice(1)]?.[locale]) {
        errores.push(
          `${origen} · enlaza a ${ruta}${ancla}, y "${propia.id}" no declara esa `
            + 'ancla en `anchors` (src/config/routes.ts)',
        )
      }
      return completo
    }

    // 3 · Es una ruta del manifiesto, pero la URL de otro idioma. Este es el
    // caso que se colo entero: `/es/compania/` solo funciona por el 301 de
    // legado de netlify.toml, y seria un 404 el dia que esa regla se retire.
    const ajena = rutas.find((route) => otros.some((otro) => route.paths[otro] === ruta))
    if (ajena) {
      errores.push(
        `${origen} · enlaza a ${ruta}, que es la URL de "${ajena.id}" en otro `
          + `idioma; en "${locale}" es ${ajena.paths[locale]}`,
      )
      return completo
    }

    // 4 · Empieza por un codigo de idioma y no ha casado con nada: es un prefijo
    // retirado. Hace falta como caso propio porque el espanol se sirve en la
    // raiz, asi que `/es/compania/` y `/es/blog/x/` no son el path de ninguna
    // ruta ni de ningun articulo -son exactamente los 108 enlaces del
    // incidente- y sin esto caerian en el mensaje generico de abajo, que no dice
    // como arreglarlos.
    const primero = ruta.split('/')[1] ?? ''
    if ((locales as readonly string[]).includes(primero)) {
      errores.push(
        `${origen} · enlaza a ${ruta}, con el prefijo de idioma "/${primero}/" `
          + `retirado; la URL buena es ${ruta.slice(primero.length + 1)}`,
      )
      return completo
    }

    errores.push(`${origen} · enlaza a ${ruta}, que no es ninguna ruta del manifiesto`)
    return completo
  })

  return { html: htmlRevisado, errores, reescrituras }
}

/** Separa `/soluciones/mssp/#ot` en `['/soluciones/mssp/', '#ot']`. */
function separar(destino: string): [string, string] {
  const corte = destino.indexOf('#')
  return corte === -1 ? [destino, ''] : [destino.slice(0, corte), destino.slice(corte)]
}
