import type { ElementType, HTMLAttributes, ReactNode } from 'react'

/**
 * Tarjeta del sistema de diseno: fondo --color-card, borde de 1px y radio de
 * 10px, con barra de acento opcional arriba o a la izquierda.
 *
 * En los mockups aparece con acento superior en las cuatro tarjetas de pilar de
 * la Home (image3.png) y con acento izquierdo en la tarjeta de servicio
 * destacado (image2.png y image4.png).
 */
export type PosicionAcento = 'top' | 'left' | 'none'
export type ColorAcento = 'cian' | 'verde'

const BARRA_TOP: Record<ColorAcento, string> = {
  cian: 'before:bg-cyan',
  verde: 'before:bg-green',
}

const BORDE_DESTACADO: Record<ColorAcento, string> = {
  cian: 'border-cyan/40',
  verde: 'border-green/40',
}

/**
 * Hereda los atributos HTML para poder pasar `id`, `role` o `data-*` sin ir
 * anadiendo props una a una. El listado del blog, por ejemplo, marca cada
 * tarjeta con `data-categoria` y filtra desde CSS, sin volver a renderizar la
 * lista en el navegador.
 */
interface PropsCard extends HTMLAttributes<HTMLElement> {
  acento?: PosicionAcento
  acentoColor?: ColorAcento
  /** Refuerza el borde de toda la tarjeta con el color de acento. */
  destacada?: boolean
  /** `article`, `li`, `section`… cuando el contexto lo pida. Por defecto div. */
  as?: ElementType
  className?: string
  children: ReactNode
  id?: string
}

export function Card({
  acento = 'none',
  acentoColor = 'cian',
  destacada = false,
  as: Etiqueta = 'div',
  className = '',
  children,
  ...resto
}: PropsCard) {
  // La barra se pinta con ::before y no con un div extra para que no aparezca
  // un elemento vacio en el arbol de accesibilidad.
  const barra =
    acento === 'top'
      ? `relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:content-[''] ${BARRA_TOP[acentoColor]}`
      : acento === 'left'
        ? `relative overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:content-[''] ${BARRA_TOP[acentoColor]}`
        : ''

  return (
    <Etiqueta
      {...resto}
      className={[
        // `min-w-0` porque un hijo de rejilla no se encoge por debajo de su
        // ancho minimo de contenido salvo que se le diga: sin esto, una palabra
        // larga dentro de una tarjeta desborda toda la pagina en movil.
        'bg-card border rounded-[10px] min-w-0',
        destacada ? BORDE_DESTACADO[acentoColor] : 'border-border',
        barra,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Etiqueta>
  )
}
