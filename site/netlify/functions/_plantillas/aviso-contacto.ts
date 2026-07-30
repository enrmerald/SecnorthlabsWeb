/**
 * Aviso interno de un envío del formulario de contacto.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Este correo lo lee una persona en `info@secnorthlabs.eu`, así que sí lleva
 * los datos del formulario en claro y sí lleva la marca. Es un correo distinto
 * del de ingestión de la calculadora (MIG-02 §10), que va cifrado a un buzón
 * que lee un programa y no debe contener ni un dato personal legible.
 *
 * Por qué no se parece a la web (ISNLA-DOC-0008-REQ-01 §G.4):
 *
 * - **Maquetación con `<table>`**, no flex ni grid: Outlook para Windows
 *   renderiza con el motor de Word, que no implementa ninguno de los dos.
 * - **CSS en línea**, atributo por atributo: muchos clientes -Gmail el primero
 *   con reenvíos- eliminan el `<style>` del `<head>`.
 * - **Sin Space Mono ni Noto Sans**: las fuentes web no cargan de forma fiable.
 *   Se usa una pila de respaldo con métricas parecidas.
 * - **600 px fijos**: el máximo seguro en el panel de lectura de Outlook.
 * - **Sin imágenes**: muchos clientes las bloquean por defecto, y un logotipo
 *   que no carga deja el correo descabezado. El wordmark va como texto.
 * - **Fondo oscuro con `bgcolor` además del estilo**: los clientes que ignoran
 *   CSS respetan el atributo, y los que invierten colores en modo oscuro
 *   encuentran ya un fondo oscuro y no lo tocan.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type Idioma = 'es' | 'en'

export interface DatosAviso {
  referencia: string
  submissionId: string
  locale: Idioma
  /** ISO-8601 que manda el navegador. Se muestra formateado y en UTC. */
  createdAt: string
  entorno: string
  contacto: {
    firstName: string
    /** Opcional: el formulario ya no lo exige. */
    lastName?: string
    company: string
    email: string
    phone?: string
    title?: string
  }
  datos: {
    need: string
    message?: string
  }
  privacidad: { noticeVersion: string }
  marketing: { optIn: boolean; textVersion: string }
}

export interface CorreoCompuesto {
  asunto: string
  html: string
  texto: string
}

// ── Paleta ───────────────────────────────────────────────────────────────────
// Los mismos valores que `src/app/globals.css`. Se repiten literales a
// propósito: el correo no puede leer variables CSS ni clases de Tailwind, y
// enlazarlo con el sistema de diseño solo daría una falsa sensación de vínculo.
const FONDO = '#0d0f11'
const PANEL = '#121518'
const TARJETA = '#161a1e'
const BORDE = '#262d33'
const TEXTO = '#e9edf0'
const TENUE = '#8c969e'
const CIAN = '#5bd8e8'
const VERDE = '#00e48d'

const PILA_TITULOS = "'Courier New', Consolas, monospace"
const PILA_CUERPO = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"

const TEXTOS = {
  es: {
    asunto: (necesidad: string, referencia: string) =>
      `Contacto web · ${necesidad} · Ref. ${referencia}`,
    preencabezado: (necesidad: string) => `Nueva consulta desde la web · ${necesidad}`,
    kicker: 'Formulario de contacto',
    titulo: 'Nueva consulta desde la web',
    referencia: 'Referencia',
    recibido: 'Recibido',
    idioma: 'Idioma del envío',
    contacto: 'Contacto',
    nombre: 'Nombre',
    empresa: 'Empresa',
    cargo: 'Cargo',
    email: 'Email',
    telefono: 'Teléfono',
    necesidad: 'Necesidad',
    mensaje: 'Mensaje',
    sinMensaje: 'Sin mensaje.',
    noIndicado: 'No indicado',
    consentimientos: 'Consentimientos',
    privacidad: 'Información de protección de datos',
    aceptada: 'Aceptada',
    version: 'versión',
    marketing: 'Comunicaciones comerciales',
    si: 'Sí',
    no: 'No',
    responder: 'Responde a este correo para escribir directamente a la persona.',
    plazo: 'El copy de la web promete respuesta en menos de 24 h laborables.',
    automatico: 'Mensaje automático del formulario de contacto de secnorthlabs.eu.',
    envio: 'Envío',
    entorno: 'Entorno',
  },
  en: {
    asunto: (necesidad: string, referencia: string) =>
      `Website contact · ${necesidad} · Ref. ${referencia}`,
    preencabezado: (necesidad: string) => `New website enquiry · ${necesidad}`,
    kicker: 'Contact form',
    titulo: 'New website enquiry',
    referencia: 'Reference',
    recibido: 'Received',
    idioma: 'Submission language',
    contacto: 'Contact',
    nombre: 'Name',
    empresa: 'Company',
    cargo: 'Role',
    email: 'Email',
    telefono: 'Phone',
    necesidad: 'Need',
    mensaje: 'Message',
    sinMensaje: 'No message.',
    noIndicado: 'Not provided',
    consentimientos: 'Consents',
    privacidad: 'Data protection notice',
    aceptada: 'Acknowledged',
    version: 'version',
    marketing: 'Marketing communications',
    si: 'Yes',
    no: 'No',
    responder: 'Reply to this email to write directly to the person.',
    plazo: 'The website copy promises a reply within 24 working hours.',
    automatico: 'Automated message from the secnorthlabs.eu contact form.',
    envio: 'Submission',
    entorno: 'Environment',
  },
} as const

/**
 * Compone el aviso en el idioma en que la persona rellenó el formulario.
 *
 * Se usa el idioma del visitante y no uno fijo porque el correo reproduce lo
 * que esa persona escribió: un mensaje en inglés bajo etiquetas en castellano
 * se lee peor, y quien atiende la consulta va a responder en su idioma.
 */
export function avisoContacto(datos: DatosAviso): CorreoCompuesto {
  const t = TEXTOS[datos.locale]
  const c = datos.contacto

  const nombre = `${c.firstName} ${c.lastName ?? ''}`.trim()
  const recibido = fecha(datos.createdAt, datos.locale)
  const telefono = c.phone?.trim() ? c.phone.trim() : null
  const cargo = c.title?.trim() ? c.title.trim() : null
  const mensaje = datos.datos.message?.trim() ? datos.datos.message.trim() : null

  return {
    asunto: t.asunto(datos.datos.need, datos.referencia),
    html: html(datos, t, { nombre, telefono, cargo, mensaje, recibido }),
    texto: texto(datos, t, { nombre, telefono, cargo, mensaje, recibido }),
  }
}

interface Derivados {
  nombre: string
  telefono: string | null
  cargo: string | null
  mensaje: string | null
  recibido: string
}

/**
 * Fecha legible, siempre en UTC y con la zona escrita.
 *
 * El ISO crudo que manda el navegador es correcto pero se lee mal, y una hora
 * local sin decir cuál es peor todavía: quien recibe el aviso no sabe si las
 * 10:00 son las suyas o las de quien escribió.
 */
function fecha(iso: string, locale: Idioma): string {
  const cuando = new Date(iso)
  if (Number.isNaN(cuando.getTime())) return iso

  const formato = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  })
  return `${formato.format(cuando)} UTC`
}

/** La union de los dos idiomas, no uno de ellos: las cadenas son literales. */
type Textos = (typeof TEXTOS)[Idioma]

function html(datos: DatosAviso, t: Textos, d: Derivados): string {
  const filas = [
    fila(t.nombre, esc(d.nombre)),
    fila(t.empresa, esc(datos.contacto.company)),
    fila(t.cargo, d.cargo ? esc(d.cargo) : tenue(t.noIndicado)),
    fila(t.email, enlace(`mailto:${datos.contacto.email}`, datos.contacto.email)),
    fila(t.telefono, d.telefono ? enlace(`tel:${sinEspacios(d.telefono)}`, d.telefono) : tenue(t.noIndicado)),
    fila(t.necesidad, esc(datos.datos.need)),
  ].join('')

  const consentimientos = [
    fila(
      t.privacidad,
      `${marca(t.aceptada)} <span style="color:${TENUE};">· ${t.version} ${esc(datos.privacidad.noticeVersion)}</span>`,
    ),
    fila(
      t.marketing,
      datos.marketing.optIn
        ? `${marca(t.si)} <span style="color:${TENUE};">· ${t.version} ${esc(datos.marketing.textVersion)}</span>`
        : tenue(`${t.no} · ${t.version} ${esc(datos.marketing.textVersion)}`),
    ),
  ].join('')

  // El preencabezado es lo que la bandeja enseña junto al asunto. Sin él, los
  // clientes cogen la primera línea visible, que sería el wordmark.
  const preencabezado = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(
    t.preencabezado(datos.datos.need),
  )}</div>`

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${datos.locale}">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>${esc(t.titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:${FONDO};color:${TEXTO};" bgcolor="${FONDO}">
${preencabezado}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FONDO}" style="background-color:${FONDO};margin:0;padding:0;">
<tr>
<td align="center" style="padding:24px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${PANEL};border:1px solid ${BORDE};border-radius:10px;" bgcolor="${PANEL}">

<!-- Cabecera -->
<tr>
<td style="padding:24px 28px 8px 28px;border-bottom:1px solid ${BORDE};">
<p style="margin:0;font-family:${PILA_TITULOS};font-size:15px;font-weight:bold;letter-spacing:1px;color:${TEXTO};">ISN<span style="color:${CIAN};">&nbsp;LABS</span></p>
<p style="margin:12px 0 0 0;font-family:${PILA_TITULOS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${CIAN};">${esc(t.kicker)}</p>
<h1 style="margin:6px 0 18px 0;font-family:${PILA_TITULOS};font-size:20px;line-height:1.25;font-weight:bold;color:${TEXTO};">${esc(t.titulo)}</h1>
</td>
</tr>

<!-- Referencia -->
<tr>
<td style="padding:18px 28px 0 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${TARJETA};border:1px solid ${BORDE};border-radius:10px;" bgcolor="${TARJETA}">
<tr>
<td style="padding:14px 16px;font-family:${PILA_CUERPO};font-size:13px;color:${TENUE};">
<span style="color:${TENUE};">${esc(t.referencia)}:</span>
<strong style="font-family:${PILA_TITULOS};font-size:15px;color:${VERDE};">${esc(datos.referencia)}</strong>
<br />
<span style="color:${TENUE};">${esc(t.recibido)}: ${esc(d.recibido)}</span>
<br />
<span style="color:${TENUE};">${esc(t.idioma)}: ${datos.locale.toUpperCase()}</span>
</td>
</tr>
</table>
</td>
</tr>

<!-- Datos de contacto -->
<tr>
<td style="padding:24px 28px 0 28px;">
<p style="margin:0 0 10px 0;font-family:${PILA_TITULOS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${TENUE};">${esc(t.contacto)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${filas}</table>
</td>
</tr>

<!-- Mensaje -->
<tr>
<td style="padding:24px 28px 0 28px;">
<p style="margin:0 0 10px 0;font-family:${PILA_TITULOS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${TENUE};">${esc(t.mensaje)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${TARJETA};border:1px solid ${BORDE};border-radius:10px;" bgcolor="${TARJETA}">
<tr>
<td style="padding:16px;font-family:${PILA_CUERPO};font-size:15px;line-height:1.7;color:${d.mensaje ? TEXTO : TENUE};">${
    d.mensaje ? multilinea(d.mensaje) : esc(t.sinMensaje)
  }</td>
</tr>
</table>
</td>
</tr>

<!-- Consentimientos -->
<tr>
<td style="padding:24px 28px 0 28px;">
<p style="margin:0 0 10px 0;font-family:${PILA_TITULOS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${TENUE};">${esc(t.consentimientos)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${consentimientos}</table>
</td>
</tr>

<!-- Pie -->
<tr>
<td style="padding:24px 28px 24px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid ${BORDE};padding-top:16px;font-family:${PILA_CUERPO};font-size:12px;line-height:1.6;color:${TENUE};">
<p style="margin:0 0 6px 0;color:${TEXTO};">${esc(t.responder)}</p>
<p style="margin:0 0 12px 0;color:${TENUE};">${esc(t.plazo)}</p>
<p style="margin:0;color:${TENUE};">${esc(t.automatico)}</p>
<p style="margin:6px 0 0 0;font-family:${PILA_TITULOS};font-size:11px;color:${TENUE};">${esc(t.envio)}: ${esc(datos.submissionId)} · ${esc(t.entorno)}: ${esc(datos.entorno)}</p>
</td></tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`
}

/** Alternativa en texto plano. La lee quien filtra HTML y la mira el antispam. */
function texto(datos: DatosAviso, t: Textos, d: Derivados): string {
  const lineas = [
    t.titulo.toUpperCase(),
    '',
    `${t.referencia}: ${datos.referencia}`,
    `${t.recibido}: ${d.recibido}`,
    `${t.idioma}: ${datos.locale.toUpperCase()}`,
    '',
    `-- ${t.contacto} --`,
    `${t.nombre}: ${d.nombre}`,
    `${t.empresa}: ${datos.contacto.company}`,
    `${t.cargo}: ${d.cargo ?? t.noIndicado}`,
    `${t.email}: ${datos.contacto.email}`,
    `${t.telefono}: ${d.telefono ?? t.noIndicado}`,
    `${t.necesidad}: ${datos.datos.need}`,
    '',
    `-- ${t.mensaje} --`,
    d.mensaje ?? t.sinMensaje,
    '',
    `-- ${t.consentimientos} --`,
    `${t.privacidad}: ${t.aceptada} (${t.version} ${datos.privacidad.noticeVersion})`,
    `${t.marketing}: ${datos.marketing.optIn ? t.si : t.no} (${t.version} ${datos.marketing.textVersion})`,
    '',
    t.responder,
    t.plazo,
    '',
    t.automatico,
    `${t.envio}: ${datos.submissionId} · ${t.entorno}: ${datos.entorno}`,
  ]
  return lineas.join('\n')
}

// ── Piezas ───────────────────────────────────────────────────────────────────

const fila = (etiqueta: string, valor: string) => `<tr>
<td width="34%" style="padding:6px 12px 6px 0;vertical-align:top;font-family:${PILA_CUERPO};font-size:13px;color:${TENUE};">${esc(etiqueta)}</td>
<td style="padding:6px 0;vertical-align:top;font-family:${PILA_CUERPO};font-size:15px;color:${TEXTO};">${valor}</td>
</tr>`

const tenue = (valor: string) => `<span style="color:${TENUE};">${esc(valor)}</span>`

const marca = (valor: string) => `<span style="color:${VERDE};">${esc(valor)}</span>`

/**
 * Enlace con el color forzado en el propio `<a>`.
 *
 * Sin esto, iOS y Gmail deciden por su cuenta y pintan azul sobre fondo casi
 * negro, que es de lo menos legible que hay.
 */
const enlace = (destino: string, texto: string) =>
  `<a href="${esc(destino)}" style="color:${CIAN};text-decoration:underline;">${esc(texto)}</a>`

/** El teléfono se muestra como lo escribió la persona, pero `tel:` no admite espacios. */
const sinEspacios = (valor: string) => valor.replace(/[^\d+]/g, '')

/** Los saltos de línea del mensaje se conservan: quitarlos cambia lo que se dijo. */
const multilinea = (valor: string) => esc(valor).replace(/\r?\n/g, '<br />')

/**
 * Escapado de HTML.
 *
 * Todo lo que entra en la plantilla viene de un formulario público, así que
 * **nada** se interpola sin pasar por aquí. No es una precaución teórica: sin
 * escapar, un `<img src=x onerror=...>` en el campo «mensaje» se ejecutaría en
 * el cliente de correo de quien atiende la consulta.
 */
function esc(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
