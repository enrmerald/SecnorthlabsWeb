// check:i18n — paridad estructural entre es.json y en.json (seccion 2.5).
//
// Con dos idiomas y slugs distintos, una divergencia de estructura se manifiesta
// como una pagina inglesa reventada en produccion.
//
// La version que proponia la primera revision del plan solo comparaba nombres de
// clave y LONGITUD de los arrays, sin mirar dentro, asi que esto pasaba la
// prueba:
//
//   es: [{ "title": "…", "description": "…" }]
//   en: [{ "label": "…", "text": "…" }]
//
// Mismo numero de elementos, estructura incompatible. Esta version recorre
// tambien el interior de cada elemento de array.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const leer = async (locale) =>
  JSON.parse(await readFile(join(root, 'messages', `${locale}.json`), 'utf8'))

const es = await leer('es')
const en = await leer('en')

/** Firma estructural: recorre objetos Y elementos de array. */
function shape(value, path = '') {
  if (Array.isArray(value)) {
    return [
      `${path}:array(${value.length})`,
      ...value.flatMap((item, i) => shape(item, `${path}[${i}]`)),
    ]
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
  }
  return [`${path}:${typeof value}`]
}

const a = shape(es)
const b = shape(en)
const sa = new Set(a)
const sb = new Set(b)
const soloEs = a.filter((k) => !sb.has(k))
const soloEn = b.filter((k) => !sa.has(k))

/** @type {string[]} */
const errores = []

if (soloEs.length) errores.push(`Solo en ES:\n  ${soloEs.join('\n  ')}`)
if (soloEn.length) errores.push(`Solo en EN:\n  ${soloEn.join('\n  ')}`)

// ── Comprobaciones de contenido, no de estructura ────────────────────────────
// La paridad estructural no detecta un texto que se quedo sin traducir ni un
// marcador de posicion que se colo a produccion.

const serializado = { es: JSON.stringify(es), en: JSON.stringify(en) }

// Marcadores del brief que no pueden publicarse: no se publican datos que no
// existen (seccion 2, "Datos de contacto").
const MARCADORES = [
  'hola@isnlabs.eu',
  '9XX XX XX XX',
  '6XX XXX XXX@',
  'ewala.es/politica',
  'ewala.es/aviso',
  'lorem ipsum',
]

for (const [locale, texto] of Object.entries(serializado)) {
  for (const marcador of MARCADORES) {
    if (texto.toLowerCase().includes(marcador.toLowerCase())) {
      errores.push(`${locale}.json contiene el marcador de posicion "${marcador}"`)
    }
  }
}

// La razon social correcta es la registrada, no la que usa hoy la web.
if (serializado.es.includes('Innovation & NORTH LABS')) {
  errores.push('es.json usa "Innovation & NORTH LABS SL", que no es la denominacion registrada')
}

// Ninguna tarifa del modelo economico puede aparecer en un fichero de mensajes.
if (/\b6[.,]58\b/.test(serializado.es + serializado.en)) {
  errores.push('los mensajes contienen una tarifa del modelo economico PBCG')
}

if (errores.length > 0) {
  console.error('check:i18n · FALLO\n')
  for (const error of errores) console.error(error)
  process.exit(1)
}

console.log(`check:i18n · OK · ${a.length} nodos con estructura identica en ES y EN`)
