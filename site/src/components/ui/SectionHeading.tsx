import type { ReactNode } from 'react'
import { Kicker, type ColorKicker } from './Kicker'

/**
 * Kicker + titular de seccion. Compone los dos elementos con los que abre cada
 * bloque en todos los mockups.
 *
 * El nivel se pasa explicitamente porque la jerarquia de encabezados no puede
 * tener saltos (Fase 9) y solo puede haber un `<h1>` por pagina: quien compone
 * la pagina sabe si esto es un h2 o un h3, el componente no.
 */
interface PropsSectionHeading {
  kicker?: string
  kickerPrefijo?: string
  kickerColor?: ColorKicker
  titulo: ReactNode
  /** Texto introductorio bajo el titular. */
  descripcion?: ReactNode
  nivel?: 'h1' | 'h2' | 'h3'
  /** Centra el bloque. Es como se pinta la banda de CTA final. */
  centrado?: boolean
  id?: string
  className?: string
}

export function SectionHeading({
  kicker,
  kickerPrefijo,
  kickerColor = 'cian',
  titulo,
  descripcion,
  nivel = 'h2',
  centrado = false,
  id,
  className = '',
}: PropsSectionHeading) {
  const Titulo = nivel

  return (
    <div
      className={[
        'flex flex-col gap-3',
        centrado ? 'items-center text-center' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {kicker && (
        <Kicker prefijo={kickerPrefijo} color={kickerColor}>
          {kicker}
        </Kicker>
      )}

      <Titulo id={id} className={nivel === 'h1' ? 'heading-display' : 'section-title'}>
        {titulo}
      </Titulo>

      {descripcion && (
        <p className={`texto-cuerpo ${centrado ? 'mx-auto text-center' : ''}`}>{descripcion}</p>
      )}
    </div>
  )
}
