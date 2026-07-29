import { CtaBand } from '@/components/blocks/CtaBand'
import { HeroInterior } from '@/components/blocks/HeroInterior'
import { LicenseCard, StepList } from '@/components/blocks/Tarjetas'
import { TierCard } from '@/components/blocks/TierCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Kicker } from '@/components/ui/Kicker'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { LogoMarca } from '@/components/ui/LogoMarca'
import { Tag } from '@/components/ui/Tag'
import { LOGOS_LICENCIAS, LOGO_EWALA, LOGO_SENTRYNET } from '@/config/logos'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Software y licencias - `/es/software/` (seccion 4.7, mockup image6.png).
 * Pagina marcada como **clave** en el brief.
 *
 * Dos restricciones que condicionan todo lo que se pinta aqui:
 *
 * 1. **Cero precios en toda la pagina.** El hueco lo ocupa `tiers.priceLabel`
 *    («Según alcance»). Textual del brief: «No publicar tarifas sin aprobación».
 * 2. **Los logos se usan sin recolorear.** El brief lo exige. Como el sitio es
 *    oscuro y cada marca entrega su version positiva, los cuatro van dentro de
 *    una capsula clara: asi ninguno se toca y los cuatro quedan igual. El motivo
 *    completo esta en `config/logos.ts`. Cierra el pendiente P6.
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

          {/* Aqui el logotipo SI acompana al titular, al contrario que en la
              banda de la Home: ese H2 es una frase que repite el nombre
              («SentryN3t - NDR con IA…») y este es el nombre a secas, asi que el
              logotipo lo ilustra en lugar de duplicarlo. El H2 sigue siendo
              texto, que es lo que leen los rastreadores. */}
          {/* El logotipo va DENTRO del h2, no al lado. El encabezado de esta
              seccion es el nombre del producto, y el logotipo es ese nombre
              dibujado: su `alt` aporta el texto, asi que un lector de pantalla
              anuncia «SentryN3t» como encabezado una sola vez. Ponerlo fuera con
              un h2 en sr-only lo diria dos veces. */}
          <h2 className="mt-4">
            <LogoMarca logo={LOGO_SENTRYNET} alto={34} ancho={220} />
          </h2>
          <p className="font-display text-cyan mt-3 text-sm">{software.sentry.tagline}</p>
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

            <div className="flex flex-col gap-2 sm:items-end">
              <div className="text-text-dim flex flex-col gap-1 text-xs sm:text-right">
                {software.sentry.notes.map((nota) => (
                  <p key={nota}>{nota}</p>
                ))}
              </div>
              <LogoMarca logo={LOGO_EWALA} alto={16} ancho={90} />
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
              // La clave es el `name` del fichero de mensajes. Si Marketing
              // renombra una tarjeta, se queda sin logo, no sin tarjeta.
              logo={LOGOS_LICENCIAS[licencia.name]}
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
