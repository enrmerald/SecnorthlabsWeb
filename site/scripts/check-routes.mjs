// check:routes — coherencia del manifiesto de rutas (seccion 2.1.1).
//
// Con slugs distintos por idioma, dos rutas pueden colisionar en un idioma y no
// en el otro, y el sintoma seria una pagina que simplemente no se genera. Aqui
// se detecta en CI y no en produccion.
import { readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const { ROUTES, LOCALES, NAV_ROUTES, getLocalizedPath } = await import(
  pathToFileURL(join(root, 'src', 'config', 'routes.ts')).href
)

const mensajes = Object.fromEntries(
  await Promise.all(
    LOCALES.map(async (locale) => [
      locale,
      JSON.parse(await readFile(join(root, 'messages', `${locale}.json`), 'utf8')),
    ]),
  ),
)

/** @type {string[]} */
const errores = []

// ── 1 · Cada RouteId aparece una sola vez ────────────────────────────────────
const vistos = new Set()
for (const route of ROUTES) {
  if (vistos.has(route.id)) errores.push(`RouteId duplicado: "${route.id}"`)
  vistos.add(route.id)
}

// ── 2 · Ningun slug duplicado dentro del mismo idioma ────────────────────────
for (const locale of LOCALES) {
  const porRuta = new Map()
  for (const route of ROUTES) {
    if (!route.enabled) continue
    const path = route.paths[locale]
    const previo = porRuta.get(path)
    if (previo) errores.push(`"${path}" (${locale}) lo usan "${previo}" y "${route.id}"`)
    porRuta.set(path, route.id)
  }
}

// ── 3 · Forma de las rutas: prefijo de idioma y barra final ──────────────────
for (const route of ROUTES) {
  for (const locale of LOCALES) {
    const path = route.paths[locale]
    if (!path) {
      errores.push(`"${route.id}" no declara ruta para "${locale}"`)
      continue
    }
    if (!path.startsWith(`/${locale}/`)) {
      errores.push(`"${route.id}" (${locale}): "${path}" no empieza por /${locale}/`)
    }
    // trailingSlash: true en next.config, asi que la barra final no es estetica.
    if (!path.endsWith('/')) {
      errores.push(`"${route.id}" (${locale}): "${path}" no termina en barra`)
    }
    if (path !== path.toLowerCase() || /[^a-z0-9/\-]/.test(path)) {
      errores.push(`"${route.id}" (${locale}): "${path}" tiene mayusculas o caracteres no ASCII`)
    }
  }
}

// ── 4 · Las anclas estan declaradas en los dos idiomas ───────────────────────
for (const route of ROUTES) {
  for (const [clave, traducciones] of Object.entries(route.anchors ?? {})) {
    for (const locale of LOCALES) {
      if (!traducciones[locale]) {
        errores.push(`"${route.id}": el ancla "${clave}" no esta traducida a "${locale}"`)
      }
    }
  }
}

// ── 5 · Cada ruta activa tiene su namespace de mensajes ──────────────────────
const buscar = (objeto, ruta) =>
  ruta.split('.').reduce((valor, clave) => (valor == null ? undefined : valor[clave]), objeto)

for (const route of ROUTES) {
  if (!route.enabled) continue
  for (const locale of LOCALES) {
    if (buscar(mensajes[locale], route.namespace) === undefined) {
      errores.push(`"${route.id}": falta el namespace "${route.namespace}" en ${locale}.json`)
    }
  }
}

// ── 6 · La navegacion solo enlaza rutas activas ──────────────────────────────
for (const id of NAV_ROUTES) {
  const route = ROUTES.find((r) => r.id === id)
  if (!route) errores.push(`NAV_ROUTES enlaza "${id}", que no existe en el manifiesto`)
  else if (!route.enabled) errores.push(`NAV_ROUTES enlaza "${id}", que esta desactivada`)
}

// ── 7 · Los routeId de los mensajes existen y estan activos ──────────────────
// Los enlaces del pie, del desplegable y de las migas de pan llevan routeId en
// lugar de href. Si alguien renombra una ruta, esto lo detecta.
const activas = new Set(ROUTES.filter((r) => r.enabled).map((r) => r.id))

function recorrer(valor, ruta, locale) {
  if (Array.isArray(valor)) {
    valor.forEach((item, i) => recorrer(item, `${ruta}[${i}]`, locale))
    return
  }
  if (!valor || typeof valor !== 'object') return

  if ('routeId' in valor) {
    const { routeId, hash } = valor
    // routeId null = tramo sin pagina propia, o la pagina actual.
    if (routeId !== null) {
      if (!activas.has(routeId)) {
        errores.push(`${locale}.json · ${ruta}.routeId = "${routeId}": no existe o esta desactivada`)
      } else if (hash) {
        try {
          getLocalizedPath(routeId, locale, hash)
        } catch {
          errores.push(`${locale}.json · ${ruta}: el ancla "${hash}" no esta declarada en "${routeId}"`)
        }
      }
    }
  }

  for (const [clave, hijo] of Object.entries(valor)) recorrer(hijo, `${ruta}.${clave}`, locale)
}

for (const locale of LOCALES) recorrer(mensajes[locale], '', locale)

// ── Resultado ────────────────────────────────────────────────────────────────

if (errores.length > 0) {
  console.error('check:routes · FALLO\n')
  for (const error of errores) console.error(`  ${error}`)
  process.exit(1)
}

const activasCount = ROUTES.filter((r) => r.enabled).length
console.log(
  `check:routes · OK · ${activasCount} rutas activas x ${LOCALES.length} idiomas = ${activasCount * LOCALES.length} paginas`,
)
