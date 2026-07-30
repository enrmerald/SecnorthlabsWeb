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
  const { ROUTES, LOCALES } = await import(pathToFileURL(routesModule).href)

  for (const route of ROUTES) {
    if (!route.enabled) continue
    for (const locale of LOCALES) {
      const path = route.paths[locale]
      // trailingSlash: true -> /es/contacto/ se materializa como
      // out/es/contacto/index.html
      const html = `${path.replace(/^\/|\/$/g, '')}/index.html`
      if (!files.includes(html)) {
        note(`falta out/${html} (ruta "${route.id}", idioma "${locale}")`)
        continue
      }

      const content = await readFile(join(outDir, html), 'utf8')
      const headings = content.match(/<h1[\s>]/g) ?? []

      if (!/<html[^>]+lang="/.test(content)) note(`out/${html}: sin atributo lang`)
      if (headings.length !== 1) note(`out/${html}: ${headings.length} elementos h1, debe haber 1`)
      if (!/rel="canonical"/.test(content)) note(`out/${html}: sin canonical`)
      // Insensible a mayusculas: React serializa el atributo como `hrefLang`.
      // HTML no distingue mayusculas en los nombres de atributo, asi que es
      // valido, pero un `test` sensible daria un falso negativo en todas las
      // paginas.
      if (route.indexable && !/hreflang=/i.test(content)) note(`out/${html}: sin hreflang`)
      if (!/<html[^>]+lang="([^"]+)"/.exec(content)?.[1]?.startsWith(locale)) {
        note(`out/${html}: el atributo lang no corresponde al idioma "${locale}"`)
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
