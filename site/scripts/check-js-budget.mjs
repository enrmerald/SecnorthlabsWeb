// check:js - presupuesto de JavaScript (seccion 12.6).
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
 * cumple, y no es por el codigo del proyecto.** Esto es lo que se ha comprobado,
 * para que nadie tenga que repetirlo:
 *
 * 1. **No sobra nada en el bundle.** Verificado por inspeccion de `out/`: zod no
 *    esta, el arbol de mensajes no esta, y el motor PBCG no esta. Los iconos se
 *    importan uno a uno y no hay provider global de traduccion.
 * 2. **Los 156 KB son el suelo del framework.** React DOM son 70,9 KB gzip y el
 *    runtime del enrutador de cliente otros 40,5.
 * 3. **Dividir por pagina no sirve.** Las dieciseis paginas se resuelven con una
 *    sola ruta atrapatodo, asi que Next genera **un** bundle de cliente para
 *    todas: la Home y la calculadora cargan exactamente los mismos chunks. Se
 *    probo con `next/dynamic` sobre los dos componentes de cliente y el
 *    resultado fue 0,6 KB MAS, sin ninguna division. Se revirtio.
 *
 * Bajar de 100 KB exige cambiar de framework -Astro, o HTML con islas- o
 * renunciar a la navegacion de cliente. Es una decision de arquitectura que
 * corresponde a direccion, no un ajuste.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SOBRE EL TECHO: 160 KB, con la medida real en 156,8.
 *
 * Estaba en 157 con la medida en 156,8, es decir, 0,2 KB de margen. La intencion
 * era buena -que cualquier subida obligara a justificarse- pero el efecto no: con
 * dos decimas de holgura, lo que rompe el build no es una decision discutible sino
 * un parche de React o de Next que nadie eligio, y el arreglo entonces no es
 * pensar, es subir el numero con prisa. Un techo que salta por causas ajenas
 * ensena a subirlo sin mirar, que es justo lo contrario de lo que se pretendia.
 *
 * Con ~3 KB de holgura el presupuesto sigue siendo estrecho -no cabe una libreria
 * nueva- pero absorbe el ruido de las dependencias. La disciplina de verdad la da
 * revisar el delta en cada PR, no un techo sin aire.
 *
 * ⚠️ El margen NO es para gastarlo. Si aparece un componente de cliente nuevo -el
 * banner de consentimiento es el candidato- se mide antes y se decide con el
 * numero delante, no aprovechando el hueco.
 *
 * Si sube, lo primero que hay que comprobar son los tres puntos de arriba.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const PRESUPUESTO_KB = Number(process.env.JS_BUDGET_KB ?? 160)

// Sin prefijo de idioma (IDIOMAS_ACTIVOS = ['es']): la home EN desaparece con
// el ingles, y las demas pierden el `es/` inicial.
const paginas = [
  { etiqueta: 'home ES', path: 'index.html' },
  { etiqueta: 'MSSP ES', path: 'soluciones/mssp/index.html' },
  { etiqueta: 'contacto ES', path: 'contacto/index.html' },
  // La calculadora estaba aqui. Mientras `CALCULADORA_ACTIVA` sea `false` no se
  // genera, y contacto cubre lo mismo: es el otro formulario de cliente.
  // El listado del blog es la pagina con mas elementos del sitio -26 tarjetas y
  // el filtro por tema- y el detalle es la de mas texto. Si algun dia alguien
  // convierte Markdown en el navegador o arrastra el JSON del contenido a un
  // componente de cliente, se ve aqui.
  { etiqueta: 'blog ES', path: 'blog/index.html' },
  { etiqueta: 'articulo ES', path: 'blog/que-es-el-ens/index.html' },
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
