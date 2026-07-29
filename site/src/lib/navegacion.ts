import {
  NAV_ROUTES,
  getLocalizedPath,
  isEnabled,
  type Locale,
  type RouteId,
} from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'

/**
 * Construye los datos de navegacion y pie a partir del manifiesto de rutas y de
 * los mensajes.
 *
 * Se ejecuta **en build**, dentro de componentes de servidor; lo que llega al
 * navegador son enlaces ya resueltos, no el manifiesto ni los mensajes.
 *
 * Todo destino sale de `getLocalizedPath`. Ningun `href` se escribe a mano: con
 * slugs traducidos, una cadena montada en el JSX es la forma segura de acabar
 * con `/en/compania/`.
 */

export interface EnlaceResuelto {
  label: string
  href: string
}

/** Enlace de mensajes: etiqueta traducible + destino por identificador. */
interface EnlaceMensaje {
  label: string
  routeId: string | null
  hash?: string
}

/**
 * Resuelve una lista de enlaces de mensajes, descartando las rutas
 * desactivadas.
 *
 * Cambiar `BLOG_ENABLED` a `false` retira el blog de la navegacion y del pie sin
 * tocar los ficheros de mensajes ni el JSX.
 */
function resolverEnlaces(enlaces: readonly EnlaceMensaje[], locale: Locale): EnlaceResuelto[] {
  return enlaces.flatMap(({ label, routeId, hash }) => {
    if (routeId === null) return []
    const id = routeId as RouteId
    if (!isEnabled(id)) return []
    return [{ label, href: getLocalizedPath(id, locale, hash) }]
  })
}

export interface ColumnaPie {
  title: string
  links: EnlaceResuelto[]
  /**
   * Etiqueta del boton que abre el gestor de consentimiento, o `null`.
   *
   * Va en la columna y no suelto en el pie para que el JSX no tenga que
   * adivinar cual es la columna legal comparando titulos traducidos.
   */
  cookieSettings?: string | null
}

export interface DatosNavegacion {
  inicio: string
  /** Entradas planas de la barra: Sectores, Software, Compania, Blog, Contacto. */
  enlaces: Array<EnlaceResuelto & { routeId: RouteId }>
  /** Desplegable "Soluciones". */
  soluciones: { label: string; items: EnlaceResuelto[] }
  cta: EnlaceResuelto
  /** Idioma al que lleva el selector, y su etiqueta ("EN" desde el espanol). */
  otroIdioma: { locale: Locale; label: string }
  a11y: ReturnType<typeof cargarMensajes>['common']['a11y']
}

export function construirNavegacion(locale: Locale): DatosNavegacion {
  const { common } = cargarMensajes(locale)
  const otro: Locale = locale === 'es' ? 'en' : 'es'

  const etiquetas: Record<RouteId, string> = {
    ...({} as Record<RouteId, string>),
    sectors: common.nav.sectors,
    software: common.nav.software,
    company: common.nav.company,
    blog: common.nav.blog,
    contact: common.nav.contact,
  }

  return {
    inicio: getLocalizedPath('home', locale),
    enlaces: NAV_ROUTES.filter(isEnabled).map((id) => ({
      routeId: id,
      label: etiquetas[id],
      href: getLocalizedPath(id, locale),
    })),
    soluciones: {
      label: common.solutionsMenu.label,
      items: resolverEnlaces(common.solutionsMenu.items, locale),
    },
    // El brief deja el CTA de la barra como "a definir". Apuntaba a la
    // calculadora -el diagnostico o selector de plan que describe-, y con esa
    // ruta retirada (`CALCULADORA_ACTIVA`) lleva al formulario de contacto, que
    // es donde se atiende la misma peticion. El texto lo dice sin rodeos
    // («Contactanos»): un boton de barra promete el destino al que lleva.
    cta: { label: common.nav.cta, href: getLocalizedPath('contact', locale) },
    otroIdioma: { locale: otro, label: common.nav.languageToggle },
    a11y: common.a11y,
  }
}

export interface DatosPie {
  inicio: string
  claim: string
  legalLine: string
  copyright: string
  ewalaNotice: string
  columnas: ColumnaPie[]
  a11yLabel: string
}

/**
 * `false` mientras no se decida la analitica (pendiente P12). Con `true`, el pie
 * muestra "Configurar cookies" y el CMP de la Fase 8 se monta.
 */
export const CMP_ACTIVO = false

export function construirPie(locale: Locale): DatosPie {
  const { common } = cargarMensajes(locale)
  const { columns } = common.footer

  return {
    inicio: getLocalizedPath('home', locale),
    claim: common.brand.claim,
    legalLine: common.footer.legalLine,
    copyright: common.footer.copyright,
    ewalaNotice: common.footer.ewalaNotice,
    columnas: [
      { title: columns.solutions.title, links: resolverEnlaces(columns.solutions.links, locale) },
      { title: columns.company.title, links: resolverEnlaces(columns.company.links, locale) },
      {
        title: columns.legal.title,
        links: resolverEnlaces(columns.legal.links, locale),
        // Solo en el escenario B de la Fase 8: un boton que abre un gestor de
        // consentimiento inexistente es peor que no tenerlo (seccion 3.2).
        cookieSettings: CMP_ACTIVO ? columns.legal.cookieSettings.label : null,
      },
    ],
    a11yLabel: common.a11y.footerNav,
  }
}
