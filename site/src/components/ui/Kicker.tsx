import type { ReactNode } from 'react'

/**
 * Kicker: `/01` o `>_` seguido de texto en mayusculas, en color de acento. Abre
 * cada seccion (mockup image2.png y image3.png).
 *
 * El prefijo es decorativo y se oculta al lector de pantalla: leer "barra cero
 * uno" antes de cada titular no aporta nada.
 */
export type ColorKicker = 'cian' | 'verde'

const COLORES: Record<ColorKicker, string> = {
  cian: 'text-cyan',
  verde: 'text-green',
}

interface PropsKicker {
  /** `/01`, `>_`… Si se omite, solo se pinta el texto. */
  prefijo?: string
  color?: ColorKicker
  className?: string
  children: ReactNode
}

export function Kicker({ prefijo, color = 'cian', className = '', children }: PropsKicker) {
  return (
    <p className={['kicker flex items-center gap-2', COLORES[color], className].filter(Boolean).join(' ')}>
      {prefijo && (
        <span aria-hidden="true" className="opacity-70">
          {prefijo}
        </span>
      )}
      <span>{children}</span>
    </p>
  )
}
