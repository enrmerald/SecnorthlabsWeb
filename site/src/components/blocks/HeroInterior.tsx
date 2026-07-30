import { JsonLd } from '@/components/seo/JsonLd'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import type { Locale } from '@/config/routes'
import { resolverMigas, type TramoMensaje } from '@/lib/breadcrumbs'
import { migasJsonLd } from '@/lib/jsonld'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Hero de las paginas interiores: migas de pan, H1 a dos colores y subtitulo
 * (mockups image4.png a image10.png).
 *
 * **Un solo `<h1>` por pagina**, y su contenido es `title + titleHighlight`
 * (seccion 7.6). El resplandor es un gradiente CSS, no una imagen: es lo que
 * mantiene el LCP por debajo de 2,5 s en movil real.
 */
interface PropsHeroInterior {
  locale: Locale
  breadcrumb: readonly TramoMensaje[]
  title: string
  titleHighlight: string
  subtitle: string
  /** Color del segundo tramo del titular. Cian por defecto, como el brief. */
  acento?: 'cian' | 'verde'
}

export function HeroInterior({
  locale,
  breadcrumb,
  title,
  titleHighlight,
  subtitle,
  acento = 'cian',
}: PropsHeroInterior) {
  const { a11y } = cargarMensajes(locale).common
  const migas = resolverMigas(breadcrumb, locale)

  return (
    <section className="relative overflow-hidden pt-10 pb-12 md:pt-14 md:pb-16">
      <div aria-hidden="true" className="resplandor-hero" />

      {/* El BreadcrumbList sale de las mismas migas que se pintan, y se emite
          aqui para que lo tengan todas las paginas interiores sin repetirlo en
          cada una. */}
      <JsonLd datos={migasJsonLd(migas)} />

      <div className="site-container relative flex flex-col gap-5">
        <Breadcrumbs tramos={migas} etiqueta={a11y.breadcrumb} />

        {/* Se limita la medida para que el titular rompa en dos lineas como en
            los mockups. Sin el limite, en 1440px cabe entero en una y pierde el
            ritmo de la composicion. */}
        <h1 className="heading-display max-w-[22ch]">
          {title}{' '}
          <span className={acento === 'verde' ? 'text-green' : 'text-cyan'}>{titleHighlight}</span>
        </h1>

        <p className="texto-cuerpo">{subtitle}</p>
      </div>
    </section>
  )
}
