// verify:architecture (seccion 12.2).
//
// Falla el build por dos motivos distintos:
//
//   1. Alguien reintroduce codigo de servidor en las paginas: un Route Handler
//      "solo para una cosita", un 'use server', una API de peticion.
//   2. Algo de src/ importa el motor economico de pbcg/ o el codigo de la
//      funcion. Eso publicaria las tarifas en el navegador.
//
// Sin esta red, cualquiera de las dos cosas pasa y nadie se entera hasta que
// esta en produccion. Se ejecuta en CI ANTES del build, para que el fallo sea
// barato.
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
    // Se prohibe el directorio GENERADO por el CLI de Netlify, no el fuente
    // `netlify/functions/`, que la variante hibrida si necesita.
    id: '.netlify/edge-functions',
    test: (p) => p.includes('.netlify/edge-functions'),
    reason: 'Edge Functions: no se usan, y corren en cada peticion',
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

/**
 * El modelo economico ya no vive en otro repositorio.
 *
 * Al adoptar la variante hibrida -precio instantaneo, con el motor PBCG
 * ejecutandose en una Netlify Function dentro de este mismo proyecto- se pierde
 * la garantia estructural que daba la separacion de repositorios: antes el
 * motor simplemente no estaba aqui, asi que no habia forma de filtrarlo.
 *
 * Lo que la sustituye es esta regla, y es la unica cosa que mantiene cerrado el
 * bloqueante B01: **nada bajo `src/` puede importar de `pbcg/` ni de
 * `netlify/`**. `src/` es lo que compila Next y lo que acaba, total o
 * parcialmente, en el navegador. `pbcg/` y `netlify/` solo los ejecuta la
 * funcion, en servidor.
 *
 * Si alguien escribe `import { calcular } from '@/../pbcg/src/calculate'` en un
 * componente, las tarifas viajan al navegador y el build falla aqui.
 */
const IMPORTS_PROHIBIDOS_EN_SRC = [
  {
    id: 'import de pbcg/',
    test: /from\s+['"][^'"]*\/?pbcg\/|require\(\s*['"][^'"]*\/?pbcg\//,
    reason: 'el modelo economico no puede acabar en el navegador (B01)',
  },
  {
    id: 'import de netlify/',
    test: /from\s+['"][^'"]*\/?netlify\/|require\(\s*['"][^'"]*\/?netlify\//,
    reason: 'el codigo de la funcion no puede acabar en el navegador',
  },
]

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

  if (path.startsWith('src/')) {
    for (const rule of IMPORTS_PROHIBIDOS_EN_SRC) {
      if (!rule.test.test(source)) continue
      const line = source.split('\n').findIndex((text) => rule.test.test(text)) + 1
      violations.push(`${path}:${line} · ${rule.id} (${rule.reason})`)
    }
  }
}

// Un stat, no un walk: si existe el directorio, ya es una violacion.
for (const dir of ['.netlify/edge-functions']) {
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
    '\nLas paginas de este sitio se exportan por completo y las publica un CDN.' +
      '\nEl unico computo es la Netlify Function de netlify/functions/, que usa el' +
      '\nmotor de pbcg/. Nada de src/ puede importar de ninguno de los dos: es lo' +
      '\nque impide que las tarifas acaben en el navegador (B01).',
  )
  process.exit(1)
}

console.log('verify:architecture · OK · sin codigo de servidor en el sitio')
