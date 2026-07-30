import { getRequestConfig } from 'next-intl/server'
import { DEFAULT_LOCALE, isLocale } from '@/config/routes'
import { cargarMensajes } from './mensajes'

/**
 * Configuracion de next-intl. La consume el plugin declarado en
 * `next.config.ts`.
 *
 * Solo se usa la carga de mensajes y el formateo. **No se usan las APIs de
 * navegacion de next-intl** (`createNavigation`, `defineRouting` con
 * `pathnames`), porque necesitan un proxy o middleware y ninguno existe con
 * `output: 'export'`. Las URLs salen del manifiesto de `@/config/routes`.
 *
 * Tampoco se detecta `Accept-Language`, ni se guarda cookie de idioma, ni se
 * redirige por ubicacion: el idioma esta en la URL y no cambia sin accion del
 * usuario (seccion 2.1).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const solicitado = await requestLocale
  const locale = solicitado && isLocale(solicitado) ? solicitado : DEFAULT_LOCALE

  return {
    locale,
    messages: cargarMensajes(locale),
    // Zona horaria fija: sin ella, un formateo de fecha en build y otro en
    // cliente pueden diferir y romper la hidratacion.
    timeZone: 'Europe/Madrid',
  }
})
