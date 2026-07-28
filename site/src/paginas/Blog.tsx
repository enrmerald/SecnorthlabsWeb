import { HeroInterior } from '@/components/blocks/HeroInterior'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tag } from '@/components/ui/Tag'
import type { Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import { FormularioNewsletter } from '@/components/forms/FormularioNewsletter'

/**
 * Blog — `/es/blog/` (seccion 4.9, mockup image8.png).
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
 * La pagina es indexable porque lo que contiene —la linea editorial y el alta
 * en la newsletter— es real. **El bloque de newsletter si funciona**: captar
 * suscriptores antes de tener articulos es legitimo y util.
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

      <section className="bg-panel border-border border-y">
        <div className="site-container seccion">
          <Card className="mx-auto max-w-3xl p-6 sm:p-8">
            <h2 className="section-title">{blog.newsletter.title}</h2>
            <p className="texto-cuerpo mt-3">{blog.newsletter.subtitle}</p>

            <FormularioNewsletter
              textos={{
                placeholder: blog.newsletter.placeholder,
                cta: blog.newsletter.cta,
                privacyNote: blog.newsletter.privacyNote,
                success: blog.newsletter.success,
                error: blog.newsletter.error,
              }}
              locale={locale}
            />
          </Card>
        </div>
      </section>
    </main>
  )
}
