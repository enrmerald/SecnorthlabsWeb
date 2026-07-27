// Pipeline de imagenes en build (Fase 11.3).
//
// Con images.unoptimized: true no hay optimizador en runtime, asi que las
// variantes se generan aqui: AVIF + WebP + fallback en los anchos de la matriz
// mobile-first, mas un manifest con las dimensiones reales para poder escribir
// width/height y no provocar CLS.
//
// Los originales viven en assets/images/ (FUERA de public/) para que no se
// publiquen sin procesar. Mientras no exista ese directorio, el script no tiene
// nada que hacer: el hero es CSS y SVG, que es lo que mantiene el LCP bajo.
import { access, mkdir, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, basename } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'assets', 'images')
const outputDir = join(root, 'public', 'img')
const manifestPath = join(root, 'src', 'generated', 'images.json')

const WIDTHS = [320, 480, 640, 768, 1024, 1280, 1600]
const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif'])

const exists = async (path) =>
  access(path).then(
    () => true,
    () => false,
  )

if (!(await exists(sourceDir))) {
  console.log('images:build · sin assets/images/, nada que procesar')
  process.exit(0)
}

const sources = (await readdir(sourceDir)).filter((file) =>
  SOURCE_EXTENSIONS.has(extname(file).toLowerCase()),
)

if (sources.length === 0) {
  console.log('images:build · assets/images/ vacio, nada que procesar')
  process.exit(0)
}

const { default: sharp } = await import('sharp')

await mkdir(outputDir, { recursive: true })
await mkdir(dirname(manifestPath), { recursive: true })

const manifest = {}

for (const file of sources) {
  const name = basename(file, extname(file))
  const input = sharp(join(sourceDir, file))
  const { width: intrinsicWidth, height: intrinsicHeight } = await input.metadata()

  if (!intrinsicWidth || !intrinsicHeight) {
    throw new Error(`images:build · ${file} no declara dimensiones`)
  }

  // Nunca ampliar: un ancho mayor que el original solo produce peso extra.
  const widths = WIDTHS.filter((width) => width <= intrinsicWidth)
  if (widths.length === 0) widths.push(intrinsicWidth)

  const variants = { avif: [], webp: [] }

  for (const width of widths) {
    for (const format of /** @type {const} */ (['avif', 'webp'])) {
      const target = `${name}-${width}.${format}`
      await input
        .clone()
        .resize({ width })
        .toFormat(format, { quality: format === 'avif' ? 55 : 78 })
        .toFile(join(outputDir, target))
      variants[format].push({ width, src: `/img/${target}` })
    }
  }

  manifest[name] = {
    width: intrinsicWidth,
    height: intrinsicHeight,
    aspectRatio: intrinsicWidth / intrinsicHeight,
    ...variants,
  }
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(
  `images:build · ${sources.length} imagen(es) procesadas en ${WIDTHS.length} anchos`,
)
