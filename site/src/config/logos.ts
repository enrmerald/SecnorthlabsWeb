/**
 * Registro de logotipos de terceros.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUE HAY UNA CAPSULA CLARA
 *
 * El brief es explicito: los logos se usan «según sus normas de marca (no
 * recolorear)». Y el sitio es oscuro (`--color-bg: #0D0F11`). Las dos cosas
 * juntas son un problema, porque cada marca entrega un juego distinto:
 *
 *   Fortinet   rojo #da291c        · legible sobre claro, flojo sobre oscuro
 *   OPNsense   gris #373736        · invisible sobre oscuro
 *   Microsoft  gris, y version blanca
 *   Huntress   cian                · legible en los dos
 *
 * Puestos directamente sobre el fondo oscuro darian cuatro tratamientos
 * distintos, y OPNsense no se veria. Recolorearlo esta prohibido.
 *
 * La capsula clara resuelve las dos cosas a la vez: cada marca usa su **version
 * positiva**, la que esta disenada para fondo claro, sin tocar ni un color, y
 * las cuatro quedan con el mismo tratamiento visual.
 *
 * Por eso aqui se referencian los logos POSITIVOS y no los invertidos, que es
 * lo contrario de lo que pediria un fondo oscuro sin capsula.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface Logotipo {
  /** Ruta bajo `public/`. */
  src: string
  /**
   * Texto alternativo. El logo **no** es decorativo: identifica al fabricante,
   * que es informacion que la tarjeta necesita transmitir.
   */
  alt: string
  /** Ancho / alto del original. Fija el hueco y evita CLS. */
  ratio: number
  /** Versión 2x para pantallas densas, si existe. */
  src2x?: string
  /**
   * Ajuste fino del tamano, 1 por defecto.
   *
   * La caja optica iguala las proporciones, pero no la percepcion: un logotipo
   * con icono y texto corto se ve mas pequeno que un wordmark que llena su caja
   * aunque ocupen lo mismo. Esto lo corrige, marca por marca y a ojo, que es
   * como se hace.
   */
  escala?: number
}

/**
 * Clave = el `name` que trae el fichero de mensajes (`software.licenses.cards`).
 * Si Marketing renombra una tarjeta y aqui no aparece, la tarjeta se pinta sin
 * logo en lugar de romperse.
 */
export const LOGOS_LICENCIAS: Record<string, Logotipo> = {
  Microsoft: {
    src: '/logos/microsoft-240.png',
    src2x: '/logos/microsoft-480.png',
    alt: 'Microsoft',
    ratio: 2.233,
    // Icono mas texto pequeno: necesita crecer para no parecer un error.
    escala: 1.25,
  },
  Huntress: {
    src: '/logos/huntress-240.png',
    src2x: '/logos/huntress-480.png',
    alt: 'Huntress',
    ratio: 4.056,
  },
  OPNsense: {
    // SVG vectorial de verdad, 13 KB: no necesita variantes de tamano.
    src: '/logos/logo-opnsense.svg',
    alt: 'OPNsense',
    ratio: 3.387,
  },
  Fortinet: {
    src: '/logos/fortinet-logo.svg',
    alt: 'Fortinet',
    ratio: 8.865,
    // Wordmark muy alargado: lo limita el ancho de la caja, no el alto.
    escala: 1,
  },
}

/**
 * Ewala, en la banda de SentryN3t.
 *
 * Este **no** va en capsula: se pinta directamente sobre la tarjeta oscura, asi
 * que usa la version clara. Es un partner tecnologico, no una licencia de la
 * rejilla, y darle el mismo tratamiento de placa que a las cuatro anteriores lo
 * degradaria a «una marca mas de la lista».
 *
 * Tras la division de Ewala, SentryN3t es suyo y el resto de servicios pasan a
 * ISN Labs, asi que el aviso de marca del pie y de esta banda es obligatorio.
 */
export const LOGO_EWALA: Logotipo = {
  src: '/logos/ewala-240.png',
  src2x: '/logos/ewala-480.png',
  alt: 'Ewala',
  ratio: 3.145,
}

/**
 * Wordmark de ISN Labs, blanco sobre oscuro. Navegacion y pie.
 *
 * **`Logotipo.tsx` no se borra.** Sigue existiendo como respaldo por dos
 * motivos: es lo que se usa en las plantillas de correo, donde las fuentes web
 * no cargan y las imagenes se bloquean con frecuencia, y es lo que pinta la 404
 * de ultimo recurso, que se sirve sin depender de ningun activo.
 */
export const LOGO_ISNLABS: Logotipo = {
  src: '/logos/isnlabs-240.png',
  src2x: '/logos/isnlabs-480.png',
  alt: 'ISN Labs',
  ratio: 6,
}

/**
 * SentryN3t, en su banda de Home y Software.
 *
 * Sin capsula: es un logotipo claro sobre fondo oscuro, que es su uso previsto.
 * Tras la division de Ewala, SentryN3t es producto de Ewala e ISN Labs lo
 * despliega y opera como partner, asi que aparece junto al aviso de marca y
 * nunca como producto propio.
 *
 * **Son dos piezas, no una.** El logotipo horizontal que entrego la marca trae el
 * icono mas bajo que el texto, y la desalineacion esta dentro del fichero: a
 * cualquier tamano se reproduce igual. Se compone en `LogoSentryNet`, que centra
 * las dos y resuelve el problema. Cada pieza esta recortada de su aire
 * transparente -el icono traia 76 px sobrantes abajo- y emitida a alturas fijas
 * de 64 y 128 px.
 */
export const LOGO_SENTRYNET_ICONO: Logotipo = {
  src: '/logos/sentrynet-icon-64.png',
  src2x: '/logos/sentrynet-icon-128.png',
  alt: 'SentryN3t',
  ratio: 1.078,
}

export const LOGO_SENTRYNET_WORDMARK: Logotipo = {
  src: '/logos/sentrynet-wordmark-64.png',
  src2x: '/logos/sentrynet-wordmark-128.png',
  // Decorativo: el nombre accesible lo aporta el icono, y anunciar el logotipo
  // dos veces seria peor que no anunciarlo.
  alt: '',
  ratio: 5.391,
}
