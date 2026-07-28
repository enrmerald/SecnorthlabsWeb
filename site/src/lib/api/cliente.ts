/**
 * Cliente de la API (seccion 6.2).
 *
 * El sitio no tiene servidor. El navegador llama a rutas **del propio dominio**
 * y Netlify las proxifica **firmadas** hacia el Web Gateway, que es quien tiene
 * el motor PBCG, el acceso a EspoCRM y el SMTP.
 *
 * Consecuencias para el codigo de aqui:
 *
 * - **Mismo origen**: no hay CORS, ni preflight, ni cabeceras que configurar.
 * - **Ningun secreto**: la firma la pone Netlify en el borde; el navegador solo
 *   ve `/api/…`.
 * - **El servidor recalcula siempre.** Nada de lo que se envie desde aqui como
 *   total, horquilla, tamano u horas se tiene por fiable: si viaja en el cuerpo,
 *   el gateway lo ignora.
 *
 * El endpoint devuelve **codigos**, no frases: el texto que ve la persona sale
 * de los ficheros de mensajes, para no duplicar copy en el servidor y para que
 * se traduzca.
 */

/** Rutas que consume el sitio. Netlify las traduce a `/web/v1/…`. */
export const RUTAS_API = {
  contacto: '/api/contact',
  cotizacionInicial: '/api/quote/initial',
  recotizacion: '/api/quote/recalculate',
  propuesta: '/api/quote/proposal',
  newsletter: '/api/newsletter',
} as const

export type CodigoError =
  | 'validation'
  | 'rateLimited'
  | 'tokenExpired'
  | 'network'
  | 'generic'

export type RespuestaApi<T> =
  | { ok: true; datos: T }
  | { ok: false; error: CodigoError; campos?: Record<string, string> }

/** Cuerpo maximo que acepta el gateway. Se comprueba tambien aqui para no
 *  gastar una peticion que va a devolver 413. */
const TAMANO_MAXIMO_BYTES = 32 * 1024

interface OpcionesEnvio {
  /** Cancela la peticion anterior al lanzar otra. Lo usa la recotizacion. */
  signal?: AbortSignal
  /** Evita que un doble clic genere dos envios. La valida el servidor. */
  claveIdempotencia?: string
}

export async function enviar<T>(
  ruta: string,
  cuerpo: unknown,
  { signal, claveIdempotencia }: OpcionesEnvio = {},
): Promise<RespuestaApi<T>> {
  const serializado = JSON.stringify(cuerpo)

  if (new Blob([serializado]).size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, error: 'validation' }
  }

  let respuesta: Response
  try {
    respuesta = await fetch(ruta, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(claveIdempotencia ? { 'Idempotency-Key': claveIdempotencia } : {}),
      },
      body: serializado,
      signal,
    })
  } catch (error) {
    // Un abort es una cancelacion deliberada, no un fallo de red: se propaga
    // para que quien llamo pueda ignorarlo en lugar de pintar un error.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return { ok: false, error: 'network' }
  }

  if (respuesta.status === 429) return { ok: false, error: 'rateLimited' }
  if (respuesta.status === 410) return { ok: false, error: 'tokenExpired' }

  let datos: unknown
  try {
    datos = await respuesta.json()
  } catch {
    return { ok: false, error: 'generic' }
  }

  if (!respuesta.ok || !esRespuestaOk(datos)) {
    const campos =
      typeof datos === 'object' && datos !== null && 'fields' in datos
        ? (datos.fields as Record<string, string>)
        : undefined
    const codigo =
      typeof datos === 'object' && datos !== null && 'error' in datos
        ? String(datos.error)
        : 'generic'

    // Los codigos que llegan del gateway se validan contra la lista conocida en
    // lugar de reenviarse tal cual: el cliente los usa para elegir un mensaje
    // traducido, y uno inesperado dejaria la interfaz sin nada que mostrar.
    return { ok: false, error: normalizarCodigo(codigo), campos }
  }

  return { ok: true, datos: datos as T }
}

const CODIGOS_CONOCIDOS = new Set<string>([
  'validation',
  'rateLimited',
  'tokenExpired',
  'network',
  'generic',
])

function normalizarCodigo(codigo: string): CodigoError {
  return CODIGOS_CONOCIDOS.has(codigo) ? (codigo as CodigoError) : 'generic'
}

function esRespuestaOk(datos: unknown): boolean {
  return typeof datos === 'object' && datos !== null && 'ok' in datos && datos.ok === true
}

/**
 * Clave de idempotencia generada en el cliente y validada en el servidor
 * (seccion 6.10, regla 7). Sin ella, un doble clic crea dos envios.
 */
export const nuevaClaveIdempotencia = (): string => crypto.randomUUID()
