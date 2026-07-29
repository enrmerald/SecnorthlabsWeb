// Idioma de destino de la raiz, a partir de `Accept-Language`.
//
// ⚠️ **En produccion esto no se ejecuta.** El reparto lo hacen las dos reglas de
// `netlify.toml` con `conditions = { Language = [...] }`, sin cómputo ninguno.
// Este modulo existe para que el servidor de preview se comporte igual y la regla
// se pueda comprobar en local: depende de una cabecera, y esas son justo las que
// nadie prueba hasta que fallan en produccion.
//
// Por eso la lista de variantes **se lee de `netlify.toml`** en lugar de
// duplicarse: si alguien anade un dialecto alli, el preview lo respeta y las
// pruebas siguen comprobando lo mismo que se despliega.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Variantes que llevan a /es/, leidas del bloque `conditions` de netlify.toml. */
export function variantesDeEspanol(toml = readFileSync(join(root, 'netlify.toml'), 'utf8')) {
  const bloque = /conditions\s*=\s*\{\s*Language\s*=\s*\[([\s\S]*?)\]\s*\}/.exec(toml)
  if (!bloque) throw new Error('netlify.toml: no se encuentra la condicion Language de la raiz')

  return bloque[1]
    .split(',')
    .map((valor) => valor.trim().replace(/^"|"$/g, '').trim())
    .filter(Boolean)
    .map((valor) => valor.toLowerCase())
}

/**
 * Devuelve `'es'` o `'en'`.
 *
 * Reproduce la semantica de Netlify, que **no** es la de un negociador de
 * contenido completo: la condicion se cumple si la cabecera **menciona** alguna de
 * las variantes, sin ordenar por el factor `q`. Es decir, `en-US,es;q=0.3` va a
 * /es/ aunque el ingles tenga mas peso.
 *
 * Se implementa asi a proposito, para que el preview y produccion coincidan. Si
 * algun dia hay que respetar el orden de preferencia de verdad, el cambio afecta a
 * las dos partes: aqui y en `netlify.toml`, que tendria que dejar de usar
 * `conditions` y pasar a una funcion.
 */
export function idiomaPreferido(acceptLanguage, variantes = variantesDeEspanol()) {
  if (!acceptLanguage) return 'en'

  const permitidas = new Set(variantes)

  const etiquetas = acceptLanguage
    .split(',')
    .map((parte) => parte.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean)

  for (const etiqueta of etiquetas) {
    if (permitidas.has(etiqueta)) return 'es'
    // Un dialecto que no esta en la lista pero cuyo idioma primario si: `es-XX`
    // desconocido sigue siendo castellano. Netlify no hace esto, y es la unica
    // diferencia deliberada: aqui es gratis y evita que un dialecto nuevo caiga
    // en ingles mientras nadie actualiza la lista.
    const primario = etiqueta.split('-')[0]
    if (primario && permitidas.has(primario)) return 'es'
  }

  return 'en'
}
