import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, type ColorAcento } from '@/components/ui/Card'

/**
 * Cajon «Descubre mas» (mockup image4.png): etiqueta, resumen de lo que hay al
 * otro lado y enlace al catalogo completo. Se usa en MSSP (IT y OT) y en GRC.
 *
 * Toda la tarjeta es el enlace, con el area pulsable extendida por `::after`:
 * en movil, un enlace de texto de dieciseis pixeles dentro de una caja grande
 * es un objetivo tactil malo.
 */
interface PropsDiscoverBox {
  label: string
  text: string
  linkLabel: string
  href: string
  acentoColor?: ColorAcento
}

export function DiscoverBox({
  label,
  text,
  linkLabel,
  href,
  acentoColor = 'cian',
}: PropsDiscoverBox) {
  const color = acentoColor === 'verde' ? 'text-green' : 'text-cyan'

  return (
    <Card className="hover:border-text-dim relative p-6 transition-colors">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <p className={`etiqueta ${color}`}>{label}</p>
          {/* `max-w-none` anula la medida de 68ch de `texto-cuerpo`. Esa medida
              existe para que un parrafo largo no se lea en lineas de 150
              caracteres, y en un cajon de una sola frase hace lo contrario de lo
              que pretende: parte el texto en dos lineas dejando media caja
              vacia a la derecha. */}
          <p className="texto-cuerpo max-w-none text-sm">{text}</p>
        </div>

        <Link
          href={href}
          className={`font-display inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold ${color} after:absolute after:inset-0 after:content-['']`}
        >
          {linkLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </Card>
  )
}
