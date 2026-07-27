import type { Locale } from '@/config/routes'
import en from '../../messages/en.json'
import es from '../../messages/es.json'

/**
 * Carga de mensajes **en build** (seccion 2.1.4).
 *
 * Los dos ficheros se importan estaticamente para que el bundler los resuelva en
 * el build y no quede ninguna lectura dinamica en runtime — que con
 * `output: 'export'` no habria donde ejecutar.
 *
 * Esto **no** significa que los dos idiomas viajen al navegador: las paginas son
 * componentes de servidor de build, el HTML sale ya renderizado y los
 * componentes de cliente reciben solo las cadenas que necesitan, como props
 * (seccion 1.4.1). No se monta ningun provider global de traduccion.
 */
const MENSAJES = { es, en } as const

export type Mensajes = typeof es

export function cargarMensajes(locale: Locale): Mensajes {
  return MENSAJES[locale]
}
