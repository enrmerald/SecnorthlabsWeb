/* eslint-disable @next/next/next-script-for-ga --
 * La regla propone `GoogleTagManager` de `@next/third-parties/google`. No se
 * usa, y no es pereza: ese componente envuelve `next/script`, que es codigo de
 * cliente, de modo que cambia dos etiquetas que hoy no pesan nada por una
 * dependencia mas y JavaScript propio en todas las paginas. El presupuesto de
 * `check:js` esta en 156,9 KB de 157, y las 15 paginas comparten los mismos
 * chunks: lo que entre aqui, entra en todas. Ademas retrasa la carga de GTM
 * hasta despues de la hidratacion, que es justo lo contrario de lo que pide
 * Google. Emitir las etiquetas en el HTML no tiene ninguno de esos costes.
 */
import { GA_ID, GTM_ID } from '@/config/analitica'

/**
 * Google Tag Manager y Google Analytics 4.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESCRIBEN COOKIES, Y ESO EN LA UE EXIGE CONSENTIMIENTO PREVIO.
 *
 * Estas etiquetas se cargan hoy **en cuanto se abre la pagina**, sin preguntar.
 * Mientras no haya un banner de consentimiento -o Consent Mode configurado en
 * GTM con el estado por defecto en `denied`-, el sitio esta midiendo antes de
 * tener permiso. Esta escrito aqui para que quien lo lea no lo descubra tarde;
 * el aviso completo esta en la conversacion del 30/07/2026 y sigue abierto.
 *
 * Cuando se resuelva, el cambio no es de codigo: se hace en GTM, que es
 * exactamente por lo que se instala GTM y no solo gtag.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * No es un componente de cliente y no monta ningun efecto: los `<script>` salen
 * escritos en el HTML exportado, igual que el JSON-LD. `dangerouslySetInnerHTML`
 * es la unica forma de emitir un script en linea desde JSX, y aqui es seguro
 * porque el contenido es una constante del repositorio: no hay ni un dato que
 * venga de fuera.
 *
 * **Deliberadamente NO se pone en `/`.** Esa pagina solo reparte por idioma y
 * redirige de inmediato: medirla contaria dos visitas por cada una real y
 * ademas competiria con `reparto-idioma.js`, que tiene que ser el primer
 * elemento del `<body>` para ejecutarse antes del primer pintado.
 */
export function Analitica() {
  return (
    <>
      {/* GTM primero: es el contenedor, y lo que llegue despues puede
          depender de que `dataLayer` ya exista. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
        }}
      />

      {/* GA4 por gtag, ademas de GTM.
          ⚠️ Si dentro de GTM se configura tambien una etiqueta de GA4 con este
          mismo identificador, cada visita se contara dos veces. Una de las dos
          sobra: o esta o la de GTM, no las dos. */}
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`,
        }}
      />
    </>
  )
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
