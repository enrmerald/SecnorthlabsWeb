// verify:architecture (seccion 12.2).
//
// Falla el build si alguien reintroduce codigo de servidor en el repositorio
// del sitio. Sin esta red, dentro de seis meses alguien anade un Route Handler
// "solo para una cosita" y la web deja de ser estatica sin que nadie lo note.
//
// Se ejecuta en CI ANTES del build, para que el fallo sea barato.
import { readdir, readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, sep } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  'out',
  '.git',
  'coverage',
  'test-results',
  'playwright-report',
  'scripts', // este fichero cita literalmente los patrones que persigue
])

const SCANNED_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs)$/

/**
 * Construcciones que no funcionan con output: 'export', mas las que si
 * funcionan pero senalan que ha vuelto a entrar logica de servidor.
 * @type {Array<{ id: string, test: RegExp, reason: string }>}
 */
const FORBIDDEN_CONTENT = [
  { id: "'use server'", test: /['"]use server['"]/, reason: 'Server Actions' },
  { id: 'cookies()', test: /\bcookies\s*\(\s*\)/, reason: 'API de peticion' },
  { id: 'draftMode()', test: /\bdraftMode\s*\(\s*\)/, reason: 'API de peticion' },
  { id: 'revalidatePath()', test: /\brevalidatePath\s*\(/, reason: 'revalidacion' },
  { id: 'revalidateTag()', test: /\brevalidateTag\s*\(/, reason: 'revalidacion' },
  { id: "runtime = 'nodejs'", test: /runtime\s*=\s*['"]nodejs['"]/, reason: 'runtime' },
  { id: "runtime = 'edge'", test: /runtime\s*=\s*['"]edge['"]/, reason: 'runtime' },
  {
    id: "output: 'standalone'",
    test: /output\s*:\s*['"]standalone['"]/,
    reason: 'despliegue con servidor',
  },
  {
    id: "import 'server-only'",
    test: /from\s+['"]server-only['"]|require\(\s*['"]server-only['"]\s*\)|import\s+['"]server-only['"]/,
    reason: 'ya no hay codigo de servidor en el sitio',
  },
  // headers() de next/headers hay que distinguirlo del headers() de fetch, asi
  // que se persigue el import y no la llamada.
  {
    id: 'import de next/headers',
    test: /from\s+['"]next\/headers['"]/,
    reason: 'API de peticion',
  },
]

/**
 * Rutas que no pueden existir. Se comparan con separadores normalizados a "/".
 * @type {Array<{ id: string, test: (path: string) => boolean, reason: string }>}
 */
const FORBIDDEN_PATHS = [
  {
    id: 'src/app/api/',
    test: (p) => p.startsWith('src/app/api/'),
    reason: 'Route Handlers',
  },
  {
    id: 'route.ts',
    test: (p) => /(^|\/)route\.(ts|tsx|js|jsx)$/.test(p),
    reason: 'Route Handlers (prohibidos por endurecimiento, ver 1.4.2)',
  },
  {
    id: 'proxy.ts',
    test: (p) => /(^|\/)(src\/)?proxy\.(ts|js)$/.test(p),
    reason: 'no soportado por output: export',
  },
  {
    id: 'middleware.ts',
    test: (p) => /(^|\/)(src\/)?middleware\.(ts|js)$/.test(p),
    reason: 'no soportado por output: export',
  },
  {
    id: '.netlify/functions',
    test: (p) => p.includes('.netlify/functions'),
    reason: 'Netlify Functions',
  },
  {
    id: '.netlify/edge-functions',
    test: (p) => p.includes('.netlify/edge-functions'),
    reason: 'Netlify Edge Functions',
  },
]

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      yield* walk(join(dir, entry.name))
    } else if (entry.isFile()) {
      yield join(dir, entry.name)
    }
  }
}

/** @type {string[]} */
const violations = []

for await (const absolute of walk(root)) {
  const path = relative(root, absolute).split(sep).join('/')

  for (const rule of FORBIDDEN_PATHS) {
    if (rule.test(path)) violations.push(`${path} · ${rule.id} (${rule.reason})`)
  }

  if (!SCANNED_EXTENSIONS.test(path)) continue

  const source = await readFile(absolute, 'utf8')
  for (const rule of FORBIDDEN_CONTENT) {
    if (!rule.test.test(source)) continue
    const line = source.split('\n').findIndex((text) => rule.test.test(text)) + 1
    violations.push(`${path}:${line} · ${rule.id} (${rule.reason})`)
  }
}

// Un stat, no un walk: si existe el directorio, ya es una violacion.
for (const dir of ['.netlify/functions', '.netlify/edge-functions']) {
  const found = await stat(join(root, dir)).then(
    () => true,
    () => false,
  )
  if (found) violations.push(`${dir}/ · el sitio no despliega funciones`)
}

if (violations.length > 0) {
  console.error('verify:architecture · FALLO\n')
  console.error('Ha vuelto a entrar codigo de servidor en el repositorio del sitio:\n')
  for (const violation of violations) console.error(`  ${violation}`)
  console.error(
    '\nEste sitio se exporta por completo y lo publica un CDN. Todo el computo' +
      '\nvive en el Web Gateway, en su propio repositorio (ISNLA-DOC-0008-01, 2.1).',
  )
  process.exit(1)
}

console.log('verify:architecture · OK · sin codigo de servidor en el sitio')
