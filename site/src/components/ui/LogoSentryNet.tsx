import { LOGO_SENTRYNET_ICONO, LOGO_SENTRYNET_WORDMARK } from '@/config/logos'

/**
 * Logotipo de SentryN3t: icono + wordmark compuestos.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUE DOS IMAGENES Y NO UNA
 *
 * El logotipo horizontal que traia la marca (`sentrynet-horizontal-dark-md.png`)
 * viene con el icono **mas bajo que el texto**. No es un problema de escalado:
 * la desalineacion esta dentro del propio fichero, asi que a cualquier tamano se
 * reproduce igual.
 *
 * Componiendolo aqui, el navegador centra las dos piezas con `items-center` y la
 * alineacion es exacta. Ademas se pudo recortar el aire transparente de cada
 * una -el icono traia 76 px sobrantes abajo, el wordmark otros distintos-, que
 * era justamente lo que hacia imposible alinearlas dandoles la misma altura de
 * caja.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Se usa `<img>` y no `next/image` por lo mismo que en `LogoMarca`: con
 * `images.unoptimized: true` -obligatorio en la exportacion estatica-
 * `next/image` no optimiza nada y si anade JavaScript de cliente.
 *
 * El nombre accesible lo pone el icono (`alt="SentryN3t"`) y el wordmark queda
 * como decorativo (`alt=""`): son dos imagenes de un solo logotipo, y anunciar
 * «SentryN3t SentryN3t» seria peor que no anunciarlo.
 */
interface PropsLogoSentryNet {
  /** Altura del wordmark en pixeles. El icono se ajusta a el opticamente. */
  alto?: number
  className?: string
}

export function LogoSentryNet({ alto = 24, className = '' }: PropsLogoSentryNet) {
  // El icono va un 20% mas alto que las letras. Es el ajuste optico habitual: el
  // wordmark recortado son solo mayusculas, mientras que el icono es una forma
  // cerrada, y a la misma altura exacta se percibe pequeno.
  //
  // El valor sale de comparar 1,1 / 1,25 / 1,4 renderizados: por debajo el icono
  // se queda corto y parece un adorno, y por encima domina al nombre, que es lo
  // que la marca quiere que se lea.
  const altoIcono = Math.round(alto * 1.2)
  const anchoIcono = Math.round(altoIcono * LOGO_SENTRYNET_ICONO.ratio)
  const anchoWordmark = Math.round(alto * LOGO_SENTRYNET_WORDMARK.ratio)

  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SENTRYNET_ICONO.src}
        srcSet={`${LOGO_SENTRYNET_ICONO.src} 1x, ${LOGO_SENTRYNET_ICONO.src2x} 2x`}
        alt={LOGO_SENTRYNET_ICONO.alt}
        width={anchoIcono}
        height={altoIcono}
        loading="lazy"
        decoding="async"
        style={{ height: altoIcono, width: anchoIcono }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SENTRYNET_WORDMARK.src}
        srcSet={`${LOGO_SENTRYNET_WORDMARK.src} 1x, ${LOGO_SENTRYNET_WORDMARK.src2x} 2x`}
        alt=""
        width={anchoWordmark}
        height={alto}
        loading="lazy"
        decoding="async"
        style={{ height: alto, width: anchoWordmark }}
      />
    </span>
  )
}
