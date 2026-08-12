import { GTM_ID } from '@/config/analitica'

/**
 * Google Tag Manager y Google Analytics 4.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESCRIBEN COOKIES, Y ESO EN LA UE EXIGE CONSENTIMIENTO PREVIO.
 *
 * Se publican midiendo a proposito: el escaner de **Cookiebot** necesita que las
 * etiquetas disparen para inventariar que cookies se escriben, y sin medicion su
 * declaracion saldria vacia. Es un paso intermedio con fecha, no el estado final.
 *
 * ⚠️ Mientras dure, la politica de cookies dice algo que aun no es cierto: que
 * las analiticas no se cargan hasta aceptarlas. La ventana se cierra al activar
 * el banner de Cookiebot. El motivo completo y el orden de los cuatro pasos estan
 * en `src/app/layout.tsx`, que es donde se montan.
 *
 * El consentimiento no se programa aqui: se configura en GTM con Consent Mode,
 * que es exactamente por lo que se instala GTM y no solo gtag. GA4 se configura
 * **dentro del contenedor**, no desde `public/analitica.js`, y eso es lo que hace
 * que GTM -y por tanto Cookiebot- pueda gobernarlo.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **El arranque vive en `public/analitica.js`, no aqui.** Un `<script>` con
 * contenido en linea escrito desde JSX solo se ejecuta cuando el navegador
 * analiza el HTML; si React lo vuelve a pintar en una navegacion de cliente
 * -al volver a montar el layout raiz-, crea el elemento pero el navegador no lo
 * ejecuta, y React lo avisa por consola. Un `<script async src>` no tiene ese
 * problema: React lo eleva al `<head>` y lo deduplica por `src`.
 *
 * Sigue sin ser componente de cliente y sin montar ningun efecto: las dos
 * etiquetas salen escritas en el HTML exportado, igual que el JSON-LD.
 *
 * Se monta en el layout raiz, asi que mide **todas** las paginas, incluida `/`:
 * con un solo idioma activo, `/` es la Home real y no una pagina de reparto que
 * conviniera excluir de la medicion.
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
