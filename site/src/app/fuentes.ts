import { Noto_Sans, Space_Mono } from 'next/font/google'

/**
 * Fuentes del sistema de diseno (ISNLA-DOC-0004-04 seccion 1, mockup
 * image2.png).
 *
 * Space Mono para titulares, kickers, datos, botones y etiquetas; Noto Sans
 * para el cuerpo. `next/font/google` las auto-aloja en el artefacto y aplica
 * `font-display: swap` sin configuracion extra, de modo que **en produccion no
 * se hace ni una peticion a Google Fonts**. Ademas de peso, esa peticion seria
 * una transferencia de la IP del visitante a un tercero — y hoy el proyecto
 * anterior las carga por `@import` (Fase 11.3).
 *
 * Viven en su propio modulo porque las usan dos layouts: el raiz, para la 404
 * de ultimo recurso, y el de idioma, que es el que renderiza el sitio.
 *
 * Cada fuente expone su propia variable CSS; los tokens semanticos
 * --font-display y --font-sans apuntan a ellas desde globals.css. Son dos capas
 * a proposito: si manana se cambia de fuente se toca solo este fichero.
 *
 * Nota: el brief se contradice. Su seccion 1 y el mockup del sistema de diseno
 * dicen Space Mono + Noto Sans; su seccion 12 dice JetBrains / IBM Plex Mono.
 * Manda la seccion 1, que el propio documento declara "fuente de verdad" y es
 * lo que se ve renderizado en los trece mockups (pendiente P5).
 */
export const displayFont = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const sansFont = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
})
