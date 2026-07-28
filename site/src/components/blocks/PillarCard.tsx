import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, type ColorAcento } from '@/components/ui/Card'

/**
 * Tarjeta de pilar de la Home (mockup image3.png): barra de acento **superior**,
 * etiqueta, titulo, descripcion y enlace «Ver servicios →».
 *
 * Cian para los dos MSSP, verde para GRC e I+D+i, como en el mockup.
 */
interface PropsPillarCard {
  tag: string
  title: string
  description: string
  cta: string
  href: string
  acentoColor: ColorAcento
}

export function PillarCard({ tag, title, description, cta, href, acentoColor }: PropsPillarCard) {
  return (
    <Card as="li" acento="top" acentoColor={acentoColor} className="flex flex-col p-6">
      <p className={`etiqueta mb-4 ${acentoColor === 'verde' ? 'text-green' : 'text-cyan'}`}>
        {tag}
      </p>

      <h3 className="subtitle mb-3">{title}</h3>
      <p className="texto-cuerpo mb-6 text-sm">{description}</p>

      {/* `mt-auto` alinea el enlace abajo aunque las descripciones tengan
          distinta longitud: en el mockup los cuatro quedan a la misma altura. */}
      <Link
        href={href}
        className={`font-display mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-bold transition-colors ${
          acentoColor === 'verde' ? 'text-green hover:text-green/80' : 'text-cyan hover:text-cyan/80'
        }`}
      >
        {cta}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </Card>
  )
}
