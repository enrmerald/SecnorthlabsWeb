import Link from 'next/link'
import type { TramoBreadcrumb } from '@/lib/tipos'

/**
 * Migas de pan de las paginas interiores (seccion 3.4).
 *
 * Recibe el array estructurado de la seccion 2.4. **No se parte ninguna cadena
 * por `/`.** El ultimo tramo no se enlaza y lleva `aria-current="page"`.
 */
interface PropsBreadcrumbs {
  tramos: readonly TramoBreadcrumb[]
  /** Texto de `aria-label` del `<nav>`, traducido. */
  etiqueta: string
  className?: string
}

export function Breadcrumbs({ tramos, etiqueta, className = '' }: PropsBreadcrumbs) {
  if (tramos.length === 0) return null

  return (
    <nav aria-label={etiqueta} className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-dim">
        {tramos.map((tramo, indice) => {
          const esUltimo = indice === tramos.length - 1

          return (
            <li key={`${tramo.label}-${indice}`} className="flex items-center gap-2">
              {indice > 0 && (
                <span aria-hidden="true" className="text-border">
                  /
                </span>
              )}

              {tramo.href && !esUltimo ? (
                <Link href={tramo.href} className="hover:text-cyan transition-colors">
                  {tramo.label}
                </Link>
              ) : (
                <span aria-current={esUltimo ? 'page' : undefined} className="text-text">
                  {tramo.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
