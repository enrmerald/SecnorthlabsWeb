import { LOGO_SENTRYNET_ICONO, LOGO_SENTRYNET_TEXTO } from '@/config/logos'

/**
 * Logotipo de SentryN3t: icono + texto, en SVG.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DE DONDE SALEN ESTOS TRES NUMEROS
 *
 * De medir la captura de referencia que entrego la marca, pixel a pixel: alto del
 * icono, alto de las letras y distancia entre sus centros. En esa referencia el
 * icono y las letras miden **casi lo mismo** -proporcion 0,97- y el icono queda un
 * 11% mas alto que el centro de las letras.
 *
 * Se probaron quince combinaciones de ratio y desplazamiento midiendo el render de
 * cada una; estas son las que reproducen la referencia (0,957 y -10,9%).
 *
 * ⚠️ **No coinciden con los de la otra aplicacion de la marca** (0,85 de icono y
 * 0,1 de desplazamiento). El motivo mas probable es que su `sn3t-icon.svg` tenga
 * distinto aire dentro del `viewBox` que la copia de este repositorio: con el mismo
 * ratio, el icono sale aqui un 30% mas alto que las letras. Lo que se ha replicado
 * es **el resultado visible**, que es lo que se pidio, no los numeros de partida.
 * Si algun dia se unifican los ficheros, esto hay que volver a medirlo.
 *
 * El desplazamiento es la parte que no se adivina: el SVG del texto incluye el
 * descendente de la «y» de «Sentry», asi que su caja es mas alta que las letras.
 * Centrar las dos cajas deja las letras visualmente altas respecto al icono. Al
 * bajar el texto, lo que se centra son **las letras** y no su caja, que es lo que
 * el ojo compara.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Por que SVG y no los PNG que habia antes: son 9 KB los dos, se ven nitidos a
 * cualquier tamano y en cualquier densidad de pantalla, y no hace falta generar
 * variantes 2x. Con `images.unoptimized` -obligatorio en la exportacion estatica-
 * un PNG no tenia ninguna ventaja.
 */

/** Medidos contra la captura de referencia. Ver el bloque de arriba antes de tocarlos. */
const RATIO_ICONO = 0.64
const RATIO_TEXTO = 0.72
const DESPLAZAMIENTO_TEXTO = 0.12

interface PropsLogoSentryNet {
  /**
   * Altura de referencia de la composicion, en pixeles. No es la altura del icono
   * ni la del texto: las dos se derivan de ella con los ratios de la marca.
   */
  alto?: number
  /** Solo el icono, a la altura completa. Para espacios muy estrechos. */
  soloIcono?: boolean
  className?: string
}

export function LogoSentryNet({
  alto = 38,
  soloIcono = false,
  className = '',
}: PropsLogoSentryNet) {
  const altoIcono = Math.round(alto * (soloIcono ? 1 : RATIO_ICONO))
  const altoTexto = Math.round(alto * RATIO_TEXTO)

  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SENTRYNET_ICONO.src}
        // El nombre accesible lo aporta el texto, salvo cuando el texto no esta.
        alt={soloIcono ? LOGO_SENTRYNET_ICONO.alt : ''}
        width={Math.round(altoIcono * LOGO_SENTRYNET_ICONO.ratio)}
        height={altoIcono}
        decoding="async"
        style={{ height: altoIcono, width: 'auto' }}
      />

      {!soloIcono && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={LOGO_SENTRYNET_TEXTO.src}
          alt={LOGO_SENTRYNET_TEXTO.alt}
          width={Math.round(altoTexto * LOGO_SENTRYNET_TEXTO.ratio)}
          height={altoTexto}
          decoding="async"
          style={{
            height: altoTexto,
            width: 'auto',
            position: 'relative',
            top: altoTexto * DESPLAZAMIENTO_TEXTO,
          }}
        />
      )}
    </span>
  )
}
