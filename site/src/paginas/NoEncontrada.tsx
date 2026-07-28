import { Button } from '@/components/ui/Button'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Contenido de la 404 traducida. Lo usan dos sitios: la ruta `/es/404/` que
 * genera el manifiesto —la que sirven las reglas del final de `netlify.toml`— y
 * `app/[locale]/not-found.tsx`.
 *
 * La lluvia binaria animada de la 404 actual **no se porta**: usa
 * `Math.random()` durante el render, lo que produce marcado distinto en build y
 * en cliente y rompe la hidratacion. Se sustituye por un gradiente CSS, que
 * ademas es lo que pide el objetivo de LCP del brief.
 */
export function PaginaNoEncontrada({ locale }: { locale: Locale }) {
  const { notFound } = cargarMensajes(locale).common

  return (
    <main
      id="contenido"
      className="site-container relative flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center"
    >
      <div aria-hidden="true" className="resplandor-hero" />

      <p className="kicker text-cyan relative">{notFound.code}</p>

      <h1 className="heading-display relative">
        {notFound.title} <span className="text-cyan">{notFound.titleHighlight}</span>
      </h1>

      <p className="texto-cuerpo relative mx-auto text-center">{notFound.subtitle}</p>

      <div className="relative flex flex-wrap justify-center gap-3">
        <Button href={getLocalizedPath('home', locale)} variante="primario">
          {notFound.cta}
        </Button>
        <Button href={getLocalizedPath('contact', locale)} variante="ghost">
          {notFound.ctaSecondary}
        </Button>
      </div>
    </main>
  )
}
