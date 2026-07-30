/**
 * Unica fuente de datos de empresa (seccion 7.5).
 *
 * Alimenta el pie, la pagina de contacto, las paginas legales y el JSON-LD de
 * `Organization` y `LocalBusiness`, para que no haya tres direcciones distintas
 * en el mismo sitio.
 *
 * Los datos de contacto son los **reales**: el brief los da como marcadores
 * (`hola@isnlabs.eu`, `+34 9XX XX XX XX`) y no se publican datos que no existen.
 * El nombre publico si pasa a ser ISN Labs.
 */
export const EMPRESA = {
  /** Nombre publico. El unico que se usa fuera de las paginas legales. */
  nombre: 'ISN Labs',
  /** Denominacion registrada. Solo en legales y facturas. */
  razonSocial: 'Innovation and Security North Labs SL',
  siglas: 'ISNOL',
  nif: 'B22966139',
  claim: 'Cybersecurity, IA & Innovation',

  email: 'info@secnorthlabs.eu',
  telefono: '+34 634 651 312',
  /** Version normalizada para `tel:`, sin espacios. */
  telefonoTel: '+34634651312',

  direccion: {
    calle: 'Calle Peña Brava 21, oficina 1B',
    poligono: 'PI de Silvota',
    localidad: 'Llanera',
    provincia: 'Asturias',
    codigoPostal: '33192',
    pais: 'ES',
  },

  /**
   * Ficha de la oficina en Google Maps.
   *
   * Enlace corto oficial de Google, no una URL construida a mano con la
   * direccion como parametro de busqueda: el enlace corto apunta al sitio
   * concreto, y una busqueda por texto puede acabar en el poligono en general.
   */
  mapaUrl: 'https://maps.app.goo.gl/P6s24jZWFyFuSiZ47',

  /**
   * Perfiles publicos para `sameAs` de schema.org. Vacio hasta que Marketing
   * confirme el LinkedIn de empresa (pendiente P7): un `sameAs` que apunta a un
   * perfil equivocado es peor que no declararlo.
   */
  perfiles: [] as readonly string[],
} as const

/**
 * URL canonica del sitio, sin barra final.
 *
 * Se lee en componentes de build, nunca con prefijo `NEXT_PUBLIC_`: esas
 * variables se incrustan en el bundle y ademas impiden promocionar el mismo
 * artefacto de staging a produccion (seccion 6.15).
 */
export const SITE_URL = (process.env.SITE_URL ?? 'https://secnorthlabs.eu').replace(/\/$/, '')

/**
 * Telefono de la linea de incidentes 24/7. Vacio = el bloque no se renderiza.
 * No hay linea real todavia (pendiente P3), y publicar un telefono de
 * emergencia que nadie atiende es peor que no publicarlo.
 */
export const INCIDENT_PHONE = process.env.INCIDENT_PHONE?.trim() || null

export const urlAbsoluta = (path: string): string => `${SITE_URL}${path}`

/**
 * Version del texto informativo de proteccion de datos que se muestra.
 *
 * Se guarda con cada envio, porque sin ella no se puede acreditar **que
 * informacion** se facilito: la casilla marcada por si sola no dice qué leyo la
 * persona. Se sube a mano cada vez que cambie el texto.
 */
export const PRIVACY_VERSION = process.env.PRIVACY_VERSION ?? '2026-07-28'
export const MARKETING_TEXT_VERSION = process.env.MARKETING_TEXT_VERSION ?? '2026-07-28'
