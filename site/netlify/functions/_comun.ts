import { z } from 'zod'

/**
 * Piezas compartidas por las funciones de ingestión.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Este directorio **no lo compila Next**. Lo despliega Netlify por separado, y
 * `verify:architecture` prohíbe que cualquier fichero de `src/` lo importe: es
 * lo que impide que las tarifas del motor acaben en el navegador (B01).
 *
 * No hay proxy firmado. MIG-02 §7 lo pedía porque el mailer iba a ser otro
 * proyecto de Netlify; al meterlo dentro de `site` ya no hay salto entre sitios
 * que firmar, y la firma JWS de Netlify solo funciona proxificando a sitios
 * externos. Lo que defiende estas funciones es la lista de comprobaciones de
 * `validarPeticion`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Cuerpo máximo aceptado. Coincide con el límite de MIG-02 §15.2. */
const TAMANO_MAXIMO_BYTES = 32 * 1024

/** Tiempo mínimo entre que se pinta el formulario y llega el envío. */
const SEGUNDOS_MINIMOS = 3

export type CodigoError = 'validation' | 'rateLimited' | 'generic'

export const CABECERAS = {
  'Content-Type': 'application/json',
  // Ninguna respuesta de estas funciones debe quedar en caché: llevan datos de
  // una persona concreta.
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
} as const

export const responder = (cuerpo: unknown, estado = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CABECERAS, ...extra } })

export const error = (codigo: CodigoError, estado: number, campos?: Record<string, string>) =>
  responder({ ok: false, error: codigo, ...(campos ? { fields: campos } : {}) }, estado)

/**
 * Cabecera del sobre (MIG-02 §6.3).
 *
 * `.strict()` en todos los niveles: una clave desconocida es un `400`, no un
 * campo que se ignora. Es lo que impide que el navegador cuele un `total`
 * inventado — no porque su nombre esté en una lista negra, sino porque el
 * esquema no lo admite.
 *
 * ⚠️ La lista de campos prohibidos de MIG-02 §6.6 incluye `hours`, que casaría
 * con el campo legítimo `consultingHours`. Implementarla como filtro de
 * subcadenas rompería la calculadora. El allowlist estricto ya hace su trabajo.
 */
export const SobreSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    submissionId: z.uuid(),
    locale: z.enum(['es', 'en']),
    createdAt: z.iso.datetime(),
    privacy: z
      .object({
        // Sin la casilla marcada no se procesa: acredita que se facilitó la
        // información de protección de datos.
        acknowledged: z.literal(true),
        noticeVersion: z.string().min(1).max(32),
      })
      .strict(),
    marketing: z
      .object({
        optIn: z.boolean(),
        textVersion: z.string().min(1).max(32),
      })
      .strict(),
    antispam: z
      .object({
        honeypot: z.string().max(200),
        renderedAt: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict()

/** Datos de contacto. Nombre y apellidos separados, nunca una cadena partida. */
export const ContactoSchema = z
  .object({
    firstName: z.string().trim().min(2).max(40),
    lastName: z.string().trim().min(2).max(60),
    company: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().max(32).optional().or(z.literal('')),
    title: z.string().trim().max(80).optional().or(z.literal('')),
  })
  .strict()

/**
 * Comprobaciones que preceden a cualquier validación de contenido.
 *
 * Devuelve una `Response` si hay que rechazar, o el cuerpo ya parseado.
 */
export async function validarPeticion(
  request: Request,
): Promise<{ rechazo: Response } | { cuerpo: unknown }> {
  if (request.method !== 'POST') {
    return { rechazo: responder({ ok: false, error: 'generic' }, 405, { Allow: 'POST' }) }
  }

  const tipo = request.headers.get('content-type') ?? ''
  if (!tipo.toLowerCase().includes('application/json')) {
    return { rechazo: error('validation', 415) }
  }

  const declarado = Number(request.headers.get('content-length') ?? '0')
  if (declarado > TAMANO_MAXIMO_BYTES) return { rechazo: error('validation', 413) }

  const texto = await request.text()
  // Se comprueba también el tamaño real: `Content-Length` lo pone el cliente y
  // puede mentir o faltar.
  if (texto.length > TAMANO_MAXIMO_BYTES) return { rechazo: error('validation', 413) }

  // Mismo origen. `Sec-Fetch-Site` lo pone el navegador y no se puede falsear
  // desde JavaScript de página; `Origin` sí, pero sumarlos sube el coste de un
  // envío automatizado desde otro sitio. Ninguno de los dos se considera
  // suficiente por sí solo.
  const sitio = request.headers.get('sec-fetch-site')
  if (sitio && sitio !== 'same-origin') return { rechazo: error('generic', 403) }

  try {
    return { cuerpo: JSON.parse(texto) }
  } catch {
    return { rechazo: error('validation', 400) }
  }
}

/**
 * Honeypot y comprobación de tiempo.
 *
 * Si salta cualquiera de los dos, la respuesta es **éxito**: a un bot no se le
 * dan pistas de que ha sido detectado, porque entonces prueba otra cosa.
 */
export function esProbableBot(antispam: { honeypot: string; renderedAt: number }): boolean {
  if (antispam.honeypot.trim() !== '') return true

  const transcurrido = (Date.now() - antispam.renderedAt) / 1000
  // `renderedAt` viene del reloj del cliente, que puede estar desajustado. Un
  // valor en el futuro no se toma como bot, solo como no comprobable.
  if (transcurrido < 0) return false
  return transcurrido < SEGUNDOS_MINIMOS
}

/**
 * Referencia corta que la persona puede citar si escribe.
 *
 * Se deriva del `submissionId` en lugar de generarse aparte, para que dos
 * reintentos del mismo envío den la misma referencia.
 */
export function referenciaCorta(submissionId: string): string {
  return submissionId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

/**
 * `true` si están las claves necesarias para enviar correo.
 *
 * Cuando es `false`, las funciones entran en **modo prueba**: calculan y
 * responden, pero no envían nada, y lo declaran en `delivery: 'skipped'`. La
 * interfaz está obligada a mostrarlo.
 */
export function puedeEnviarCorreo(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.LEAD_MAILBOX_TO)
}

/**
 * Registro sin datos personales (MIG-02 §8.8).
 *
 * Permitido: `submissionId`, tipo, idioma, estado, duración. Prohibido: nombre,
 * correo, teléfono, empresa, mensaje, parámetros y cualquier payload.
 */
export function registrar(datos: {
  tipo: string
  submissionId: string
  locale: string
  estado: string
  ms: number
}): void {
  console.log(JSON.stringify({ ...datos, at: new Date().toISOString() }))
}
