/**
 * Identificadores de medicion.
 *
 * No son secretos: viajan en el HTML de cualquier sitio que use Google
 * Analytics y se leen con «ver codigo fuente». Van aqui y no en una variable de
 * entorno porque con `output: 'export'` una variable tendria que ser
 * `NEXT_PUBLIC_*`, es decir, acabaria igualmente en el HTML, pero ademas
 * obligaria a configurarla en Netlify para que el sitio midiera algo. Un valor
 * publico que hay que declarar en dos sitios es un valor que un dia estara solo
 * en uno.
 *
 * ⚠️ **Miden todos los entornos**: produccion, las `deploy preview` de cada rama
 * y el servidor de revision interno. Separarlo desde el codigo obligaria a
 * recompilar para cambiarlo; se hace desde Google Tag Manager, con una
 * condicion sobre el nombre de host en el propio disparador, que es para lo que
 * sirve tener GTM.
 */

/** Google Analytics 4 (gtag.js). */
export const GA_ID = 'G-7F3TPM79D7'

/** Google Tag Manager. */
export const GTM_ID = 'GTM-KMK36XFH'
