/**
 * Manifiesto central de rutas (ISNLA-DOC-0008-01, seccion 2.1.1).
 *
 * **Unica fuente de verdad de las rutas del sitio.** Lo consumen la navegacion,
 * el pie, el selector de idioma, `generateStaticParams`, los metadatos, el
 * sitemap, las migas de pan, el JSON-LD y las pruebas E2E. Sin listas paralelas.
 *
 * Con slugs distintos por idioma, una lista escrita a mano en cada sitio es una
 * garantia de incoherencia. Cambiar `enabled` a `false` en una ruta la retira de
 * la navegacion, del sitemap, del build y de las pruebas de una sola vez.
 *
 * Este fichero lo importa tambien `scripts/assert-static-output.mjs` con el type
 * stripping nativo de Node 24, asi que **solo puede usar sintaxis borrable**:
 * nada de `enum`, `namespace` ni propiedades de parametro en constructores.
 */

export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** El espanol es el idioma por defecto: `/` redirige 301 fijo a `/es/`. */
export const DEFAULT_LOCALE: Locale = 'es'

export type RouteId =
  | 'home'
  | 'mssp'
  | 'msspIt'
  | 'msspOt'
  | 'grc'
  | 'grcCatalog'
  | 'software'
  | 'sectors'
  | 'company'
  | 'contact'
  | 'calculator'
  | 'blog'
  | 'privacy'
  | 'legal'
  | 'cookies'
  | 'notFound'

/**
 * El blog existe y se indexa, con la **opcion A** de la seccion 4.9: pagina
 * "proximamente" con la linea editorial y el bloque de newsletter funcional.
 * No se publican seis titulares inventados con tiempos de lectura inventados.
 *
 * Si Marketing decide otra cosa (pendiente P8), se cambia aqui y desaparece de
 * la navegacion, del pie, del sitemap y de las pruebas sin tocar nada mas.
 */
const BLOG_ENABLED = true
const BLOG_INDEXABLE = true

/**
 * La calculadora del PBCG queda **retirada** hasta que se cierre como se calcula
 * el presupuesto (decision de Direccion del 29/07/2026). Mientras tanto la unica
 * puerta de entrada es el formulario de contacto.
 *
 * Se apaga aqui y no borrando nada: la pagina, el componente de cliente, el motor
 * de `pbcg/` y la funcion `quote` siguen en su sitio y pasando sus pruebas. Con
 * esto la ruta desaparece de la navegacion, del pie, del sitemap, del build y de
 * las pruebas de una sola vez, y `/es/calculadora/` responde 404. Volver a
 * publicarla es poner `true` y devolver los CTA que apuntaban a ella (Home,
 * MSSP IT, catalogo IT, articulos del blog y el boton de la barra).
 */
const CALCULADORA_ACTIVA = false

/**
 * Namespace de mensajes de cada pagina.
 *
 * Es una union de literales y no `string` a proposito: el aumento de tipos de
 * next-intl (`global.d.ts`) deriva las claves validas del propio `es.json`, de
 * modo que un namespace inventado aqui es un error de compilacion en
 * `construirMetadatos` y no una pagina en blanco en produccion.
 */
export type MessageNamespace =
  | 'home'
  | 'mssp'
  | 'msspItCatalog'
  | 'msspOtCatalog'
  | 'grc'
  | 'grcCatalog'
  | 'software'
  | 'sectors'
  | 'blog'
  | 'company'
  | 'contact'
  | 'calculator'
  | 'privacy'
  | 'legal'
  | 'cookies'
  | 'common.notFound'

export interface RouteDefinition {
  id: RouteId
  /** `false` -> la ruta no existe en ninguna parte: ni build, ni nav, ni sitemap. */
  enabled: boolean
  /** `false` -> `robots: { index: false }` y fuera del sitemap. */
  indexable: boolean
  /** Namespace de mensajes del que sale todo el contenido de la pagina. */
  namespace: MessageNamespace
  /** Ruta completa, con prefijo de idioma y barra final. */
  paths: Record<Locale, string>
  /**
   * Anclas conocidas de la pagina, para que el selector de idioma conserve el
   * fragmento y no solo la pagina. `#idi` en espanol es `#rdi` en ingles.
   */
  anchors?: Record<string, Record<Locale, string>>
}

export const ROUTES: readonly RouteDefinition[] = [
  {
    id: 'home',
    enabled: true,
    indexable: true,
    namespace: 'home',
    paths: { es: '/es/', en: '/en/' },
  },
  {
    id: 'mssp',
    enabled: true,
    indexable: true,
    namespace: 'mssp',
    paths: { es: '/es/soluciones/mssp/', en: '/en/solutions/mssp/' },
    // Las siglas tecnicas no se traducen.
    anchors: { it: { es: 'it', en: 'it' }, ot: { es: 'ot', en: 'ot' } },
  },
  {
    id: 'msspIt',
    enabled: true,
    indexable: true,
    namespace: 'msspItCatalog',
    paths: { es: '/es/soluciones/mssp/it/', en: '/en/solutions/mssp/it/' },
  },
  {
    id: 'msspOt',
    enabled: true,
    indexable: true,
    namespace: 'msspOtCatalog',
    paths: { es: '/es/soluciones/mssp/ot/', en: '/en/solutions/mssp/ot/' },
  },
  {
    id: 'grc',
    enabled: true,
    indexable: true,
    namespace: 'grc',
    paths: { es: '/es/soluciones/grc/', en: '/en/solutions/grc/' },
    anchors: { idi: { es: 'idi', en: 'rdi' } },
  },
  {
    id: 'grcCatalog',
    enabled: true,
    indexable: true,
    namespace: 'grcCatalog',
    paths: { es: '/es/soluciones/grc/catalogo/', en: '/en/solutions/grc/catalogue/' },
  },
  {
    id: 'software',
    enabled: true,
    indexable: true,
    namespace: 'software',
    paths: { es: '/es/software/', en: '/en/software/' },
  },
  {
    id: 'sectors',
    enabled: true,
    indexable: true,
    namespace: 'sectors',
    paths: { es: '/es/sectores/', en: '/en/sectors/' },
  },
  {
    id: 'blog',
    enabled: BLOG_ENABLED,
    indexable: BLOG_INDEXABLE,
    namespace: 'blog',
    paths: { es: '/es/blog/', en: '/en/blog/' },
  },
  {
    id: 'company',
    enabled: true,
    indexable: true,
    namespace: 'company',
    paths: { es: '/es/compania/', en: '/en/company/' },
  },
  {
    id: 'contact',
    enabled: true,
    indexable: true,
    namespace: 'contact',
    paths: { es: '/es/contacto/', en: '/en/contact/' },
  },
  {
    id: 'calculator',
    enabled: CALCULADORA_ACTIVA,
    indexable: CALCULADORA_ACTIVA,
    namespace: 'calculator',
    paths: { es: '/es/calculadora/', en: '/en/calculator/' },
  },
  {
    id: 'privacy',
    enabled: true,
    indexable: true,
    namespace: 'privacy',
    paths: { es: '/es/politica-privacidad/', en: '/en/privacy-policy/' },
  },
  {
    id: 'legal',
    enabled: true,
    indexable: true,
    namespace: 'legal',
    paths: { es: '/es/aviso-legal/', en: '/en/legal-notice/' },
  },
  {
    id: 'cookies',
    enabled: true,
    indexable: true,
    namespace: 'cookies',
    paths: { es: '/es/cookies/', en: '/en/cookies/' },
  },
  {
    // Se genera como pagina real porque las reglas del final de netlify.toml
    // sirven /es/404/ y /en/404/ con estado 404 (seccion 10.4). Nunca se enlaza
    // ni se indexa.
    id: 'notFound',
    enabled: true,
    indexable: false,
    namespace: 'common.notFound',
    paths: { es: '/es/404/', en: '/en/404/' },
  },
]

/** Rutas que aparecen en la navegacion principal, en este orden. */
export const NAV_ROUTES: readonly RouteId[] = [
  'sectors',
  'software',
  'company',
  'blog',
  'contact',
]

const POR_ID = new Map(ROUTES.map((route) => [route.id, route]))

export function getRoute(id: RouteId): RouteDefinition {
  const route = POR_ID.get(id)
  if (!route) throw new Error(`routes: no existe la ruta "${id}"`)
  return route
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/** `true` si la ruta esta activa. Las desactivadas no se enlazan nunca. */
export function isEnabled(id: RouteId): boolean {
  return POR_ID.get(id)?.enabled ?? false
}

/**
 * Resuelve `RouteId` + idioma a una URL, opcionalmente con ancla.
 *
 * El selector de idioma y la navegacion llaman **siempre** a esta funcion y
 * nunca manipulan cadenas de URL a mano: es lo unico que garantiza que
 * `/es/soluciones/grc/#idi` acabe en `/en/solutions/grc/#rdi`.
 */
export function getLocalizedPath(id: RouteId, locale: Locale, anchorKey?: string): string {
  const route = getRoute(id)
  const base = route.paths[locale]
  if (!anchorKey) return base

  const clave = anchorKey.replace(/^#/, '')
  const anchor = route.anchors?.[clave]?.[locale]
  if (!anchor) {
    throw new Error(`routes: la ruta "${id}" no declara el ancla "${clave}"`)
  }
  return `${base}#${anchor}`
}

/** Segmentos de la ruta despues del prefijo de idioma. `/es/` -> `[]`. */
export function pathToSegments(path: string, locale: Locale): string[] {
  const prefijo = `/${locale}/`
  const resto = path.startsWith(prefijo) ? path.slice(prefijo.length) : path.replace(/^\//, '')
  return resto.split('/').filter(Boolean)
}

/**
 * Ruta de un articulo del blog, derivada de la del listado.
 *
 * Los articulos **no estan en `ROUTES`**, y es deliberado: el manifiesto declara
 * las paginas fijas del sitio, que son las que hay que poder auditar de un
 * vistazo, mientras que los articulos los determina el contenido de
 * `content/blog/`. Meterlos ahi obligaria a que este fichero -que cargan
 * `check:routes` y `assert-static-output` con type stripping- dependiera del
 * pipeline de contenido.
 *
 * Lo que si vive aqui es **la forma de la URL**, para que nadie la construya
 * pegando cadenas: si manana el blog pasa a `/es/articulos/`, cambia el
 * manifiesto y los 26 articulos se mueven con el.
 */
export function getBlogPostPath(locale: Locale, slug: string): string {
  return `${getRoute('blog').paths[locale]}${slug}/`
}

/**
 * Inversa de la anterior: reconoce `/es/blog/<slug>/` y devuelve el slug.
 *
 * Solo comprueba **la forma**; que ese articulo exista lo decide el contenido
 * (`existeArticulo`). Separar las dos cosas es lo que permite que una URL con
 * forma de articulo pero sin fichero acabe en la 404 y no en una pagina vacia.
 */
export function resolveBlogPostSlug(
  locale: Locale,
  segments: readonly string[],
): string | undefined {
  const blog = getRoute('blog')
  if (!blog.enabled) return undefined

  const base = pathToSegments(blog.paths[locale], locale)
  if (segments.length !== base.length + 1) return undefined
  if (!base.every((segmento, indice) => segmento === segments[indice])) return undefined

  return segments[base.length]
}

/** Inversa de la anterior: idioma + segmentos -> ruta, o `undefined`. */
export function resolveRoute(locale: Locale, segments: readonly string[]): RouteDefinition | undefined {
  const objetivo = segments.join('/')
  return ROUTES.find(
    (route) => route.enabled && pathToSegments(route.paths[locale], locale).join('/') === objetivo,
  )
}
