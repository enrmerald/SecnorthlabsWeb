import { CtaBand } from '@/components/blocks/CtaBand'
import { HeroInterior } from '@/components/blocks/HeroInterior'
import { LicenseCard, StepList } from '@/components/blocks/Tarjetas'
import { TierCard } from '@/components/blocks/TierCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Kicker } from '@/components/ui/Kicker'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tag } from '@/components/ui/Tag'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Software y licencias — `/es/software/` (seccion 4.7, mockup image6.png).
 * Pagina marcada como **clave** en el brief.
 *
 * Dos restricciones que condicionan todo lo que se pinta aqui:
 *
 * 1. **Cero precios en toda la pagina.** El hueco lo ocupa `tiers.priceLabel`
 *    («Según alcance»). Textual del brief: «No publicar tarifas sin aprobación».
 * 2. **Solo el nombre en texto de Microsoft, Huntress, OPNsense, Fortinet y
 *    Ewala.** El brief exige usar sus logos «según sus normas de marca (no
 *    recolorear)» y esos ficheros no han llegado (pendiente P6). Descargarlos de
 *    Internet no es una opcion.
 */
export function Software({ locale }: { locale: Locale }) {
  const { software, common } = cargarMensajes(locale)
  const contacto = getLocalizedPath('contact', locale)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={software.hero.breadcrumb}
        title={software.hero.title}
        titleHighlight={software.hero.titleHighlight}
        subtitle={software.hero.subtitle}
      />

      {/* ── /01 SentryN3t destacado ── */}
      <section className="site-container flex flex-col gap-8 pb-12">
        <Card acento="left" acentoColor="verde" destacada className="p-6 sm:p-8">
          <Kicker prefijo="/01" color="verde">
            {software.sentry.kicker}
          </Kicker>

          <h2 className="section-title mt-4">{software.sentry.name}</h2>
          <p className="font-display text-cyan mt-2 text-sm">{software.sentry.tagline}</p>
          <p className="texto-cuerpo mt-4">{software.sentry.description}</p>

          <ul className="mt-6 flex flex-wrap gap-2.5">
            {software.sentry.chips.map((chip) => (
              <li key={chip}>
                <Tag acento="verde">{chip}</Tag>
              </li>
            ))}
          </ul>

          <div className="border-border mt-8 border-t pt-6">
            <h3 className="subtitle mb-3">{software.sentry.licenseModel.title}</h3>
            <ul className="texto-cuerpo grid gap-2 text-sm sm:grid-cols-2">
              {software.sentry.licenseModel.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button href={software.sentry.learnMoreUrl} externo variante="primario">
              {software.sentry.learnMore}
              <span className="sr-only"> ({common.a11y.externalLink})</span>
            </Button>

            <div className="text-text-dim flex flex-col gap-1 text-xs sm:text-right">
              {software.sentry.notes.map((nota) => (
                <p key={nota}>{nota}</p>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Tres niveles, sin ninguna cifra ── */}
        <ul className="grid gap-6 lg:grid-cols-3">
          {software.tiers.items.map((nivel) => (
            <TierCard
              key={nivel.name}
              name={nivel.name}
              description={nivel.description}
              features={nivel.features}
              priceLabel={software.tiers.priceLabel}
              cta={software.tiers.cta}
              ctaHref={contacto}
              recommended={nivel.recommended}
              recommendedLabel={software.tiers.recommendedLabel}
            />
          ))}
        </ul>
      </section>

      {/* ── /02 Licencias ── */}
      <section className="site-container flex flex-col gap-8 pb-12">
        <SectionHeading
          kicker={software.licenses.kicker}
          kickerPrefijo="/02"
          titulo={software.licenses.title}
          descripcion={software.licenses.subtitle}
        />

        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {software.licenses.cards.map((licencia) => (
            <LicenseCard
              key={licencia.name}
              name={licencia.name}
              subtitle={licencia.subtitle}
              description={licencia.description}
              footer={software.licenses.cardFooter}
            />
          ))}
        </ul>

        <div className="border-border flex flex-col gap-4 border-t pt-8">
          <p className="etiqueta text-text-dim">{software.others.label}</p>
          <ul className="flex flex-wrap gap-2.5">
            {software.others.items.map((otra) => (
              <li key={otra}>
                <Tag acento="neutro">{otra}</Tag>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="bg-panel border-border border-y">
        <div className="site-container seccion flex flex-col gap-8">
          <h2 className="section-title">{software.how.title}</h2>
          <StepList steps={software.how.steps} color="verde" />
        </div>
      </section>

      <CtaBand
        title={software.cta.title}
        subtitle={software.cta.subtitle}
        primario={{ label: software.cta.ctaPrimary, href: contacto }}
        secundario={{ label: software.cta.ctaSecondary, href: contacto }}
      />
    </main>
  )
}
