import type { Locale } from '@/config/routes'
import type messages from './messages/es.json'

/**
 * Aumento de tipos de next-intl (seccion 2.3).
 *
 * Deriva el tipado de los mensajes del propio `es.json`, de modo que **una clave
 * inexistente sea un error de compilacion** y no una pagina reventada en
 * produccion. Es lo que evita tener que escribir `as Array<…>` al leer las
 * estructuras del brief: una asercion de tipo desactiva la comprobacion del
 * compilador justo donde mas falta hace, porque si manana alguien renombra
 * `title` a `label` en el JSON, el `as` sigue compilando y la pagina revienta.
 */
declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages
    Locale: Locale
  }
}

export {}
