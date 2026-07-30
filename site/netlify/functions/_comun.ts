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

export type CodigoError = 'validation' | 'rateLimited' | 'unavailable' | 'generic'

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
 * inventado - no porque su nombre esté en una lista negra, sino porque el
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

/**
 * Caracteres de control: los invisibles del rango C0/C1, salto de línea
 * incluido.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Se rechazan en todo campo de una sola línea, y no es cosmética.
 *
 * Varios de estos valores acaban en cabeceras de correo -`need` en el asunto,
 * `email` en `Reply-To`-, y una cabecera termina en el primer salto de línea:
 * un `\r\n` colado en un campo puede cerrar la cabecera y abrir otra, que es la
 * inyección de cabeceras de toda la vida. La defensa correcta es no aceptar el
 * carácter, no confiar en que el que va detrás lo limpie.
 *
 * `message` queda fuera a propósito: es un texto de varias líneas y los saltos
 * son parte de lo que la persona quiso decir. Ahí solo se prohíben los
 * controles que no son salto ni tabulador, y como va al cuerpo y no a una
 * cabecera, no puede inyectar nada.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const UNA_LINEA = /^[^\p{Cc}]*$/u

/** Campo de una línea: sin controles y recortado. */
const linea = (min: number, max: number) =>
  z.string().trim().min(min).max(max).regex(UNA_LINEA, 'valor')

/** Datos de contacto. Nombre y apellidos separados, nunca una cadena partida. */
export const ContactoSchema = z
  .object({
    firstName: linea(2, 40),
    // Opcional: hay nombres de una sola palabra, y quien escribe desde fuera de
    // España puede no tener «apellidos» en el sentido de aquí. Exigirlos perdía
    // solicitudes legítimas por un campo que no cambia nada.
    lastName: linea(0, 60).optional(),
    company: linea(2, 80),
    // `.email()` ya excluye espacios y saltos, que es lo que protege `Reply-To`.
    email: z.string().trim().email().max(160),
    phone: linea(0, 32).optional(),
    title: linea(0, 80).optional(),
  })
  .strict()

/**
 * Texto libre de varias líneas.
 *
 * Se normalizan los finales de línea de Windows antes de comprobar: si no, un
 * `\r` sobreviviría al filtro por ir siempre pegado a un `\n` legítimo.
 */
export const textoLargo = (max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\r\n/g, '\n').trim())
    .refine((v) => v.length <= max, 'message')
    // Se quitan los saltos y tabuladores legítimos y se exige que no quede
    // ningún otro control.
    .refine((v) => UNA_LINEA.test(v.replace(/[\n\t]/g, '')), 'valor')

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
 * Buzón que recibe los avisos del formulario de contacto.
 *
 * Es **distinto** del de ingestión a propósito: este lo lee una persona y el
 * correo va en claro; el de ingestión lo lee un programa y el correo va cifrado.
 * Mezclarlos obligaría a elegir entre un buzón humano lleno de adjuntos JWE o un
 * importador tropezando con mensajes que no sabe leer.
 */
export const buzonContacto = () => process.env.CONTACT_MAILBOX_TO

/** Buzón de ingestión de la calculadora, que lee el importador local. */
export const buzonIngestion = () => process.env.LEAD_MAILBOX_TO

/** Etiqueta de entorno para asunto, cabeceras y trazas. Nunca lleva datos. */
export const entorno = () => process.env.MAIL_ENVIRONMENT ?? 'development'

/**
 * `true` si están las claves necesarias para enviar al buzón indicado.
 *
 * Cuando es `false`, la función entra en **modo prueba**: valida, calcula y
 * responde, pero no envía nada, y lo declara en `delivery: 'skipped'`. La
 * interfaz está obligada a mostrarlo.
 *
 * Se pregunta por un buzón concreto y no en general porque contacto y
 * calculadora tienen destinatarios distintos: tener configurado el de contacto
 * no autoriza a enviar cotizaciones a ninguna parte.
 */
export function puedeEnviarCorreo(buzon: string | undefined): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM && buzon)
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
