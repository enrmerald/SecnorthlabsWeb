import { Card, type ColorAcento } from '@/components/ui/Card'

/**
 * Bloque de catalogo (mockups image11.png a image13.png). Lo usan las tres
 * paginas de catalogo: IT (C1-C7, 23 servicios), OT (B1-B5, 14 servicios) y GRC
 * (A1-A11, rejilla plana sin bloques).
 *
 * El codigo del bloque va en color de acento y en Space Mono, como en los
 * mockups, y no forma parte del titular: es una referencia del portafolio, y
 * meterla dentro del `<h2>` la haria parte del texto del encabezado.
 */
export interface ServicioCatalogo {
  title: string
  description: string
  code?: string
}

interface PropsCatalogBlock {
  code: string
  title: string
  description: string
  services: readonly ServicioCatalogo[]
  acentoColor?: ColorAcento
}

export function CatalogBlock({
  code,
  title,
  description,
  services,
  acentoColor = 'cian',
}: PropsCatalogBlock) {
  const color = acentoColor === 'verde' ? 'text-green' : 'text-cyan'

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span aria-hidden="true" className={`font-display text-sm font-bold ${color}`}>
            {code}
          </span>
          <h2 className="font-display text-lg font-bold sm:text-xl">{title}</h2>
        </div>
        <p className="texto-cuerpo text-sm">{description}</p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((servicio, indice) => (
          <ServicioCard
            key={`${indice}-${servicio.title}`}
            servicio={servicio}
            acentoColor={acentoColor}
          />
        ))}
      </ul>
    </section>
  )
}

/**
 * Tarjeta de un servicio suelto. Se exporta porque el catalogo GRC es una
 * rejilla plana de once servicios sin bloques que los agrupen.
 */
export function ServicioCard({
  servicio,
  acentoColor = 'cian',
}: {
  servicio: ServicioCatalogo
  acentoColor?: ColorAcento
}) {
  const color = acentoColor === 'verde' ? 'text-green' : 'text-cyan'

  return (
    <Card as="li" className="flex flex-col gap-2 p-5">
      {servicio.code && (
        <span aria-hidden="true" className={`font-display text-xs font-bold ${color}`}>
          {servicio.code}
        </span>
      )}
      <h3 className="font-display text-sm font-bold">{servicio.title}</h3>
      <p className="texto-cuerpo text-sm">{servicio.description}</p>
    </Card>
  )
}
