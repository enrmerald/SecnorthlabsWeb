import { CoveragePanel } from '@/components/blocks/CoveragePanel'
import { CtaBand } from '@/components/blocks/CtaBand'
import { FrameworkBand } from '@/components/blocks/FrameworkBand'
import { PillarCard } from '@/components/blocks/PillarCard'
import { SentryBand } from '@/components/blocks/SentryBand'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tag } from '@/components/ui/Tag'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Home - `/es/` y `/en/` (seccion 4.1, mockup image3.png).
 *
 * Componente de build entero: no lleva ni una linea de JavaScript propio.
 *
 * Las cifras que muestra el hero de la web actual (100 %, 24/7, AES-256)
 * **desaparecen**: no estan en el brief y son afirmaciones sin respaldo
 * (seccion 5).
 */
export function Home({ locale }: { locale: Locale }) {
  const mensajes = cargarMensajes(locale)
  const { home, common } = mensajes

  const contacto = getLocalizedPath('contact', locale)
  const calculadora = getLocalizedPath('calculator', locale)

  // Destinos de los cuatro pilares, en el orden en que estan en los mensajes:
  // MSSP IT, MSSP OT, GRC e I+D+i. El acento sigue al mockup: cian los dos MSSP,
  // verde GRC e I+D+i.
  const pilares = [
    { href: getLocalizedPath('msspIt', locale), acento: 'cian' as const },
    { href: getLocalizedPath('msspOt', locale), acento: 'cian' as const },
    { href: getLocalizedPath('grc', locale), acento: 'verde' as const },
    { href: getLocalizedPath('grc', locale, 'idi'), acento: 'verde' as const },
  ]

  return (
    <main id="contenido">
      {/* ── Hero a dos columnas ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="resplandor-hero" />

        <div className="site-container relative grid gap-10 py-12 md:py-16 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="flex flex-col gap-6">
            <ul className="flex flex-wrap gap-2.5">
              {home.hero.tags.map((etiqueta) => (
                <li key={etiqueta}>
                  <Tag acento="cian">{etiqueta}</Tag>
                </li>
              ))}
            </ul>

            <h1 className="heading-display">
              {home.hero.title} <span className="text-cyan">{home.hero.titleHighlight}</span>
            </h1>

            <p className="texto-cuerpo">{home.hero.subtitle}</p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href={contacto} variante="primario" tamano="lg">
                {home.hero.ctaPrimary}
              </Button>
              <Button href={contacto} variante="ghost" tamano="lg">
                {home.hero.ctaSecondary}
              </Button>
            </div>
          </div>

          {/* En movil el panel baja debajo del texto: es el orden del DOM, asi
              que tambien es el orden de lectura. */}
          <CoveragePanel
            header={home.panel.header}
            status={home.panel.status}
            title={home.panel.title}
            rows={home.panel.rows}
            footer={home.panel.footer}
          />
        </div>
      </section>

      <FrameworkBand label={common.frameworksLabel} frameworks={common.frameworks} />

      {/* ── /01 Que hacemos ── */}
      <section className="site-container seccion flex flex-col gap-9">
        <SectionHeading
          kicker={home.pillars.kicker}
          kickerPrefijo="/01"
          titulo={home.pillars.title}
        />

        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {home.pillars.items.map((pilar, indice) => {
            const destino = pilares[indice]
            if (!destino) return null
            return (
              <PillarCard
                key={pilar.title}
                tag={pilar.tag}
                title={pilar.title}
                description={pilar.description}
                cta={pilar.cta}
                href={destino.href}
                acentoColor={destino.acento}
              />
            )
          })}
        </ul>
      </section>

      <SentryBand
        kicker={home.sentry.kicker}
        title={home.sentry.title}
        description={home.sentry.description}
        chips={home.sentry.chips}
        cta={home.sentry.cta}
        ctaUrl={home.sentry.ctaUrl}
        note={home.sentry.note}
        a11yExternal={common.a11y.externalLink}
      />

      <CtaBand
        title={home.ctaBand.title}
        titleHighlight={home.ctaBand.titleHighlight}
        subtitle={home.ctaBand.subtitle}
        primario={{ label: home.ctaBand.ctaPrimary, href: calculadora }}
        secundario={{ label: home.ctaBand.ctaSecondary, href: contacto }}
      />
    </main>
  )
}
