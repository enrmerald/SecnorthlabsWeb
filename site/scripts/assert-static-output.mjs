// verify:export (seccion 12.3).
//
// Inspecciona el artefacto out/ despues del build y comprueba dos cosas
// distintas: que esta completo y que no se ha filtrado nada.
//
// Importa el manifiesto de rutas directamente desde src/config/routes.ts. Node
// 24 hace type stripping de forma nativa, asi que no hace falta compilarlo ni
// mantener una lista paralela, que es justo lo que el plan prohibe.
import { access, readdir, readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, relative, sep } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'out')

/** @type {string[]} */
const errors = []
const note = (message) => errors.push(message)

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  )

if (!(await exists(outDir))) {
  console.error('verify:export · FALLO · no existe out/. Ejecuta antes `pnpm build:next`.')
  process.exit(1)
}

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(absolute)
    else if (entry.isFile()) yield absolute
  }
}

/** @type {string[]} */
const files = []
for await (const absolute of walk(outDir)) {
  files.push(relative(outDir, absolute).split(sep).join('/'))
}

// ── 1 · Que no se ha desplegado nada de servidor ─────────────────────────────

for (const forbidden of ['.netlify/functions', '.netlify/edge-functions', '.next/server']) {
  if (files.some((file) => file.startsWith(forbidden))) {
    note(`out/${forbidden} existe: el artefacto contiene codigo de servidor`)
  }
}

for (const file of files) {
  const name = file.split('/').at(-1) ?? ''
  if (name === '.env' || name.startsWith('.env.')) note(`out/${file}: fichero de entorno publicado`)
  if (name.endsWith('.map')) note(`out/${file}: source map de produccion`)
}

// ── 2 · Que no se ha filtrado el modelo economico ni ningun secreto ──────────

// El motor PBCG vive en otro repositorio, asi que cualquier coincidencia aqui
// es un error grave, no un aviso.
const FORBIDDEN_TOKENS = [
  'tarifaTecnica',
  'tarifaAuditoria',
  'auditoriaEjecuciones',
  'auditoriaHoras',
  'edrUsuario',
  'mdrHuntress',
  'edrDefender',
  'cpdPropioOHibrido',
  'ESPOCRM_API_KEY',
  'ESPOCRM_URL',
  'SMTP_PASS',
  'SMTP_USER',
  'NETLIFY_GATEWAY_SIGNING_SECRET',
  'SUBMISSION_TOKEN_SECRET',
  'ALTCHA_HMAC_KEY',
]

// Nombres de cliente de la hoja VALIDACION. No pueden aparecer en ninguna parte.
//
// Con limites de palabra en los dos extremos: sin ellos, "acciona" casa dentro
// de "accionable" y "galma" dentro de cualquier palabra que la contenga, y el
// verificador se vuelve ruido que la gente aprende a ignorar.
const CLIENT_NAMES = /\b(campoastur|el musel|plabite|microviable|sierense|galma|acciona|adaro)\b/i

// 6,58 y 57 como cifras sueltas dan demasiados falsos positivos dentro de los
// hashes y los chunks minificados, asi que se busca la forma en que apareceria
// un importe real: con separador decimal y en contexto de precio.
const RATE_PATTERN = /\b6[.,]58\b/

const TEXT_EXTENSIONS = /\.(html|js|mjs|cjs|css|json|txt|xml|svg|webmanifest)$/

for (const file of files) {
  if (!TEXT_EXTENSIONS.test(file)) continue
  const content = await readFile(join(outDir, file), 'utf8')

  for (const token of FORBIDDEN_TOKENS) {
    if (content.includes(token)) note(`out/${file}: contiene "${token}"`)
  }
  if (CLIENT_NAMES.test(content)) note(`out/${file}: contiene un nombre de cliente`)
  if (RATE_PATTERN.test(content)) note(`out/${file}: contiene una tarifa del modelo economico`)
}

// ── 3 · Que el artefacto esta completo ───────────────────────────────────────

const routesModule = join(root, 'src', 'config', 'routes.ts')

if (await exists(routesModule)) {
  const { ROUTES, IDIOMAS_ACTIVOS, MULTIIDIOMA, PREFIJO_URL, LOCALES, DEFAULT_LOCALE } =
    await import(pathToFileURL(routesModule).href)

  // React serializa el titulo escapando estos cinco caracteres. Se deshace para
  // poder comparar contra el mensaje tal cual esta escrito en messages/*.json.
  const decodificar = (texto) =>
    texto
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")

  const mensajesPorIdioma = new Map()
  /** Titulo que la ruta deberia llevar, leido de los mensajes por su namespace. */
  async function tituloEsperado(locale, namespace) {
    if (!mensajesPorIdioma.has(locale)) {
      const crudo = await readFile(join(root, 'messages', `${locale}.json`), 'utf8')
      mensajesPorIdioma.set(locale, JSON.parse(crudo))
    }
    const nodo = namespace
      .split('.')
      .reduce((actual, clave) => actual?.[clave], mensajesPorIdioma.get(locale))
    return nodo?.seo?.title
  }

  /**
   * El `<title>` no lo miraba nadie, y por eso la 404 llego a publicarse sin el:
   * Next conmuta la fuente de metadatos cuando la respuesta lleva estado 404
   * (ver src/app/not-found.tsx). Se comprueba que exista y, cuando el namespace
   * resuelve a un mensaje, que sea **ese** y no el de otra pagina.
   */
  async function revisarTitulo(html, contenido, route, locale) {
    const encontrado = /<title[^>]*>([^<]*)<\/title>/.exec(contenido)?.[1]
    if (!encontrado?.trim()) {
      note(`out/${html}: sin <title> (ruta "${route.id}", idioma "${locale}")`)
      return
    }
    const esperado = await tituloEsperado(locale, route.namespace)
    if (esperado && decodificar(encontrado) !== esperado) {
      note(`out/${html}: <title> es "${decodificar(encontrado)}" y deberia ser "${esperado}"`)
    }
  }

  for (const route of ROUTES) {
    if (!route.enabled) continue
    for (const locale of IDIOMAS_ACTIVOS) {
      const path = route.paths[locale]
      // trailingSlash: true -> /contacto/ se materializa como
      // out/contacto/index.html; la raiz (`/`) es out/index.html.
      const sinBarras = path.replace(/^\/|\/$/g, '')
      const html = sinBarras ? `${sinBarras}/index.html` : 'index.html'
      if (!files.includes(html)) {
        note(`falta out/${html} (ruta "${route.id}", idioma "${locale}")`)
        continue
      }

      const content = await readFile(join(outDir, html), 'utf8')
      const headings = content.match(/<h1[\s>]/g) ?? []

      if (!/<html[^>]+lang="/.test(content)) note(`out/${html}: sin atributo lang`)
      if (headings.length !== 1) note(`out/${html}: ${headings.length} elementos h1, debe haber 1`)
      await revisarTitulo(html, content, route, locale)
      // El criterio es la indexabilidad de la ruta, no su path: una pagina
      // indexable **debe** llevar canonical, y una no indexable **no debe**
      // llevarlo -su cuerpo se sirve como respuesta de cualquier URL rota, asi
      // que apuntaria a consolidar en ella URLs que no existen- pero si debe
      // llevar noindex. Antes esto era una excepcion para `/404/`, que ademas
      // desaparecia sola al volver el ingles.
      if (route.indexable && !/rel="canonical"/.test(content)) {
        note(`out/${html}: sin canonical`)
      }
      if (!route.indexable) {
        if (/rel="canonical"/.test(content)) {
          note(`out/${html}: lleva canonical siendo una ruta no indexable`)
        }
        if (!/name="robots"[^>]*content="[^"]*noindex/.test(content)) {
          note(`out/${html}: ruta no indexable sin noindex`)
        }
      }
      // Insensible a mayusculas: React serializa el atributo como `hrefLang`.
      // HTML no distingue mayusculas en los nombres de atributo, asi que es
      // valido, pero un `test` sensible daria un falso negativo en todas las
      // paginas.
      // Sin segundo idioma no se emite hreflang (lib/metadatos.ts): un solo
      // idioma apuntandose a si mismo no es una alternativa de verdad.
      if (MULTIIDIOMA && route.indexable && !/hreflang=/i.test(content)) {
        note(`out/${html}: sin hreflang`)
      }
      if (!/<html[^>]+lang="([^"]+)"/.exec(content)?.[1]?.startsWith(locale)) {
        note(`out/${html}: el atributo lang no corresponde al idioma "${locale}"`)
      }
    }
  }

  // Garantia de que el ingles no se publica y de que no quedan URLs con
  // prefijo de idioma: con IDIOMAS_ACTIVOS = ['es'] no debe existir ni un solo
  // out/en/**/index.html ni out/es/**.
  if (!MULTIIDIOMA) {
    for (const file of files) {
      if (file.startsWith('en/') || file.startsWith('es/')) {
        note(`out/${file}: URL con prefijo de idioma en un sitio de un solo idioma`)
      }
    }
  }

  // Lo anterior son PAGINAS con prefijo; esto son ENLACES con prefijo, que es
  // otra cosa y no lo veia nadie. Un href a `/es/…` solo funciona gracias al 301
  // de legado de netlify.toml: un salto de mas en cada clic y un 404 el dia que
  // esa regla se retire. `content:build` valida los del blog contra el
  // manifiesto; aqui se cubre el artefacto entero -mensajes, componentes,
  // JSON-LD, migas de pan-.
  const prefijosValidos = new Set(
    IDIOMAS_ACTIVOS.filter((locale) => PREFIJO_URL[locale] === `/${locale}`),
  )
  for (const file of files) {
    if (!file.endsWith('.html')) continue
    const content = await readFile(join(outDir, file), 'utf8')
    for (const locale of LOCALES) {
      if (prefijosValidos.has(locale)) continue
      if (new RegExp(`href="/${locale}/`).test(content)) {
        note(`out/${file}: enlaza a /${locale}/… , que hoy solo existe como redireccion de legado`)
      }
    }
  }

  // Las tres salidas que el hosting puede servir de verdad como 404. Van aparte
  // del bucle de rutas porque dos de ellas no cuelgan de ningun path del
  // manifiesto, y son exactamente lo que ve el visitante perdido.
  const rutaNotFound = ROUTES.find((route) => route.id === 'notFound')
  if (rutaNotFound) {
    for (const html of ['404.html', '404/index.html', '_not-found/index.html']) {
      if (!files.includes(html)) continue
      const content = await readFile(join(outDir, html), 'utf8')
      await revisarTitulo(html, content, rutaNotFound, DEFAULT_LOCALE)
      if (!/name="robots"[^>]*content="[^"]*noindex/.test(content)) {
        note(`out/${html}: la 404 sin noindex`)
      }
      if ((content.match(/<h1[\s>]/g) ?? []).length !== 1) {
        note(`out/${html}: la 404 no tiene exactamente un h1`)
      }
    }
  }
} else {
  console.warn('verify:export · aviso · aun no existe src/config/routes.ts (Fase 2)')
}

// ── Resultado ────────────────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error('verify:export · FALLO\n')
  for (const error of errors) console.error(`  ${error}`)
  process.exit(1)
}

console.log(`verify:export · OK · ${files.length} ficheros en out/, sin filtraciones`)
