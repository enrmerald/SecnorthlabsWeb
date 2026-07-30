import Link from 'next/link'
import { ImagenArticulo } from '@/components/blog/ImagenArticulo'
import { ListaFiltrable } from '@/components/blog/ListaFiltrable'
import { TarjetaArticulo } from '@/components/blog/TarjetaArticulo'
import { HeroInterior } from '@/components/blocks/HeroInterior'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tag } from '@/components/ui/Tag'
import type { Locale } from '@/config/routes'
import { getBlogPostPath } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import {
  articuloDestacado,
  categoriasConArticulos,
  formatearFecha,
  listarIndice,
} from '@/lib/blog/datos'

/**
 * Listado del blog - `/es/blog/` (seccion 4.9, mockup image8.png).
 *
 * El contenido sale de `content/blog/<idioma>/`, compilado por `content:build`.
 * Aqui no se lee ningun Markdown: el pipeline ya lo ha convertido, validado y
 * ordenado, de modo que esta pagina es composicion y nada mas.
 *
 * El destacado es **el articulo mas reciente**, no una eleccion manual, y por eso
 * no se repite en la rejilla de abajo: un mismo articulo dos veces en la misma
 * pantalla parece un fallo de maquetacion.
 */
export function Blog({ locale }: { locale: Locale }) {
  const { blog } = cargarMensajes(locale)

  const destacado = articuloDestacado(locale)
  const resto = listarIndice(locale).filter((articulo) => articulo.slug !== destacado?.slug)
  // El contador cuenta sobre la rejilla, no sobre el total de articulos: el
  // destacado esta fuera de ella, y un chip que dice «5» mostrando 4 tarjetas
  // parece un error de filtrado.
  const categorias = categoriasConArticulos(locale)
    .map((id) => ({
      id,
      etiqueta: blog.categories[id],
      cuenta: resto.filter((articulo) => articulo.category === id).length,
    }))
    .filter((categoria) => categoria.cuenta > 0)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={blog.hero.breadcrumb}
        title={blog.hero.title}
        titleHighlight={blog.hero.titleHighlight}
        subtitle={blog.hero.subtitle}
      />

      {destacado ? (
        <>
          <section className="site-container pb-14" aria-labelledby="destacado">
            <Card
              acento="top"
              acentoColor="cian"
              className="group relative grid overflow-hidden lg:grid-cols-2"
            >
              {destacado.image && (
                <div className="border-border aspect-[16/9] overflow-hidden border-b lg:aspect-auto lg:h-full lg:border-b-0 lg:border-r">
                  <ImagenArticulo
                    nombre={destacado.image}
                    alt={destacado.imageAlt}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    prioritaria
                  />
                </div>
              )}

              <div className="flex flex-col gap-4 p-6 md:p-8">
                <p className="etiqueta text-green" id="destacado">
                  {blog.list.featuredLabel}
                </p>

                <h2 className="section-title">
                  <Link
                    href={getBlogPostPath(locale, destacado.slug)}
                    className="focus-visible:outline-cyan after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    {destacado.title}
                  </Link>
                </h2>

                <p className="texto-cuerpo">{destacado.description}</p>

                <div className="border-border mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-4">
                  <Tag acento="cian">{blog.categories[destacado.category]}</Tag>
                  <time dateTime={destacado.date} className="text-text-dim font-display text-xs">
                    {formatearFecha(destacado.date, locale)}
                  </time>
                  <span aria-hidden="true" className="text-border">
                    ·
                  </span>
                  <span className="text-text-dim font-display text-xs">
                    {destacado.readingMinutes} {blog.list.readingSuffix}
                  </span>
                </div>
              </div>
            </Card>
          </section>

          <section className="site-container flex flex-col gap-8 pb-20">
            <SectionHeading
              kicker={blog.list.kicker}
              kickerPrefijo="/01"
              titulo={blog.list.title}
            />

            <ListaFiltrable
              categorias={categorias}
              etiquetaTodos={blog.list.allLabel}
              etiquetaFiltro={blog.list.filterLabel}
              total={resto.length}
            >
              <ul
                aria-label={blog.list.title}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {resto.map((articulo, indice) => (
                  <TarjetaArticulo
                    key={articulo.slug}
                    articulo={articulo}
                    locale={locale}
                    etiquetaCategoria={blog.categories[articulo.category]}
                    sufijoLectura={blog.list.readingSuffix}
                    prioritaria={indice < 3}
                  />
                ))}
              </ul>
            </ListaFiltrable>
          </section>
        </>
      ) : (
        // Un idioma puede ir por detras del otro: mientras un articulo no este
        // traducido no existe en ese idioma, y es preferible decirlo a publicar
        // una traduccion automatica.
        <section className="site-container pb-20">
          <p className="texto-cuerpo">{blog.list.empty}</p>
        </section>
      )}
    </main>
  )
}
