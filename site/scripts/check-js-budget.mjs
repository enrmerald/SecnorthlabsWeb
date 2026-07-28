// check:js — presupuesto de JavaScript (seccion 12.6).
//
// El INP no lo decide el numero de componentes, lo decide cuanto JavaScript
// tiene que descargar, analizar y ejecutar el navegador. Sin medirlo en cada
// build, el presupuesto es una frase en un documento.
//
// Se mide **gzip** y sobre el HTML ya generado, contando lo que el navegador
// carga de verdad: se excluyen los scripts `noModule`, que solo descargan los
// navegadores antiguos y que en Next son el bundle de polyfills.
import { readFile, readdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'out')

/**
 * Techo en KB gzip por pagina. Es un trinquete contra regresiones, no un
 * objetivo alcanzado.
 *
 * ⚠️ **El presupuesto del plan (100 KB gzip para la Home, seccion 12.6) no se
 * cumple, y no es por el codigo del proyecto.** Con Next 16 App Router y React
 * 19, una pagina con un solo componente de cliente parte ya de ~148 KB gzip:
 * React DOM, el runtime del enrutador de cliente y la carga de segmentos. Medido
 * despues de quitar el provider global de traduccion, que era lo unico
 * eliminable por nuestra parte.
 *
 * Las opciones reales para bajar de 100 KB son cambiar de framework —Astro, o
 * HTML con islas— o renunciar a la navegacion de cliente. Es una decision de
 * arquitectura que corresponde a direccion, no un ajuste. Hasta que se tome, el
 * valor se mantiene pegado a la medida real para que **cualquier subida** rompa
 * el build y haya que justificarla.
 */
const PRESUPUESTO_KB = Number(process.env.JS_BUDGET_KB ?? 155)

const paginas = [
  { etiqueta: 'home ES', path: 'es/index.html' },
  { etiqueta: 'home EN', path: 'en/index.html' },
  { etiqueta: 'MSSP ES', path: 'es/soluciones/mssp/index.html' },
  { etiqueta: 'contacto ES', path: 'es/contacto/index.html' },
  { etiqueta: 'calculadora ES', path: 'es/calculadora/index.html' },
]

const cache = new Map()
const pesoGzip = async (recurso) => {
  if (!cache.has(recurso)) {
    cache.set(recurso, gzipSync(await readFile(join(outDir, recurso))).length)
  }
  return cache.get(recurso)
}

/** @type {string[]} */
const errores = []
const filas = []

for (const { etiqueta, path } of paginas) {
  const html = await readFile(join(outDir, path), 'utf8').catch(() => null)
  if (html === null) {
    errores.push(`no existe out/${path}`)
    continue
  }

  // Solo los <script src> que ejecuta un navegador moderno: los que llevan
  // `noModule` son el bundle de polyfills y solo los descargan los antiguos.
  const recursos = new Set()
  for (const coincidencia of html.matchAll(/<script\b[^>]*>/g)) {
    const etiqueta = coincidencia[0]
    const src = /src="(\/_next\/static\/[^"]+\.js)"/.exec(etiqueta)?.[1]
    if (!src || /\bnoModule\b/i.test(etiqueta)) continue
    recursos.add(src)
  }

  let total = 0
  for (const recurso of recursos) total += await pesoGzip(recurso.slice(1))

  const kb = total / 1024
  filas.push({ etiqueta, kb, chunks: recursos.size })
  if (kb > PRESUPUESTO_KB) {
    errores.push(`${etiqueta}: ${kb.toFixed(1)} KB gzip supera el presupuesto de ${PRESUPUESTO_KB} KB`)
  }
}

for (const { etiqueta, kb, chunks } of filas) {
  console.log(`  ${etiqueta.padEnd(16)} ${kb.toFixed(1).padStart(7)} KB gzip · ${chunks} chunks`)
}

// Aviso, no error: enterarse de que hay un chunk enorme antes de que lo detecte
// un usuario en movil.
const chunksDir = join(outDir, '_next', 'static', 'chunks')
for (const entrada of await readdir(chunksDir, { withFileTypes: true })) {
  if (!entrada.isFile() || !entrada.name.endsWith('.js')) continue
  const kb = (await pesoGzip(join('_next', 'static', 'chunks', entrada.name))) / 1024
  if (kb > 60) console.warn(`  aviso · ${entrada.name}: ${kb.toFixed(1)} KB gzip en un solo chunk`)
}

if (errores.length > 0) {
  console.error('\ncheck:js · FALLO\n')
  for (const error of errores) console.error(`  ${error}`)
  console.error(
    '\nAntes de subir el presupuesto, comprobar: providers globales innecesarios,' +
      '\niconos importados en bloque, y componentes marcados con "use client" que' +
      '\nno necesitan interaccion.',
  )
  process.exit(1)
}

console.log(`\ncheck:js · OK · ninguna pagina supera ${PRESUPUESTO_KB} KB gzip`)
