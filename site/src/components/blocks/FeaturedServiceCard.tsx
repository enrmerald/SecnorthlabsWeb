import { Button } from '@/components/ui/Button'
import { Card, type ColorAcento } from '@/components/ui/Card'
import { CheckList } from '@/components/ui/CheckList'

/**
 * Tarjeta de servicio destacado de la pagina MSSP (mockup image4.png): barra de
 * acento **izquierda**, borde reforzado del mismo color, etiqueta «servicio
 * principal», titulo, descripcion, lista de inclusiones en dos columnas y boton
 * arriba a la derecha.
 *
 * Cian en la seccion IT, verde en la OT.
 */
interface PropsFeaturedServiceCard {
  label: string
  title: string
  description: string
  includes: readonly string[]
  cta: { label: string; href: string }
  acentoColor: ColorAcento
}

export function FeaturedServiceCard({
  label,
  title,
  description,
  includes,
  cta,
  acentoColor,
}: PropsFeaturedServiceCard) {
  return (
    <Card acento="left" acentoColor={acentoColor} destacada className="p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <p className={`etiqueta ${acentoColor === 'verde' ? 'text-green' : 'text-cyan'}`}>
            {label}
          </p>
          <h3 className="font-display text-xl font-bold sm:text-2xl">{title}</h3>
          <p className="texto-cuerpo text-sm">{description}</p>
        </div>

        {/* En escritorio el boton va arriba a la derecha, como en el mockup; en
            movil cae debajo y ocupa el ancho, para no dejarlo a media caja. */}
        <div className="shrink-0">
          <Button
            href={cta.href}
            variante={acentoColor === 'verde' ? 'primario' : 'secundario'}
            ancho
            className="lg:w-auto"
          >
            {cta.label}
          </Button>
        </div>
      </div>

      <CheckList items={includes} columnas={2} className="mt-7" />
    </Card>
  )
}
