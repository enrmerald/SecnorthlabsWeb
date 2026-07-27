// `pnpm preview` — sirve out/ en local.
//
// No hay `next start` porque no hay servidor: lo unico que se publica es un
// directorio de ficheros. Esto reproduce como los sirve Netlify (trailingSlash,
// 404 por idioma) para poder revisar el artefacto real antes de desplegarlo.
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publishDir = resolve(root, process.argv[2] ?? 'out')
const port = Number(process.env.PORT ?? 4173)

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

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost')

  // Netlify redirige / a /es/ con un 301 fijo (Fase 11.1). Se reproduce aqui
  // para que la ruta raiz se comporte igual en local que en produccion.
  if (pathname === '/') {
    response.writeHead(301, { Location: '/es/' }).end()
    return
  }

  const file = await resolveFile(pathname)

  if (!file) {
    // 404 por idioma, como las reglas del final de netlify.toml (Fase 10.4).
    const locale = pathname.startsWith('/en/') ? 'en' : 'es'
    const notFound = await fileAt(join(publishDir, locale, '404', 'index.html'))
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
