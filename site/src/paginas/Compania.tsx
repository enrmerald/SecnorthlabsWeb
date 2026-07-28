import { CtaBand } from '@/components/blocks/CtaBand'
import { HeroInterior } from '@/components/blocks/HeroInterior'
import { StatCard, TeamRoleCard } from '@/components/blocks/Tarjetas'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Compania — `/es/compania/` (seccion 4.10, mockup image9.png).
 *
 * Hero, fila de cuatro diferenciadores, `/01` por que existimos, `/02` como
 * trabajamos y `/03` equipo con ocho roles.
 *
 * > **No se publican cifras financieras del one-pager de inversion**, que es
 * > documento confidencial, y se muestran **roles, no nombres**.
 */
export function Compania({ locale }: { locale: Locale }) {
  const { company } = cargarMensajes(locale)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={company.hero.breadcrumb}
        title={company.hero.title}
        titleHighlight={company.hero.titleHighlight}
        subtitle={company.hero.subtitle}
      />

      <section className="site-container pb-12">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {company.stats.map((stat) => (
            <StatCard key={stat.title} title={stat.title} description={stat.description} />
          ))}
        </ul>
      </section>

      {/* ── /01 Por que existimos ──
          El titular de la seccion son las dos lineas destacadas del brief; no
          hay otra clave que sirva de H2, y dejar la seccion sin encabezado
          rompe la jerarquia que pide la Fase 9. */}
      <section className="site-container flex flex-col gap-6 pb-12">
        <SectionHeading
          kicker={company.mission.kicker}
          kickerPrefijo="/01"
          titulo={
            <>
              {company.mission.line1}{' '}
              <span className="text-cyan">{company.mission.line2}</span>
            </>
          }
        />
        <Card className="p-6 sm:p-8">
          <p className="texto-cuerpo">{company.mission.body}</p>
        </Card>
      </section>

      {/* ── /02 Como trabajamos ── */}
      <section className="site-container flex flex-col gap-8 pb-12">
        <SectionHeading kickerPrefijo="/02" titulo={company.values.kicker} />
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {company.values.items.map((valor) => (
            <Card key={valor.title} as="li" className="flex flex-col gap-2 p-6">
              <h3 className="subtitle">{valor.title}</h3>
              <p className="texto-cuerpo text-sm">{valor.description}</p>
            </Card>
          ))}
        </ul>
      </section>

      {/* ── /03 Equipo ── */}
      <section className="site-container flex flex-col gap-8 pb-16">
        <SectionHeading
          kicker={company.team.kicker}
          kickerPrefijo="/03"
          kickerColor="verde"
          titulo={company.team.title}
        />
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {company.team.roles.map((rol) => (
            <TeamRoleCard key={rol.title} title={rol.title} description={rol.description} />
          ))}
        </ul>
      </section>

      <CtaBand
        title={company.cta.title}
        primario={{ label: company.cta.ctaPrimary, href: getLocalizedPath('contact', locale) }}
      />
    </main>
  )
}
