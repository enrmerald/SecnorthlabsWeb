/**
 * Arranque de Google Tag Manager y Google Analytics 4.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTE FICHERO NO PASA POR EL COMPILADOR. Se sirve tal cual, como
 * `reparto-idioma.js`: JavaScript de toda la vida, sin modulos ni tipos.
 *
 * Antes esto eran dos `<script>` en linea dentro de `Analitica.tsx`, y estaba
 * mal por un motivo concreto. Un `<script>` con contenido en linea escrito
 * desde JSX **solo se ejecuta cuando el navegador analiza el HTML**; si React
 * lo vuelve a pintar durante una navegacion de cliente, crea el elemento pero
 * el navegador no lo ejecuta. React avisa de ello por consola:
 *
 *   «Encountered a script tag while rendering React component.»
 *
 * Se veia justo al cambiar de idioma, y tiene sentido: cambiar de `/es/` a
 * `/en/` cruza el segmento `[locale]`, asi que se vuelve a pintar el layout
 * entero. Dentro del mismo idioma el layout se reutiliza y no pasaba nada.
 *
 * No rompia la medicion -las etiquetas ya se habian cargado en la primera
 * visita y no deben cargarse dos veces-, pero era ruido en consola que tapaba
 * avisos de verdad. Con el arranque en un fichero aparte, `Analitica.tsx` solo
 * emite `<script async src>`, que React eleva al `<head>` y deduplica por `src`:
 * ni se repite, ni avisa.
 *
 * ⚠️ Los identificadores estan aqui **y** en `src/config/analitica.ts`, porque
 * este fichero no puede importar nada. Lo comprueba `analitica.test.ts`, que
 * ejecuta este script y compara lo que pide con los del manifiesto: si divergen,
 * falla la prueba en lugar de dejar de medir en silencio.
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function (window, document) {
  var GTM_ID = 'GTM-KMK36XFH'
  var GA_ID = 'G-7F3TPM79D7'

  window.dataLayer = window.dataLayer || []

  // `arguments` y no parametros con nombre: es lo que espera gtag.js, que lee
  // la cola de `dataLayer` tal cual se empujo.
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = window.gtag || gtag

  /** Inserta un script asincrono antes del primero que haya en el documento. */
  function cargar(src) {
    var etiqueta = document.createElement('script')
    etiqueta.async = true
    etiqueta.src = src

    var primero = document.getElementsByTagName('script')[0]
    // Puede no haber ninguno si el navegador aun no ha llegado a este fichero
    // por el HTML -por ejemplo si alguien lo carga a mano-, asi que hay respaldo.
    if (primero && primero.parentNode) {
      primero.parentNode.insertBefore(etiqueta, primero)
    } else {
      ;(document.head || document.documentElement).appendChild(etiqueta)
    }
  }

  // ── Tag Manager ──
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
  cargar('https://www.googletagmanager.com/gtm.js?id=' + GTM_ID)

  // ── Analytics 4 ──
  cargar('https://www.googletagmanager.com/gtag/js?id=' + GA_ID)
  gtag('js', new Date())
  gtag('config', GA_ID)
})(window, document)
