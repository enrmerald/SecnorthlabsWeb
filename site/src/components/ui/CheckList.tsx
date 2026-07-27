import { Check } from 'lucide-react'

/**
 * Lista con marca de verificacion verde. Aparece en las tarjetas de servicio
 * destacado del MSSP y en los niveles de SentryN3t (mockups image2.png,
 * image4.png y image6.png).
 *
 * El icono se importa individualmente, nunca con `import * as icons`: es lo que
 * mantiene el presupuesto de JavaScript de la seccion 12.6.
 */
interface PropsCheckList {
  items: readonly string[]
  /** Dos columnas en escritorio. El brief lo pide en la tarjeta destacada. */
  columnas?: 1 | 2
  className?: string
}

export function CheckList({ items, columnas = 1, className = '' }: PropsCheckList) {
  return (
    <ul
      className={[
        'grid gap-x-6 gap-y-2.5',
        columnas === 2 ? 'sm:grid-cols-2' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Clave compuesta: dos items pueden repetir texto entre idiomas o dentro
          de un catalogo, y una clave duplicada hace que React reutilice el nodo
          equivocado al reordenar. */}
      {items.map((item, indice) => (
        <li key={`${indice}-${item}`} className="flex items-start gap-2.5 text-sm leading-relaxed">
          <Check
            aria-hidden="true"
            className="text-green mt-1 size-4 shrink-0"
            strokeWidth={2.5}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
