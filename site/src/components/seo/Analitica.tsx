import { GTM_ID } from '@/config/analitica'

/**
 * Google Tag Manager y Google Analytics 4.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESCRIBEN COOKIES, Y ESO EN LA UE EXIGE CONSENTIMIENTO PREVIO.
 *
 * Estas etiquetas se cargan hoy **en cuanto se abre la pagina**, sin preguntar.
 * Mientras no haya un aviso de consentimiento -o Consent Mode configurado en
 * GTM con el estado por defecto en `denied`-, el sitio esta midiendo antes de
 * tener permiso. Y la politica de cookies ya publicada dice lo contrario: que
 * las analiticas no se cargan hasta aceptarlas. Es el pendiente mas urgente.
 *
 * Cuando se resuelva, el cambio no es de codigo: se hace en GTM, que es
 * exactamente por lo que se instala GTM y no solo gtag.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **El arranque vive en `public/analitica.js`, no aqui.** Un `<script>` con
 * contenido en linea escrito desde JSX solo se ejecuta cuando el navegador
 * analiza el HTML; si React lo vuelve a pintar en una navegacion de cliente
 * -cambiar de idioma, que cruza el segmento `[locale]` y repinta el layout
 * entero-, crea el elemento pero el navegador no lo ejecuta, y React lo avisa
 * por consola. Un `<script async src>` no tiene ese problema: React lo eleva al
 * `<head>` y lo deduplica por `src`.
 *
 * Sigue sin ser componente de cliente y sin montar ningun efecto: las dos
 * etiquetas salen escritas en el HTML exportado, igual que el JSON-LD.
 *
 * **Deliberadamente NO se pone en `/`.** Esa pagina solo reparte por idioma y
 * redirige de inmediato: medirla contaria dos visitas por cada una real y
 * ademas competiria con `reparto-idioma.js`, que tiene que ser el primer
 * elemento del `<body>` para ejecutarse antes del primer pintado.
 */
export function Analitica() {
  return <script async src="/analitica.js" />
}

/**
 * El respaldo de GTM para quien no ejecuta JavaScript.
 *
 * Va separado porque es contenido del documento, no una etiqueta de carga: React
 * eleva al `<head>` los `<script async src>`, pero un `<noscript>` con un iframe
 * se queda donde se pone, y su sitio es el principio del `<body>`.
 */
export function AnaliticaSinJs() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        // Un iframe sin titulo es un fallo de accesibilidad, y `hidden` no basta
        // porque el elemento sigue en el arbol. Se marca ademas como decorativo.
        title="Google Tag Manager"
        aria-hidden="true"
      />
    </noscript>
  )
}
