import { CatalogBlock, ServicioCard } from '@/components/blocks/CatalogBlock'
import { CtaBand } from '@/components/blocks/CtaBand'
import { HeroInterior } from '@/components/blocks/HeroInterior'
import type { ColorAcento } from '@/components/ui/Card'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Las tres paginas de catalogo (secciones 4.3, 4.4 y 4.6; mockups image11.png a
 * image13.png).
 *
 * IT y OT comparten forma exacta -bloques con codigo, titulo, descripcion y sus
 * servicios- y solo cambian el acento, el contenido y el destino de la CTA
 * secundaria. GRC es distinta: rejilla plana de once servicios sin bloques.
 */

/**
 * Forma comun de los dos catalogos por bloques.
 *
 * Se declara explicitamente en lugar de inferirla de `msspItCatalog`: los dos
 * namespaces tienen distinto numero de bloques, y atarlo al tipo de uno haria
 * que el otro dejara de encajar por una razon que no tiene nada que ver con su
 * estructura. Ademas, si manana el JSON pierde una clave, el error sale aqui.
 */
interface CatalogoPorBloquesMensajes {
  hero: {
    breadcrumb: readonly { label: string; routeId: string | null }[]
    title: string
    titleHighlight: string
    subtitle: string
  }
  categories: readonly {
    code: string
    title: string
    description: string
    services: readonly { title: string; description: string }[]
  }[]
  cta: { title: string; ctaPrimary: string; ctaSecondary: string }
}

function CatalogoPorBloques({
  locale,
  datos,
  acentoColor,
  ctaSecundariaHref,
}: {
  locale: Locale
  datos: CatalogoPorBloquesMensajes
  acentoColor: ColorAcento
  ctaSecundariaHref: string
}) {
  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={datos.hero.breadcrumb}
        title={datos.hero.title}
        titleHighlight={datos.hero.titleHighlight}
        subtitle={datos.hero.subtitle}
        acento={acentoColor === 'verde' ? 'verde' : 'cian'}
      />

      <div className="site-container flex flex-col gap-14 pb-16">
        {datos.categories.map((bloque) => (
          <CatalogBlock
            key={bloque.code}
            code={bloque.code}
            title={bloque.title}
            description={bloque.description}
            services={bloque.services}
            acentoColor={acentoColor}
          />
        ))}
      </div>

      <CtaBand
        title={datos.cta.title}
        primario={{ label: datos.cta.ctaPrimary, href: getLocalizedPath('contact', locale) }}
        secundario={{ label: datos.cta.ctaSecondary, href: ctaSecundariaHref }}
      />
    </main>
  )
}

/** Catalogo IT - 7 bloques C1-C7, 23 servicios. */
export function CatalogoIt({ locale }: { locale: Locale }) {
  return (
    <CatalogoPorBloques
      locale={locale}
      datos={cargarMensajes(locale).msspItCatalog}
      acentoColor="cian"
      // La secundaria del catalogo IT lleva a la calculadora del PBCG.
      ctaSecundariaHref={getLocalizedPath('calculator', locale)}
    />
  )
}

/** Catalogo OT - 5 bloques B1-B5, 14 servicios. Acento verde. */
export function CatalogoOt({ locale }: { locale: Locale }) {
  return (
    <CatalogoPorBloques
      locale={locale}
      datos={cargarMensajes(locale).msspOtCatalog}
      acentoColor="verde"
      // La secundaria del catalogo OT cruza al catalogo IT.
      ctaSecundariaHref={getLocalizedPath('msspIt', locale)}
    />
  )
}

/** Catalogo GRC - rejilla plana de 11 servicios A1-A11, mas la nota de I+D+i. */
export function CatalogoGrc({ locale }: { locale: Locale }) {
  const { grcCatalog } = cargarMensajes(locale)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={grcCatalog.hero.breadcrumb}
        title={grcCatalog.hero.title}
        titleHighlight={grcCatalog.hero.titleHighlight}
        subtitle={grcCatalog.hero.subtitle}
        acento="verde"
      />

      <div className="site-container flex flex-col gap-8 pb-16">
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grcCatalog.services.map((servicio) => (
            <ServicioCard key={servicio.code} servicio={servicio} acentoColor="verde" />
          ))}
        </ul>

        <p className="texto-cuerpo border-border border-t pt-6 text-sm">{grcCatalog.idiNote}</p>
      </div>

      <CtaBand
        title={grcCatalog.cta.title}
        primario={{ label: grcCatalog.cta.ctaPrimary, href: getLocalizedPath('contact', locale) }}
        secundario={{
          label: grcCatalog.cta.ctaSecondary,
          href: getLocalizedPath('grc', locale),
        }}
      />
    </main>
  )
}
