import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './contact.ts'

/**
 * Pruebas de `POST /api/contact`.
 *
 * Resend no se llama de verdad: se sustituye `fetch`. Lo que se comprueba no es
 * que Resend funcione -eso es cosa suya- sino las tres cosas que dependen de
 * nosotros y que, si se rompen, se rompen en silencio:
 *
 * 1. Que sin claves NO se envía y se dice (`delivery: 'skipped'`).
 * 2. Que si Resend falla NO se responde «recibido».
 * 3. Que ni el asunto ni las trazas llevan datos personales.
 */

const SUBMISSION_ID = '550e8400-e29b-41d4-a716-446655440000'

/** Envío válido, con el tiempo del antispam ya superado. */
const cuerpoValido = () => ({
  schemaVersion: '1.0',
  submissionId: SUBMISSION_ID,
  type: 'contact',
  locale: 'es',
  createdAt: '2026-07-30T10:00:00.000Z',
  privacy: { acknowledged: true, noticeVersion: '2026-07-28' },
  marketing: { optIn: false, textVersion: '2026-07-28' },
  contact: {
    firstName: 'María José',
    lastName: 'García Pérez',
    company: 'Acme Industrial S.A.',
    email: 'maria@acme.example',
    phone: '+34 600 000 000',
    title: 'CISO',
  },
  data: { need: 'MSSP OT', message: 'Tenemos dos plantas con PLC antiguos.' },
  antispam: { honeypot: '', renderedAt: Date.now() - 10_000 },
})

const peticion = (cuerpo: unknown) =>
  new Request('https://www.secnorthlabs.eu/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify(cuerpo),
  })

/** Respuesta de Resend cuando acepta el envío. */
const resendOk = () =>
  new Response(JSON.stringify({ id: 'a1b2c3' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

let traza: string[]

beforeEach(() => {
  traza = []
  vi.spyOn(console, 'log').mockImplementation((linea: unknown) => {
    traza.push(String(linea))
  })
  process.env.RESEND_API_KEY = 're_prueba'
  process.env.RESEND_FROM = 'ISN Labs Web <web@secnorthlabs.eu>'
  process.env.CONTACT_MAILBOX_TO = 'info@secnorthlabs.eu'
  process.env.MAIL_ENVIRONMENT = 'production'
})

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.RESEND_API_KEY
  delete process.env.RESEND_FROM
  delete process.env.CONTACT_MAILBOX_TO
  delete process.env.MAIL_ENVIRONMENT
})

describe('contact', () => {
  it('envía a Resend y responde delivery: sent', async () => {
    const llamada = vi.fn().mockResolvedValue(resendOk())
    vi.stubGlobal('fetch', llamada)

    const respuesta = await handler(peticion(cuerpoValido()))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(respuesta.status).toBe(200)
    expect(datos.delivery).toBe('sent')
    expect(datos.reference).toBe('550E8400')
    expect(llamada).toHaveBeenCalledTimes(1)

    const [url, opciones] = llamada.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    const enviado = JSON.parse(opciones.body as string) as Record<string, unknown>

    // El destinatario sale del entorno, nunca del cuerpo de la petición.
    expect(enviado.to).toEqual(['info@secnorthlabs.eu'])
    // Responder al aviso escribe a la persona, no al buzón.
    expect(enviado.reply_to).toBe('maria@acme.example')
    // Idempotencia: un doble clic no produce dos correos.
    expect((opciones.headers as Record<string, string>)['Idempotency-Key']).toBe(
      `isnlabs/production/contact/${SUBMISSION_ID}`,
    )
  })

  it('no pone datos personales en el asunto', async () => {
    const llamada = vi.fn().mockResolvedValue(resendOk())
    vi.stubGlobal('fetch', llamada)

    await handler(peticion(cuerpoValido()))

    const enviado = JSON.parse(
      (llamada.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, string>

    for (const dato of ['María', 'García', 'maria@acme.example', '600 000 000', 'Acme']) {
      expect(enviado.subject).not.toContain(dato)
    }
    expect(enviado.subject).toContain('MSSP OT')
    expect(enviado.subject).toContain('550E8400')
  })

  it('escapa el HTML del mensaje', async () => {
    const llamada = vi.fn().mockResolvedValue(resendOk())
    vi.stubGlobal('fetch', llamada)

    const cuerpo = cuerpoValido()
    cuerpo.data.message = '<img src=x onerror="alert(1)">'
    await handler(peticion(cuerpo))

    const enviado = JSON.parse(
      (llamada.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, string>

    expect(enviado.html).not.toContain('<img src=x')
    expect(enviado.html).toContain('&lt;img src=x')
  })

  it('compone el aviso en inglés cuando el envío es en inglés', async () => {
    const llamada = vi.fn().mockResolvedValue(resendOk())
    vi.stubGlobal('fetch', llamada)

    const cuerpo = cuerpoValido()
    cuerpo.locale = 'en'
    await handler(peticion(cuerpo))

    const enviado = JSON.parse(
      (llamada.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, string>

    expect(enviado.subject).toContain('Website contact')
    expect(enviado.html).toContain('New website enquiry')
  })

  it('responde 503 y no dice «recibido» si Resend falla', async () => {
    const llamada = vi.fn().mockResolvedValue(new Response('', { status: 500 }))
    vi.stubGlobal('fetch', llamada)

    const respuesta = await handler(peticion(cuerpoValido()))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(respuesta.status).toBe(503)
    expect(datos.ok).toBe(false)
    expect(datos.error).toBe('unavailable')
    // Un 5xx puede ser transitorio: se reintenta una vez, y solo una.
    expect(llamada).toHaveBeenCalledTimes(2)
  })

  it('no reintenta un 4xx de Resend', async () => {
    const llamada = vi.fn().mockResolvedValue(new Response('', { status: 422 }))
    vi.stubGlobal('fetch', llamada)

    const respuesta = await handler(peticion(cuerpoValido()))

    expect(respuesta.status).toBe(503)
    expect(llamada).toHaveBeenCalledTimes(1)
  })

  it('sin buzón configurado entra en modo prueba y no llama a Resend', async () => {
    delete process.env.CONTACT_MAILBOX_TO
    const llamada = vi.fn()
    vi.stubGlobal('fetch', llamada)

    const respuesta = await handler(peticion(cuerpoValido()))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(respuesta.status).toBe(200)
    expect(datos.delivery).toBe('skipped')
    expect(llamada).not.toHaveBeenCalled()
  })

  it('descarta el bot en silencio, sin enviar nada', async () => {
    const llamada = vi.fn()
    vi.stubGlobal('fetch', llamada)

    const cuerpo = cuerpoValido()
    cuerpo.antispam.honeypot = 'https://spam.example'
    const respuesta = await handler(peticion(cuerpo))
    const datos = (await respuesta.json()) as Record<string, unknown>

    // La respuesta es indistinguible de la buena: al bot no se le avisa.
    expect(respuesta.status).toBe(200)
    expect(datos.ok).toBe(true)
    expect(llamada).not.toHaveBeenCalled()
  })

  it('no registra ningún dato personal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resendOk()))

    await handler(peticion(cuerpoValido()))

    expect(traza).toHaveLength(1)
    const linea = traza[0] as string
    for (const dato of [
      'María',
      'García',
      'maria@acme.example',
      '600 000 000',
      'Acme',
      'PLC',
      'MSSP OT',
    ]) {
      expect(linea).not.toContain(dato)
    }
    expect(linea).toContain(SUBMISSION_ID)
    expect(linea).toContain('enviado')
  })

  it('acepta un envío sin apellidos', async () => {
    const llamada = vi.fn().mockResolvedValue(resendOk())
    vi.stubGlobal('fetch', llamada)

    const cuerpo = cuerpoValido()
    cuerpo.contact.lastName = ''
    const respuesta = await handler(peticion(cuerpo))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(respuesta.status).toBe(200)
    expect(datos.delivery).toBe('sent')

    const enviado = JSON.parse(
      (llamada.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, string>
    // El nombre no debe quedar con un espacio colgando al final.
    expect(enviado.text).toContain('Nombre: María José\n')
  })

  it('rechaza una necesidad que no esté en el desplegable', async () => {
    const llamada = vi.fn()
    vi.stubGlobal('fetch', llamada)

    const cuerpo = cuerpoValido()
    cuerpo.data.need = 'Compre criptomonedas en ejemplo.com'
    const respuesta = await handler(peticion(cuerpo))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(respuesta.status).toBe(400)
    expect((datos.fields as Record<string, string>)['data.need']).toBe('need')
    expect(llamada).not.toHaveBeenCalled()
  })

  it('rechaza un salto de línea en un campo de una sola línea', async () => {
    const llamada = vi.fn()
    vi.stubGlobal('fetch', llamada)

    // Inyección de cabeceras: si esto pasara, el `\n` cerraría el asunto y lo
    // que va detrás se convertiría en una cabecera nueva del correo.
    const cuerpo = cuerpoValido()
    cuerpo.contact.company = 'Acme\r\nBcc: victima@example.com'
    const respuesta = await handler(peticion(cuerpo))

    expect(respuesta.status).toBe(400)
    expect(llamada).not.toHaveBeenCalled()
  })

  it('conserva los saltos de línea del mensaje, que sí es multilínea', async () => {
    const llamada = vi.fn().mockResolvedValue(resendOk())
    vi.stubGlobal('fetch', llamada)

    const cuerpo = cuerpoValido()
    cuerpo.data.message = 'Primera línea.\r\n\r\nSegunda línea.'
    const respuesta = await handler(peticion(cuerpo))

    expect(respuesta.status).toBe(200)
    const enviado = JSON.parse(
      (llamada.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as Record<string, string>
    expect(enviado.html).toContain('Primera línea.<br /><br />Segunda línea.')
  })

  it('rechaza un campo que el esquema no admite', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const cuerpo = { ...cuerpoValido(), total: 840 }
    const respuesta = await handler(peticion(cuerpo))

    expect(respuesta.status).toBe(400)
  })
})
