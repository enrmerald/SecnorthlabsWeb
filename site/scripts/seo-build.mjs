// seo:build - genera public/sitemap.xml y public/robots.txt.
//
// Por que un script y no `app/sitemap.ts`:
//
//   Next ofrece `sitemap.ts` y `robots.ts`, pero su propia documentacion los
//   describe como Route Handlers especiales, y este repositorio prohibe los
//   Route Handlers por endurecimiento -`verify:architecture` falla si aparece un
//   `route.ts`- precisamente para que nadie empiece con un GET inocente y acabe
//   leyendo la peticion. El plan ya deja escrita la salida para este caso: si
//   hace falta generar un fichero estatico, se hace con un script de build
//   (seccion 1.4.2).
//
//   A cambio se gana control sobre el XML, que la API de Next no da del todo:
//   aqui cada URL declara sus `xhtml:link` de idioma, que es lo que le dice a
//   Google que /es/blog/ y /en/blog/ son la misma pagina en dos idiomas y no dos
//   paginas compitiendo entre si.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

const { ROUTES, IDIOMAS_ACTIVOS, MULTIIDIOMA, DEFAULT_LOCALE, getRoute } = await import(
  pathToFileURL(join(root, 'src', 'config', 'routes.ts')).href
)

const blog = JSON.parse(await readFile(join(root, 'src', 'generated', 'blog.json'), 'utf8'))

const SITE_URL = (process.env.SITE_URL ?? 'https://secnorthlabs.eu').replace(/\/$/, '')

/**
 * Netlify expone el contexto del despliegue en CONTEXT. Cualquier cosa que no
 * sea produccion -deploy previews y ramas- se marca como no indexable: dos
 * copias del mismo sitio compitiendo en el buscador es el error clasico, y se
 * arregla mucho mas facil antes de que ocurra.
 */
const esProduccion = (process.env.CONTEXT ?? 'production') === 'production'

const absoluta = (path) => `${SITE_URL}${path}`
const escapar = (texto) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ── Sitemap ──────────────────────────────────────────────────────────────────
/**
 * @typedef {{ paths: Record<string, string>, lastmod?: string, prioridad: string }} Entrada
 * @type {Entrada[]}
 */
const entradas = []

for (const route of ROUTES) {
  if (!route.enabled || !route.indexable) continue
  entradas.push({
    paths: Object.fromEntries(IDIOMAS_ACTIVOS.map((locale) => [locale, route.paths[locale]])),
    // Sin `lastmod`: una fecha de build en una pagina que no ha cambiado es un
    // dato falso, y Google ha dicho que ignora los lastmod que no se sostienen.
    prioridad: route.id === 'home' ? '1.0' : '0.8',
  })
}

const rutaArticulo = (locale, slug) => `${getRoute('blog').paths[locale]}${slug}/`

for (const articulo of blog[DEFAULT_LOCALE] ?? []) {
  // Solo los idiomas activos en los que el articulo existe: anunciar una
  // traduccion que no esta escrita, o que esta pero no se publica, manda al
  // rastreador a un 404.
  const paths = Object.fromEntries(
    IDIOMAS_ACTIVOS.filter((locale) =>
      (blog[locale] ?? []).some((otro) => otro.slug === articulo.slug),
    ).map((locale) => [locale, rutaArticulo(locale, articulo.slug)]),
  )

  entradas.push({ paths, lastmod: articulo.date, prioridad: '0.6' })
}

const urls = entradas
  .flatMap(({ paths, lastmod, prioridad }) =>
    Object.entries(paths).map(([locale, path]) => {
      // Sin segundo idioma, un `xhtml:link` que solo se apunta a si mismo es
      // ruido: se omite entero en vez de emitir una alternativa vacia.
      const alternativas = MULTIIDIOMA
        ? [
            ...Object.entries(paths).map(
              ([otro, otroPath]) =>
                `    <xhtml:link rel="alternate" hreflang="${otro}" href="${escapar(absoluta(otroPath))}"/>`,
            ),
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapar(
              absoluta(paths[DEFAULT_LOCALE] ?? path),
            )}"/>`,
          ]
        : []

      return [
        '  <url>',
        `    <loc>${escapar(absoluta(path))}</loc>`,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        ...alternativas,
        `    <priority>${locale === DEFAULT_LOCALE ? prioridad : '0.5'}</priority>`,
        '  </url>',
      ].join('\n')
    }),
  )
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`

// ── sitemap-google.xml ──────────────────────────────────────────────────────
// Mismas URLs, sin `xhtml:link` ni `priority`: Google ya recibe el hreflang por
// las etiquetas `<link rel="alternate">` de cada pagina (`lib/metadatos.ts`), y
// la propia documentacion de Google dice que ignora `priority`. Este fichero es
// el que se declara en Search Console; el de arriba (`sitemap.xml`) sigue
// existiendo para quien si lea `xhtml:link` -Bing, validadores, otras
// herramientas- y para no romper lo que ya lo enlaza.
const urlsGoogle = entradas
  .flatMap(({ paths, lastmod }) =>
    Object.values(paths).map(
      (path) =>
        `  <url>\n    <loc>${escapar(absoluta(path))}</loc>${
          lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
        }\n  </url>`,
    ),
  )
  .join('\n')

const sitemapGoogle = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsGoogle}
</urlset>
`

// ── robots.txt ───────────────────────────────────────────────────────────────
const robots = esProduccion
  ? `# ISN Labs · ${SITE_URL}
User-agent: *
Allow: /

# La 404 se sirve como pagina real (netlify.toml), asi que se excluye a mano.
Disallow: /404/

Sitemap: ${SITE_URL}/sitemap-google.xml
Sitemap: ${SITE_URL}/sitemap.xml
`
  : `# Despliegue de revision (CONTEXT=${process.env.CONTEXT}). No debe indexarse:
# dos copias del mismo sitio compiten entre si en el buscador.
User-agent: *
Disallow: /
`

await mkdir(publicDir, { recursive: true })
await writeFile(join(publicDir, 'sitemap.xml'), sitemap, 'utf8')
await writeFile(join(publicDir, 'sitemap-google.xml'), sitemapGoogle, 'utf8')
await writeFile(join(publicDir, 'robots.txt'), robots, 'utf8')

console.log(
  `seo:build · OK · ${entradas.length} pagina(s) logica(s) en sitemap.xml y sitemap-google.xml` +
    `${esProduccion ? '' : ' · robots.txt en modo no indexable'}`,
)
