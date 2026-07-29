import { HeroInterior } from '@/components/blocks/HeroInterior'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tag } from '@/components/ui/Tag'
import type { Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Blog - `/es/blog/` (seccion 4.9, mockup image8.png).
 *
 * **Opcion A del plan: pagina «proximamente», indexable.**
 *
 * No hay CMS ni contenido real todavia (pendiente P8), y **no se publica un
 * blog ficticio**. La primera version del plan proponia maquetar los seis
 * articulos de ejemplo del brief y ocultar solo el aviso de que eran
 * marcadores. Eso deja publicados seis titulares inventados con tiempos de
 * lectura inventados, en tarjetas que no llevan a ninguna parte: para una
 * consultora que vende criterio tecnico es un dano de credibilidad mayor que no
 * tener blog.
 *
 * El bloque de newsletter se retiro por decision de Direccion del 28/07/2026.
 *
 * ⚠️ Con eso, la justificacion de que /blog fuese indexable se queda corta: era
 * que «el bloque de newsletter si es real y funcional». Ahora la pagina solo
 * anuncia la linea editorial. Se mantiene indexable porque los 26 articulos
 * migrados llegan en el paso siguiente; si esa migracion se retrasara, habria
 * que pasar la ruta a noindex o desactivarla.
 */
export function Blog({ locale }: { locale: Locale }) {
  const { blog } = cargarMensajes(locale)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={blog.hero.breadcrumb}
        title={blog.hero.title}
        titleHighlight={blog.hero.titleHighlight}
        subtitle={blog.hero.subtitle}
      />

      <section className="site-container flex flex-col gap-8 pb-14">
        <SectionHeading
          kicker={blog.soon.kicker}
          kickerPrefijo=">_"
          titulo={blog.soon.title}
          descripcion={blog.soon.body}
        />

        <div className="flex flex-col gap-4">
          <p className="etiqueta text-text-dim">{blog.soon.topicsLabel}</p>
          <ul className="flex flex-wrap gap-2.5">
            {blog.soon.topics.map((tema) => (
              <li key={tema}>
                <Tag acento="cian">{tema}</Tag>
              </li>
            ))}
          </ul>
        </div>

        <p className="texto-cuerpo border-border border-t pt-6 text-sm">{blog.soon.note}</p>
      </section>

    </main>
  )
}
