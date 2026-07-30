import type { Locale } from '@/config/routes'
import { getLocalizedPath } from '@/config/routes'
import { rutaImagenSocial } from './blog/imagenes'
import type { Articulo } from './blog/esquema'
import { EMPRESA, SITE_URL, urlAbsoluta } from './empresa'
import type { TramoBreadcrumb } from './tipos'

/**
 * Datos estructurados (Fase 7).
 *
 * Se construyen aqui, en build, y se serializan en un `<script type=
 * "application/ld+json">`. Todo sale de las mismas fuentes que la pagina
 * -`EMPRESA`, el manifiesto de rutas, el front matter del articulo-, porque un
 * JSON-LD que dice algo distinto de lo que se ve en pantalla es peor que no
 * tenerlo: Google lo trata como marcado enganoso.
 *
 * Regla que se aplica en los tres: **no se declara nada que no exista**. Sin
 * perfiles sociales confirmados no hay `sameAs`, y sin foto de autor real no hay
 * `image` en el autor.
 */

const ID_ORGANIZACION = `${SITE_URL}/#organizacion`

/** `Organization` + `LocalBusiness` de la Home (seccion 4.1). */
export function organizacionJsonLd(locale: Locale) {
  const direccion = {
    '@type': 'PostalAddress',
    streetAddress: `${EMPRESA.direccion.calle}, ${EMPRESA.direccion.poligono}`,
    addressLocality: EMPRESA.direccion.localidad,
    addressRegion: EMPRESA.direccion.provincia,
    postalCode: EMPRESA.direccion.codigoPostal,
    addressCountry: EMPRESA.direccion.pais,
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ID_ORGANIZACION,
        name: EMPRESA.nombre,
        legalName: EMPRESA.razonSocial,
        url: urlAbsoluta(getLocalizedPath('home', locale)),
        email: EMPRESA.email,
        telephone: EMPRESA.telefono,
        vatID: EMPRESA.nif,
        address: direccion,
        // `sameAs` solo con perfiles confirmados (pendiente P7): apuntar a un
        // perfil equivocado es peor que no declararlo.
        ...(EMPRESA.perfiles.length > 0 ? { sameAs: [...EMPRESA.perfiles] } : {}),
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#sede`,
        name: EMPRESA.nombre,
        parentOrganization: { '@id': ID_ORGANIZACION },
        url: urlAbsoluta(getLocalizedPath('home', locale)),
        email: EMPRESA.email,
        telephone: EMPRESA.telefono,
        address: direccion,
        areaServed: { '@type': 'Country', name: 'España' },
      },
    ],
  }
}

/**
 * `BreadcrumbList` a partir de las mismas migas que se pintan en pantalla.
 *
 * Es la razon por la que las migas son un array estructurado y no una frase con
 * barras (seccion 2.4): la misma estructura alimenta el componente visual y el
 * marcado, sin duplicar la informacion ni partir cadenas por `/`.
 */
export function migasJsonLd(tramos: readonly TramoBreadcrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: tramos.map(({ label, href }, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      name: label,
      // El ultimo tramo es la pagina actual y no lleva enlace, igual que en el
      // componente visual.
      ...(href ? { item: urlAbsoluta(href) } : {}),
    })),
  }
}

/** `BlogPosting` de un articulo, con autor y fecha reales. */
export function articuloJsonLd(articulo: Articulo, locale: Locale, url: string) {
  const imagen = rutaImagenSocial(articulo.image)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: articulo.title,
    description: articulo.description,
    inLanguage: locale === 'es' ? 'es-ES' : 'en-GB',
    datePublished: articulo.date,
    // Sin `dateModified` inventado: mientras no se registre la fecha de revision
    // en el front matter, declararla igual a la de publicacion no aporta nada y
    // afirmarla distinta seria falso.
    author: { '@type': 'Organization', name: articulo.author, '@id': ID_ORGANIZACION },
    publisher: { '@id': ID_ORGANIZACION },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection: articulo.category,
    ...(articulo.tags.length > 0 ? { keywords: articulo.tags.join(', ') } : {}),
    ...(imagen ? { image: [urlAbsoluta(imagen)] } : {}),
  }
}
