import { CtaBand } from '@/components/blocks/CtaBand'
import { HeroInterior } from '@/components/blocks/HeroInterior'
import { SectorCard } from '@/components/blocks/Tarjetas'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Sectores - `/es/sectores/` (seccion 4.8, mockup image7.png).
 *
 * Siete sectores en rejilla de tres columnas en escritorio y una en movil, con
 * su driver regulatorio como etiqueta, y la nota sobre el RGPD transversal.
 *
 * > **Las tarjetas no llevan enlace.** Cada sector es una landing SEO potencial
 * > en fase 2 (pendiente P10) y hasta que existan no se enlaza a ninguna parte.
 * > **No se inventan cifras ni casos de cliente**, como pide el brief.
 */
export function Sectores({ locale }: { locale: Locale }) {
  const { sectors } = cargarMensajes(locale)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={sectors.hero.breadcrumb}
        title={sectors.hero.title}
        titleHighlight={sectors.hero.titleHighlight}
        subtitle={sectors.hero.subtitle}
      />

      <section className="site-container flex flex-col gap-8 pb-16">
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sectors.items.map((sector) => (
            <SectorCard
              key={sector.title}
              title={sector.title}
              description={sector.description}
              tag={sector.tag}
            />
          ))}
        </ul>

        <p className="texto-cuerpo border-border border-t pt-6 text-sm">{sectors.note}</p>
      </section>

      <CtaBand
        title={sectors.cta.title}
        subtitle={sectors.cta.subtitle}
        primario={{ label: sectors.cta.ctaPrimary, href: getLocalizedPath('contact', locale) }}
      />
    </main>
  )
}
