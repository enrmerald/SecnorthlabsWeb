/**
 * Cliente de la API.
 *
 * El navegador llama a rutas **del propio dominio**, que Netlify resuelve a las
 * funciones de `netlify/functions/`. El sitio y las funciones viven en el mismo
 * proyecto de Netlify, así que:
 *
 * - **Mismo origen**: no hay CORS, ni preflight, ni cabeceras que configurar.
 * - **No hay proxy firmado.** MIG-02 §7 lo pedía porque el mailer iba a ser otro
 *   proyecto; al meterlo dentro de `site` ya no hay salto entre sitios que
 *   firmar. Y la firma JWS de Netlify solo funciona proxificando a sitios
 *   externos, de modo que tampoco habría funcionado.
 * - **Ningún secreto llega al navegador.** Las claves de Resend y de cifrado
 *   viven en las variables de entorno de la función, en servidor.
 * - **El servidor recalcula siempre.** Nada de lo que se envíe desde aquí como
 *   total, horquilla, tamaño u horas se tiene por fiable: si viaja en el cuerpo,
 *   la función lo ignora, porque su esquema no lo admite.
 *
 * La función devuelve **códigos**, no frases: el texto que ve la persona sale de
 * los ficheros de mensajes, para no duplicar copy en el servidor y para que se
 * traduzca.
 */
import type { Locale } from '@/config/routes'

/** Las dos únicas rutas que consume el sitio. */
export const RUTAS_API = {
  contacto: '/api/contact',
  cotizacion: '/api/quote',
} as const

export type CodigoError = 'validation' | 'rateLimited' | 'network' | 'generic'

export type RespuestaApi<T> =
  | { ok: true; datos: T }
  | { ok: false; error: CodigoError; campos?: Record<string, string> }

/** Lo que la función devuelve al cotizar. Espejo de `netlify/functions/quote.ts`. */
export interface RespuestaCotizacion {
  ok: true
  /** Referencia corta que la persona puede citar si escribe. */
  reference: string
  quote: {
    size: 'S' | 'M' | 'L'
    licenceCents: number
    auditCents: number
    managedRangeCents: [number, number]
    totalRangeCents: [number, number]
    currency: 'EUR'
  }
  /**
   * `sent` = se ha enviado el correo con la estimación y el aviso de ingestión.
   * `skipped` = **modo prueba**: se ha calculado pero no se ha enviado nada.
   *
   * La interfaz **tiene que mostrar** el caso `skipped`. Enseñar un precio sin
   * decir que no ha quedado registrado hace que alguien dé por hecho que hay un
   * lead esperando en el CRM.
   */
  delivery: 'sent' | 'skipped'
}

export interface RespuestaContacto {
  ok: true
  reference: string
  delivery: 'sent' | 'skipped'
}

/** Cabecera del sobre, común a los dos tipos (MIG-02 §6.3). */
export interface SobreBase {
  schemaVersion: '1.0'
  submissionId: string
  locale: Locale
  createdAt: string
  privacy: { acknowledged: boolean; noticeVersion: string }
  marketing: { optIn: boolean; textVersion: string }
  antispam: { honeypot: string; renderedAt: number }
}

/** Límite que aplica la función. Se comprueba aquí para no gastar un 413. */
const TAMANO_MAXIMO_BYTES = 32 * 1024

interface OpcionesEnvio {
  signal?: AbortSignal
}

export async function enviar<T>(
  ruta: string,
  cuerpo: unknown,
  { signal }: OpcionesEnvio = {},
): Promise<RespuestaApi<T>> {
  const serializado = JSON.stringify(cuerpo)

  if (new Blob([serializado]).size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, error: 'validation' }
  }

  let respuesta: Response
  try {
    respuesta = await fetch(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serializado,
      signal,
    })
  } catch (error) {
    // Un abort es una cancelación deliberada, no un fallo de red: se propaga
    // para que quien llamó pueda ignorarlo en lugar de pintar un error.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return { ok: false, error: 'network' }
  }

  if (respuesta.status === 429) return { ok: false, error: 'rateLimited' }

  let datos: unknown
  try {
    datos = await respuesta.json()
  } catch {
    return { ok: false, error: 'generic' }
  }

  if (!respuesta.ok || !esRespuestaOk(datos)) {
    const objeto = typeof datos === 'object' && datos !== null ? (datos as Record<string, unknown>) : {}
    return {
      ok: false,
      error: normalizarCodigo(String(objeto.error ?? 'generic')),
      campos: objeto.fields as Record<string, string> | undefined,
    }
  }

  return { ok: true, datos: datos as T }
}

const CODIGOS_CONOCIDOS = new Set<string>(['validation', 'rateLimited', 'network', 'generic'])

function normalizarCodigo(codigo: string): CodigoError {
  // Un código inesperado se degrada a genérico: si se reenviara tal cual, la
  // interfaz no encontraría su mensaje traducido y se quedaría en blanco.
  return CODIGOS_CONOCIDOS.has(codigo) ? (codigo as CodigoError) : 'generic'
}

function esRespuestaOk(datos: unknown): boolean {
  return typeof datos === 'object' && datos !== null && 'ok' in datos && datos.ok === true
}

/**
 * Identificador del envío, generado en el cliente.
 *
 * Es la clave de deduplicación: el mismo `submissionId` reenviado no debe crear
 * dos Leads. Se genera **una vez por formulario**, no por intento, para que un
 * reintento tras un fallo de red no cuente como envío nuevo.
 */
export const nuevoSubmissionId = (): string => crypto.randomUUID()
