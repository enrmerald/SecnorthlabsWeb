import { CtaBand } from '@/components/blocks/CtaBand'
import { DiscoverBox } from '@/components/blocks/DiscoverBox'
import { FeaturedServiceCard } from '@/components/blocks/FeaturedServiceCard'
import { HeroInterior } from '@/components/blocks/HeroInterior'
import { ModelBand } from '@/components/blocks/ModelBand'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * MSSP - `/es/soluciones/mssp/` (seccion 4.2, mockup image4.png).
 *
 * Dos secciones simetricas con distinto acento: `/01` IT en cian y `/02` OT en
 * verde, las dos con CTA a contacto mientras la calculadora esta retirada. Los
 * `id` de las secciones son los destinos del desplegable «Soluciones» de la
 * navegacion.
 *
 * > El JSON dice `cta.ctaSecondary: "Ver software"` y el mockup pinta «Ver
 * > licencias». **Manda el JSON**, que es el entregable de copy.
 */
export function Mssp({ locale }: { locale: Locale }) {
  const { mssp } = cargarMensajes(locale)

  const contacto = getLocalizedPath('contact', locale)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={mssp.hero.breadcrumb}
        title={mssp.hero.title}
        titleHighlight={mssp.hero.titleHighlight}
        subtitle={mssp.hero.subtitle}
      />

      {/* ── /01 · IT ── */}
      <section id="it" className="site-container flex scroll-mt-24 flex-col gap-6 pb-12">
        <SectionHeading kicker={mssp.it.kicker} kickerPrefijo="/01" titulo={mssp.it.title} />

        <FeaturedServiceCard
          label={mssp.it.featured.label}
          title={mssp.it.featured.title}
          description={mssp.it.featured.description}
          includes={mssp.it.featured.includes}
          // Iba a la calculadora; con esa ruta retirada (`CALCULADORA_ACTIVA`) el
          // presupuesto se pide por el formulario, y el texto del boton lo dice.
          cta={{ label: mssp.it.featured.cta, href: contacto }}
          acentoColor="cian"
        />

        <DiscoverBox
          label={mssp.it.discover.label}
          text={mssp.it.discover.text}
          linkLabel={mssp.it.discover.link}
          href={getLocalizedPath('msspIt', locale)}
          acentoColor="cian"
        />
      </section>

      {/* ── /02 · OT ── */}
      <section id="ot" className="site-container flex scroll-mt-24 flex-col gap-6 pb-16">
        <SectionHeading
          kicker={mssp.ot.kicker}
          kickerPrefijo="/02"
          kickerColor="verde"
          titulo={mssp.ot.title}
        />

        <FeaturedServiceCard
          label={mssp.ot.featured.label}
          title={mssp.ot.featured.title}
          description={mssp.ot.featured.description}
          includes={mssp.ot.featured.includes}
          cta={{ label: mssp.ot.featured.cta, href: contacto }}
          acentoColor="verde"
        />

        <DiscoverBox
          label={mssp.ot.discover.label}
          text={mssp.ot.discover.text}
          linkLabel={mssp.ot.discover.link}
          href={getLocalizedPath('msspOt', locale)}
          acentoColor="verde"
        />
      </section>

      <ModelBand label={mssp.model.label} title={mssp.model.title} items={mssp.model.items} />

      <CtaBand
        title={mssp.cta.title}
        primario={{ label: mssp.cta.ctaPrimary, href: contacto }}
        secundario={{ label: mssp.cta.ctaSecondary, href: getLocalizedPath('software', locale) }}
      />
    </main>
  )
}
