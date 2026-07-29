import Link from 'next/link'
import { ImagenArticulo } from '@/components/blog/ImagenArticulo'
import { CtaBand } from '@/components/blocks/CtaBand'
import { Button } from '@/components/ui/Button'
import { JsonLd } from '@/components/seo/JsonLd'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tag } from '@/components/ui/Tag'
import { getBlogPostPath, getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import { formatearFecha, listarArticulos } from '@/lib/blog/datos'
import type { Articulo as ArticuloCompilado } from '@/lib/blog/esquema'
import { resolverMigas } from '@/lib/breadcrumbs'
import { urlAbsoluta } from '@/lib/empresa'
import { articuloJsonLd, migasJsonLd } from '@/lib/jsonld'

/**
 * Detalle de un articulo - `/es/blog/<slug>/`.
 *
 * El cuerpo llega como HTML ya convertido en build por `content:build`, y se
 * inserta con `dangerouslySetInnerHTML`. Es seguro y conviene decir por que, con
 * ese nombre de API:
 *
 * - El origen no es entrada de usuario: son ficheros Markdown del propio
 *   repositorio, que pasan por revision de codigo como cualquier otro cambio.
 * - El conversor corre con `html: false`, asi que el HTML crudo que hubiera en un
 *   `.md` se escapa en lugar de inyectarse. Lo unico que puede aparecer aqui es
 *   el marcado que genera markdown-it.
 * - La conversion ocurre en build. En produccion no hay nada que convertir ni
 *   ninguna cadena que llegue de fuera.
 *
 * La alternativa -convertir Markdown en el navegador- habria enviado el conversor
 * al cliente y habria movido el problema, no resuelto.
 */
export function Articulo({
  locale,
  articulo,
}: {
  locale: Locale
  articulo: ArticuloCompilado
}) {
  const mensajes = cargarMensajes(locale)
  const { blog, common } = mensajes

  const migas = [
    ...resolverMigas(blog.article.breadcrumb, locale),
    { label: articulo.title, href: null },
  ]

  // Relacionados: misma categoria, los tres siguientes mas recientes. Si la
  // categoria no da para tres, se completa con los mas recientes de cualquier
  // tema antes que dejar el bloque a medias.
  const otros = listarArticulos(locale).filter((otro) => otro.slug !== articulo.slug)
  const relacionados = [
    ...otros.filter((otro) => otro.category === articulo.category),
    ...otros.filter((otro) => otro.category !== articulo.category),
  ].slice(0, 3)

  return (
    <main id="contenido">
      <article>
        <JsonLd
          datos={articuloJsonLd(articulo, locale, urlAbsoluta(getBlogPostPath(locale, articulo.slug)))}
        />
        <JsonLd datos={migasJsonLd(migas)} />

        <header className="relative overflow-hidden pt-10 pb-10 md:pt-14">
          <div aria-hidden="true" className="resplandor-hero" />

          <div className="site-container relative flex flex-col gap-5">
            <Breadcrumbs tramos={migas} etiqueta={common.a11y.breadcrumb} />

            {/* Volver al listado, arriba y no solo al final del articulo.
                Las migas ya llevan al blog, pero son de 12px y estan pensadas
                para situarse, no para pulsarse: quien acaba de entrar desde una
                busqueda y quiere ver que mas hay necesita un objetivo de verdad.
                El de abajo se queda, porque quien termina de leer esta a 3.000
                palabras de este. */}
            <p>
              <Link
                href={getLocalizedPath('blog', locale)}
                className="font-display text-text-dim hover:border-cyan hover:text-cyan focus-visible:outline-cyan border-border inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-bold tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">←</span>
                {blog.article.back}
              </Link>
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Tag acento="cian">{blog.categories[articulo.category]}</Tag>
              <span className="text-text-dim font-display text-xs">
                {articulo.readingMinutes} {blog.list.readingSuffix}
              </span>
            </div>

            {/* Un solo h1 por pagina, y aqui es el titulo del articulo. */}
            <h1 className="font-display max-w-[34ch] text-3xl leading-tight font-bold md:text-4xl">
              {articulo.title}
            </h1>

            {articulo.subtitle && (
              <p className="texto-cuerpo text-lg">{articulo.subtitle}</p>
            )}

            <div className="border-border text-text-dim font-display flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-4 text-xs">
              <span>
                {blog.article.authorLabel} {articulo.author}
              </span>
              <span aria-hidden="true" className="text-border">
                ·
              </span>
              {/* dateTime en ISO: es lo que leen los rastreadores; el texto
                  visible va formateado en el idioma de la pagina. */}
              <time dateTime={articulo.date}>{formatearFecha(articulo.date, locale)}</time>
            </div>
          </div>
        </header>

        {articulo.image && (
          <div className="site-container pb-10">
            <div className="border-border aspect-[16/9] overflow-hidden rounded-[10px] border">
              <ImagenArticulo
                nombre={articulo.image}
                alt={articulo.imageAlt}
                sizes="(min-width: 1024px) 1024px, 100vw"
                prioritaria
              />
            </div>
          </div>
        )}

        {/* Dos columnas en escritorio: el cuerpo crece con la pantalla -la medida
            de `.prosa` sube de 68ch a 78ch, y con ella el tamano de letra- y el
            hueco de la derecha lo ocupa el indice. Por debajo de 1024px el indice
            desaparece: en movil, una lista de secciones antes del texto solo
            retrasa el articulo.

            La columna del indice se estrecha (14rem) y el hueco se abre en xl:
            asi el ancho que se recupera va al texto, que es lo que se lee. */}
        <div className="site-container grid gap-10 pb-14 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            {/* El cuerpo va en tarjeta y no directamente sobre el fondo. Con 3.000
                palabras sobre `--color-bg` el texto se lee bien -el contraste es
                de 17:1- pero flota: no hay nada que diga donde empieza y acaba el
                articulo. La tarjeta le da ese limite, y ademas separa el cuerpo
                del indice sin necesidad de una linea divisoria. */}
            <Card as="div" className="p-5 sm:p-8 lg:p-10">
              <div className="prosa mx-auto" dangerouslySetInnerHTML={{ __html: articulo.html }} />

              {articulo.tags.length > 0 && (
                <div className="border-border mx-auto mt-12 flex max-w-[78ch] flex-col gap-3 border-t pt-6">
                  <p className="etiqueta text-text-dim">{blog.article.tagsLabel}</p>
                  <ul className="flex flex-wrap gap-2.5">
                    {articulo.tags.map((tag) => (
                      <li key={tag}>
                        <Tag acento="neutro" sinPunto>
                          {tag}
                        </Tag>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <p className="mt-8">
              <Button href={getLocalizedPath('blog', locale)} variante="ghost">
                <span aria-hidden="true">←</span>
                {blog.article.backToList}
              </Button>
            </p>
          </div>

          {articulo.indice.length > 0 && (
            // `sticky` acompana la lectura sin JavaScript. El desplazamiento
            // suave no se fuerza aqui: la regla global de
            // `prefers-reduced-motion` manda, y el salto instantaneo es lo
            // correcto para quien pide menos animacion.
            <nav
              aria-labelledby="indice-articulo"
              className="hidden lg:block lg:sticky lg:top-28 lg:self-start"
            >
              <p id="indice-articulo" className="etiqueta text-text-dim mb-4">
                {blog.article.tocTitle}
              </p>
              <ol className="border-border flex flex-col gap-3 border-l pl-4">
                {articulo.indice.map((entrada) => (
                  <li key={entrada.id}>
                    <a
                      href={`#${entrada.id}`}
                      className="text-text-dim hover:text-cyan focus-visible:outline-cyan text-sm leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {entrada.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </article>

      {relacionados.length > 0 && (
        <section className="bg-panel border-border border-t py-14">
          <div className="site-container flex flex-col gap-8">
            <SectionHeading titulo={blog.article.relatedTitle} nivel="h2" />

            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((otro) => (
                <Card as="li" key={otro.slug} className="group relative flex flex-col gap-3 p-6">
                  <Tag acento="cian">{blog.categories[otro.category]}</Tag>

                  <h3 className="font-display text-sm leading-snug font-bold">
                    <Link
                      href={getBlogPostPath(locale, otro.slug)}
                      className="focus-visible:outline-cyan after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      {otro.title}
                    </Link>
                  </h3>

                  <time
                    dateTime={otro.date}
                    className="text-text-dim border-border mt-auto border-t pt-4 text-xs"
                  >
                    {formatearFecha(otro.date, locale)}
                  </time>
                </Card>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand
        title={blog.article.ctaTitle}
        subtitle={blog.article.ctaBody}
        // El primario iba a la calculadora. Retirada esa ruta
        // (`CALCULADORA_ACTIVA`), queda un solo boton: se promociona el texto del
        // secundario, que ya hablaba de contacto, en lugar de dejar dos botones
        // hacia el mismo formulario. `ctaPrimary` espera en el JSON.
        primario={{
          label: blog.article.ctaSecondary,
          href: getLocalizedPath('contact', locale),
        }}
      />
    </main>
  )
}
