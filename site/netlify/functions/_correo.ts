/**
 * Envío de correo con Resend.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Se llama a la API REST con `fetch` y no con el SDK `resend`. Motivo: el SDK
 * arrastra dependencias para un único `POST` de tres campos, y estas funciones
 * las empaqueta Netlify por su cuenta -cuanto menos haya que empaquetar, menos
 * hay que auditar-. La API es estable y está versionada por URL.
 *
 * Nada de lo que hay aquí acepta destinatario, remitente, asunto ni plantilla
 * del navegador: todo sale de variables de entorno o de las plantillas del
 * repositorio (MIG-02 §4.2).
 * ═══════════════════════════════════════════════════════════════════════════
 */

const URL_RESEND = 'https://api.resend.com/emails'

/**
 * Deja un valor apto para una cabecera de correo.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **Segunda barrera, a sabiendas de que hay una primera.** Los esquemas de
 * `_comun.ts` ya rechazan los caracteres de control en todo lo que llega del
 * formulario, así que en teoría aquí no puede entrar un salto de línea.
 *
 * Se limpia igualmente porque esta función no sabe de dónde viene lo que le
 * pasan, y el día que alguien componga un asunto a partir de un campo nuevo sin
 * acordarse de validarlo, la inyección de cabeceras se para aquí. Una defensa
 * que depende de que todos los que llamen hayan hecho los deberes no es una
 * defensa.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const unaLinea = (valor: string) => valor.replace(/[\p{Cc}]+/gu, ' ').trim()

/** Corta el intento antes de que Netlify corte la función entera. */
const TIEMPO_MAXIMO_MS = 8000

export interface CorreoSaliente {
  /** Buzón de destino. Siempre de una variable de entorno, nunca del cliente. */
  para: string
  asunto: string
  html: string
  /** Alternativa en texto plano. No es opcional: sin ella sube el riesgo de spam. */
  texto: string
  /** A dónde responde quien lee el correo. Aquí sí va el correo del visitante. */
  responderA?: string
  /**
   * Clave de idempotencia. Resend la conserva 24 h, así que dos envíos del mismo
   * `submissionId` -un doble clic, un reintento tras un fallo de red- no
   * producen dos correos.
   */
  idempotencia: string
  /** Cabeceras propias. Solo datos no personales (MIG-02 §10.4). */
  cabeceras?: Record<string, string>
  /** Etiquetas de Resend. Solo letras, números, guion y subrayado. Sin PII. */
  etiquetas?: Record<string, string>
}

export type ResultadoEnvio =
  | { ok: true; id: string }
  /** `codigo` es el estado HTTP de Resend, o 0 si no se llegó a hablar con él. */
  | { ok: false; codigo: number }

/**
 * Manda un correo. Devuelve el resultado en lugar de lanzar: quien llama tiene
 * que poder distinguir «no se ha registrado» de «no se ha podido avisar», y esa
 * decisión no es de esta capa.
 */
export async function enviarCorreo(correo: CorreoSaliente): Promise<ResultadoEnvio> {
  const clave = process.env.RESEND_API_KEY
  const remitente = process.env.RESEND_FROM
  if (!clave || !remitente) return { ok: false, codigo: 0 }

  const cuerpo = JSON.stringify({
    from: remitente,
    to: [correo.para],
    subject: unaLinea(correo.asunto),
    html: correo.html,
    text: correo.texto,
    ...(correo.responderA ? { reply_to: unaLinea(correo.responderA) } : {}),
    ...(correo.cabeceras
      ? { headers: Object.fromEntries(Object.entries(correo.cabeceras).map(([c, v]) => [c, unaLinea(v)])) }
      : {}),
    ...(correo.etiquetas
      ? { tags: Object.entries(correo.etiquetas).map(([name, value]) => ({ name, value })) }
      : {}),
  })

  // Dos intentos y no más. Una Netlify Function no es un worker: si Resend está
  // caído, se responde 503 y quien envía el formulario lo reintenta viendo el
  // error, que es más honesto que dejarle esperando (MIG-02 §21.1).
  let ultimo: ResultadoEnvio = { ok: false, codigo: 0 }

  for (let intento = 0; intento < 2; intento++) {
    ultimo = await intentar(cuerpo, clave, correo.idempotencia)
    if (ultimo.ok) return ultimo

    // Un 4xx no mejora repitiéndolo: el cuerpo o la clave están mal. Solo se
    // reintenta lo que puede ser transitorio.
    const transitorio = ultimo.codigo === 0 || ultimo.codigo === 429 || ultimo.codigo >= 500
    if (!transitorio) return ultimo

    if (intento === 0) await new Promise((listo) => setTimeout(listo, 400))
  }

  return ultimo
}

async function intentar(
  cuerpo: string,
  clave: string,
  idempotencia: string,
): Promise<ResultadoEnvio> {
  let respuesta: Response
  try {
    respuesta = await fetch(URL_RESEND, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clave}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencia,
      },
      body: cuerpo,
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    })
  } catch {
    // Red, DNS o timeout. No se registra el error: puede llevar la URL con la
    // clave o trozos del cuerpo, y en el cuerpo van datos personales.
    return { ok: false, codigo: 0 }
  }

  if (!respuesta.ok) return { ok: false, codigo: respuesta.status }

  try {
    const datos = (await respuesta.json()) as { id?: unknown }
    // Sin `id` no hay constancia de que Resend lo haya aceptado, y decir
    // «enviado» sin constancia es exactamente lo que no se puede hacer.
    if (typeof datos.id !== 'string') return { ok: false, codigo: respuesta.status }
    return { ok: true, id: datos.id }
  } catch {
    return { ok: false, codigo: respuesta.status }
  }
}
