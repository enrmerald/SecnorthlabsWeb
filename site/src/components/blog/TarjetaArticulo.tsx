import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import type { Locale } from '@/config/routes'
import { getBlogPostPath } from '@/config/routes'
import { formatearFecha } from '@/lib/blog/datos'
import type { ArticuloIndice } from '@/lib/blog/esquema'
import { ImagenArticulo } from './ImagenArticulo'

/**
 * Tarjeta de articulo del listado (mockup image8.png).
 *
 * Toda la tarjeta es un enlace, pero el elemento enlazado es el titular y el
 * resto se cubre con un pseudoelemento: asi el nombre accesible del enlace es el
 * titulo del articulo y no un parrafo de trescientos caracteres, que es lo que
 * pasa al envolver la tarjeta entera en un `<a>`.
 *
 * `data-categoria` es lo que usa el filtro del listado. El filtrado ocurre en
 * CSS, de modo que las 26 tarjetas estan en el HTML -las ve el rastreador- y el
 * componente de cliente solo cambia un atributo.
 */
interface PropsTarjetaArticulo {
  articulo: ArticuloIndice
  locale: Locale
  etiquetaCategoria: string
  sufijoLectura: string
  /** La primera fila del listado no va diferida: entra en el LCP. */
  prioritaria?: boolean
}

export function TarjetaArticulo({
  articulo,
  locale,
  etiquetaCategoria,
  sufijoLectura,
  prioritaria = false,
}: PropsTarjetaArticulo) {
  const href = getBlogPostPath(locale, articulo.slug)

  return (
    <Card
      as="li"
      data-categoria={articulo.category}
      // El realce del hover es de color y de fondo, no de sombra: el sistema de
      // diseno no usa sombras, y una tarjeta que se eleva sobre un fondo de
      // #0D0F11 no se percibe. La regla global de `prefers-reduced-motion` ya
      // desactiva la transicion para quien pide menos movimiento.
      className="group relative flex flex-col overflow-hidden transition-colors hover:border-cyan/40 hover:bg-panel focus-within:border-cyan/60"
    >
      {articulo.image && (
        <div className="border-border aspect-[16/9] overflow-hidden border-b">
          {/* Acercamiento minimo (2%) al pasar por encima. Suficiente para que la
              tarjeta responda, poco para que se note como efecto. */}
          <div className="h-full transition-transform duration-300 group-hover:scale-[1.02]">
            <ImagenArticulo
              nombre={articulo.image}
              alt={articulo.imageAlt}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              prioritaria={prioritaria}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Tag acento="cian">{etiquetaCategoria}</Tag>
          <span className="text-text-dim font-display text-xs">
            {articulo.readingMinutes} {sufijoLectura}
          </span>
        </div>

        <h3 className="font-display text-base leading-snug font-bold">
          <Link
            href={href}
            className="focus-visible:outline-cyan group-hover:text-cyan transition-colors after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {articulo.title}
          </Link>
        </h3>

        <p className="texto-cuerpo line-clamp-3 text-sm">{articulo.description}</p>

        <time
          dateTime={articulo.date}
          className="text-text-dim border-border mt-auto border-t pt-4 text-xs"
        >
          {formatearFecha(articulo.date, locale)}
        </time>
      </div>
    </Card>
  )
}
