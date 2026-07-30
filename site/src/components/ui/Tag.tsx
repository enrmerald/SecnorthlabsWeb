import type { ReactNode } from 'react'

/**
 * Etiqueta en pildora con borde de 1px, radio completo y punto de color a la
 * izquierda (mockup image2.png, recuadro "Etiquetas").
 *
 * Se usa para normativa (NIS2, IEC 62443), estados (OK, operativo) y
 * caracteristicas (Pasivo y no intrusivo, IA / ML).
 */
export type AcentoTag = 'cian' | 'verde' | 'neutro'

const ACENTOS: Record<AcentoTag, { borde: string; texto: string; punto: string }> = {
  cian: { borde: 'border-cyan/40', texto: 'text-cyan', punto: 'text-cyan' },
  verde: { borde: 'border-green/40', texto: 'text-green', punto: 'text-green' },
  neutro: { borde: 'border-border', texto: 'text-text-dim', punto: 'text-text-dim' },
}

interface PropsTag {
  acento?: AcentoTag
  /** Oculta el punto romboidal. Util cuando ya hay un icono delante. */
  sinPunto?: boolean
  className?: string
  children: ReactNode
}

export function Tag({ acento = 'cian', sinPunto = false, className = '', children }: PropsTag) {
  const estilo = ACENTOS[acento]

  return (
    <span
      className={[
        // Sin `whitespace-nowrap`: una etiqueta larga como «Obligatorio sector
        // público» fija el ancho minimo de contenido de su celda de rejilla y
        // desborda la pagina a 320px. Prefiere no partirse, pero puede.
        'inline-flex items-center gap-1.5 text-balance',
        'rounded-full border px-3 py-1',
        'etiqueta',
        estilo.borde,
        estilo.texto,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Decorativo: el color y la forma no aportan informacion que no este ya
          en el texto, asi que se oculta al lector de pantalla. */}
      {!sinPunto && (
        <span aria-hidden="true" className={`text-[0.5rem] leading-none ${estilo.punto}`}>
          ◆
        </span>
      )}
      {children}
    </span>
  )
}
