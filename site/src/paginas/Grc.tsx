import { CtaBand } from '@/components/blocks/CtaBand'
import { DiscoverBox } from '@/components/blocks/DiscoverBox'
import { HeroInterior } from '@/components/blocks/HeroInterior'
import { ModelBand } from '@/components/blocks/ModelBand'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tag } from '@/components/ui/Tag'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * GRC - `/es/soluciones/grc/` (seccion 4.5, mockup image5.png).
 *
 * > **Las cuatro tarjetas de marco se renderizan SIN enlace.** El brief marca
 * > cada marco (ENS, ISO 42001, ISO 27001, NIS2) como landing SEO propia en
 * > fase 2, y esas landings no existen (pendiente P10). La regla general del
 * > plan es que o el destino es real, o el elemento no se enlaza: mandarlas
 * > todas a `/contacto` es una experiencia enganosa. Por eso `cards[].cta` esta
 * > en los mensajes pero no se pinta como enlace todavia.
 *
 * > **Nota del brief:** no prometer plazos concretos de certificacion en el
 * > copy. El copy viene ya escrito y no se toca.
 */
export function Grc({ locale }: { locale: Locale }) {
  const { grc } = cargarMensajes(locale)
  const contacto = getLocalizedPath('contact', locale)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={grc.hero.breadcrumb}
        title={grc.hero.title}
        titleHighlight={grc.hero.titleHighlight}
        subtitle={grc.hero.subtitle}
        acento="verde"
      />

      {/* ── /01 Marcos principales ── */}
      <section className="site-container flex flex-col gap-8 pb-12">
        <SectionHeading
          kicker={grc.consulting.kicker}
          kickerPrefijo="/01"
          titulo={grc.consulting.title}
        />

        <ul className="grid gap-6 sm:grid-cols-2">
          {grc.consulting.cards.map((tarjeta) => (
            <Card key={tarjeta.title} as="li" className="flex flex-col gap-3 p-6">
              <div>
                <Tag acento="verde">{tarjeta.tag}</Tag>
              </div>
              <h3 className="font-display text-lg font-bold">{tarjeta.title}</h3>
              <p className="texto-cuerpo text-sm">{tarjeta.description}</p>
            </Card>
          ))}
        </ul>

        <DiscoverBox
          label={grc.consulting.discover.label}
          text={grc.consulting.discover.text}
          linkLabel={grc.consulting.discover.link}
          href={getLocalizedPath('grcCatalog', locale)}
          acentoColor="verde"
        />
      </section>

      {/* ── /02 I+D+i ── */}
      <section
        id={locale === 'es' ? 'idi' : 'rdi'}
        className="site-container flex scroll-mt-24 flex-col gap-8 pb-16"
      >
        <SectionHeading
          kicker={grc.idi.kicker}
          kickerPrefijo="/02"
          kickerColor="verde"
          titulo={grc.idi.title}
        />

        <ul className="grid gap-6 sm:grid-cols-2">
          {grc.idi.items.map((item) => (
            <Card key={item.tag} as="li" acento="left" acentoColor="verde" className="p-6">
              <p className="etiqueta text-green mb-3">{item.tag}</p>
              <h3 className="subtitle mb-2">{item.title}</h3>
              <p className="texto-cuerpo text-sm">{item.description}</p>
            </Card>
          ))}
        </ul>
      </section>

      <ModelBand label={grc.why.label} items={grc.why.items} />

      <CtaBand
        title={grc.cta.title}
        primario={{ label: grc.cta.ctaPrimary, href: contacto }}
        secundario={{ label: grc.cta.ctaSecondary, href: getLocalizedPath('mssp', locale) }}
      />
    </main>
  )
}
