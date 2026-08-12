// `pnpm preview` - sirve out/ en local.
//
// No hay `next start` porque no hay servidor: lo unico que se publica es un
// directorio de ficheros. Esto reproduce como los sirve Netlify (trailingSlash,
// 404 por idioma) para poder revisar el artefacto real antes de desplegarlo.
import { createServer } from 'node:http'
import { createReadStream, readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publishDir = resolve(root, process.argv[2] ?? 'out')
const port = Number(process.env.PORT ?? 4173)

/**
 * Lee las reglas `[[redirects]]` 301 de `netlify.toml`, en vez de duplicarlas
 * aqui: es el mismo patron que usaba `idioma-preferido.mjs` con las variantes
 * de castellano, y sin el las redirecciones de legado (`/es/*`, `/en/*`…) no se
 * podrian probar en local ni en las pruebas E2E.
 *
 * Parser deliberadamente minimo: solo entiende lo que este proyecto escribe en
 * `[[redirects]]` -pares `clave = "valor"` de una linea, sin arrays ni tablas
 * anidadas- porque un TOML completo es mucho mas de lo que hace falta para leer
 * unas pocas reglas de redireccion.
 */
function cargarRedirects301() {
  const texto = readFileSync(join(root, 'netlify.toml'), 'utf8')
  const bloques = texto.split(/\n(?=\[\[redirects\]\])/)
  const reglas = []

  for (const bloque of bloques) {
    if (!bloque.startsWith('[[redirects]]')) continue

    const regla = {}
    for (const linea of bloque.split('\n').slice(1)) {
      const coincidencia = /^\s*(\w+)\s*=\s*(.+?)\s*$/.exec(linea)
      if (!coincidencia) continue
      const [, clave, valorCrudo] = coincidencia
      // No se leen `conditions`: las unicas reglas con condicion eran el reparto
      // de raiz por idioma, que ha desaparecido.
      if (clave === 'conditions') break
      const cadena = /^"(.*)"$/.exec(valorCrudo)
      // Sin comillas es un booleano (`force = true`) o un numero
      // (`status = 301`): de los dos, solo el numero necesita seguir siendo
      // comparable con `Number(...)`, asi que se deja tal cual en ese caso.
      regla[clave] = cadena
        ? cadena[1]
        : valorCrudo === 'true' || valorCrudo === 'false'
          ? valorCrudo === 'true'
          : valorCrudo
    }

    if (regla.from && regla.to && Number(regla.status) === 301) reglas.push(regla)
  }

  return reglas
}

const REDIRECTS_301 = cargarRedirects301()

/** Aplica `:splat` de la primera regla 301 que casa con `pathname`, o `null`. */
function resolverRedirect301(pathname) {
  for (const { from, to } of REDIRECTS_301) {
    if (!from.includes('*')) {
      if (pathname === from) return to
      continue
    }
    const base = from.slice(0, -1) // quita el "*" final, conserva la barra
    if (pathname.startsWith(base)) {
      const splat = pathname.slice(base.length)
      return to.replace(':splat', splat)
    }
  }
  return null
}

/**
 * `PREVIEW_NOINDEX=1` marca todo el servidor como no indexable.
 *
 * Es OBLIGATORIO en el servidor de revision interno. Un entorno con contenido sin
 * publicar accesible desde la red se acaba indexando, y entonces hay dos sitios
 * con el mismo contenido compitiendo: Google elige uno, normalmente el que no
 * quieres, y la web real arranca penalizada. Con la cabecera y el robots.txt no
 * hace falta acordarse de nada.
 */
const noIndex = process.env.PREVIEW_NOINDEX === '1'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

const fileAt = async (path) => {
  const info = await stat(path).catch(() => null)
  return info?.isFile() ? path : null
}

/** Resuelve una URL a un fichero de out/, sin permitir salir del directorio. */
async function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname)
  const candidate = resolve(publishDir, `.${normalize(decoded)}`)
  if (candidate !== publishDir && !candidate.startsWith(publishDir + sep)) return null

  return (
    (await fileAt(candidate)) ??
    (await fileAt(join(candidate, 'index.html'))) ??
    (await fileAt(`${candidate}.html`))
  )
}

/**
 * Rutas de `/api/*` que en produccion resuelve Netlify a `netlify/functions/`.
 *
 * Se sirven tambien aqui para que `pnpm preview` sea un entorno completo y las
 * pruebas E2E puedan ejercitar **la funcion real**, con su validacion y el motor
 * de verdad. La alternativa era exigir el CLI de Netlify, que son cientos de
 * megas para reproducir un enrutado de dos lineas.
 *
 * Las funciones son handlers `(Request) => Promise<Response>` de la API v2, que
 * es la firma web estandar, asi que se pueden invocar directamente. Se importan
 * con el type stripping nativo de Node, sin build previo.
 */
const FUNCIONES = {
  '/api/quote': 'quote',
  '/api/contact': 'contact',
  // El sumidero de la CSP. Tiene que estar tambien aqui, o en `pnpm preview` los
  // informes darian 404 y el navegador se quejaria de la cabecera en cada pagina,
  // que es justo el ruido que la politica pretende ayudar a eliminar.
  '/api/csp-report': 'csp-report',
}

const cacheFunciones = new Map()

async function cargarFuncion(nombre) {
  if (!cacheFunciones.has(nombre)) {
    const ruta = pathToFileURL(join(root, 'netlify', 'functions', `${nombre}.ts`)).href
    cacheFunciones.set(nombre, (await import(ruta)).default)
  }
  return cacheFunciones.get(nombre)
}

/** Traduce la peticion de Node a `Request` y la respuesta de vuelta. */
async function atenderFuncion(nombre, request, response) {
  const cuerpo = []
  for await (const trozo of request) cuerpo.push(trozo)

  const peticion = new Request(`http://localhost${request.url}`, {
    method: request.method,
    headers: request.headers,
    ...(cuerpo.length > 0 ? { body: Buffer.concat(cuerpo) } : {}),
  })

  let resultado
  try {
    resultado = await (await cargarFuncion(nombre))(peticion)
  } catch (error) {
    console.error(`preview · la funcion "${nombre}" ha fallado:`, error)
    response
      .writeHead(500, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ ok: false, error: 'generic' }))
    return
  }

  response.writeHead(resultado.status, Object.fromEntries(resultado.headers))
  response.end(Buffer.from(await resultado.arrayBuffer()))
}

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost')

  if (noIndex) {
    // Cabecera en TODAS las respuestas, incluidas las de las funciones y los
    // activos: `robots.txt` por si solo no cubre lo que ya se haya rastreado.
    response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
  }

  // Sustituye al robots.txt del artefacto mientras el servidor sea de revision.
  if (noIndex && pathname === '/robots.txt') {
    response
      .writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      .end('User-agent: *\nDisallow: /\n')
    return
  }

  const funcion = FUNCIONES[pathname]
  if (funcion) {
    await atenderFuncion(funcion, request, response)
    return
  }

  // Legado con prefijo de idioma (`/es/*`, `/en/*`…): las mismas reglas 301 de
  // netlify.toml, leidas de ahi mismo para que no puedan divergir.
  const destino301 = resolverRedirect301(pathname)
  if (destino301) {
    response.writeHead(301, { Location: destino301, 'Cache-Control': 'no-store' }).end()
    return
  }

  const file = await resolveFile(pathname)

  if (!file) {
    // 404 unica, como la regla del final de netlify.toml.
    const notFound = await fileAt(join(publishDir, '404', 'index.html'))
    if (!notFound) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404')
      return
    }
    response.writeHead(404, { 'Content-Type': MIME_TYPES['.html'] })
    createReadStream(notFound).pipe(response)
    return
  }

  const type = MIME_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream'
  response.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' })
  createReadStream(file).pipe(response)
})

if (!(await stat(publishDir).catch(() => null))) {
  console.error(`preview · no existe ${publishDir}. Ejecuta antes \`pnpm build\`.`)
  process.exit(1)
}

server.listen(port, () => {
  console.log(`preview · sirviendo ${publishDir} en http://localhost:${port}/`)
})
