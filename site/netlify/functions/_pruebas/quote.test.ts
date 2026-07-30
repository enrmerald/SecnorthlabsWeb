import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../quote.ts'

/**
 * Pruebas de `POST /api/quote`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * La razon de ser de este fichero es el primer bloque de pruebas: **la entrega
 * cifrada del lead no esta implementada, y la funcion no puede decir que si**.
 *
 * Antes, `delivery` se derivaba de `puedeEnviarCorreo(buzonIngestion())`. Como
 * `RESEND_API_KEY` y `RESEND_FROM` ya estan definidas en produccion para el
 * formulario de contacto, bastaba con que alguien creara `LEAD_MAILBOX_TO` para
 * que esta funcion empezara a responder `'sent'` sin enviar nada: el visitante
 * veria su precio y su referencia, nadie recibiria el lead, y no habria ni una
 * traza que lo delatara. No habia ninguna prueba que lo cazara, y por eso se
 * escriben estas.
 *
 * Lo demas que se comprueba aqui es lo que tampoco puede romperse en silencio:
 * que el bot no recibe precio, que la respuesta no lleva ni un coeficiente del
 * modelo economico y que las trazas no llevan datos personales.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SUBMISSION_ID = '550e8400-e29b-41d4-a716-446655440000'

/** El caso de oro del Excel, en el idioma del contrato (§6.5). */
const ORO = {
  sites: 1,
  users: 25,
  cpd: 'external',
  physicalServersOwn: 0,
  virtualServersOwn: 0,
  physicalServersExternal: 1,
  virtualServersExternal: 3,
  otInstallations: 0,
  edr: 'edr',
  licensesIncluded: true,
  backup: true,
  firewalls: 1,
  siem: false,
  patching: false,
  consultingHours: 2,
  module: 'ensMedium',
}

/** Envio valido, con el tiempo del antispam ya superado. */
const cuerpoValido = () => ({
  schemaVersion: '1.0',
  submissionId: SUBMISSION_ID,
  type: 'quote_request',
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
  },
  data: { ...ORO },
  antispam: { honeypot: '', renderedAt: Date.now() - 10_000 },
})

const peticion = (cuerpo: unknown) =>
  new Request('https://www.secnorthlabs.eu/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify(cuerpo),
  })

let traza: string[]

beforeEach(() => {
  traza = []
  vi.spyOn(console, 'log').mockImplementation((linea: unknown) => {
    traza.push(String(linea))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.RESEND_API_KEY
  delete process.env.RESEND_FROM
  delete process.env.LEAD_MAILBOX_TO
})

describe('quote · la entrega no implementada no puede declararse hecha', () => {
  it('sin variables de entorno responde delivery: skipped', async () => {
    const respuesta = await handler(peticion(cuerpoValido()))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(respuesta.status).toBe(200)
    expect(datos.delivery).toBe('skipped')
  })

  it('CON las tres variables definidas sigue respondiendo skipped', async () => {
    // Este es el escenario que fallaba: el dia que exista el buzon de ingestion,
    // la funcion NO puede empezar a decir «enviado» solo porque el entorno este
    // completo. Mientras el TODO de la entrega siga abierto, la respuesta honesta
    // es 'skipped'.
    process.env.RESEND_API_KEY = 're_prueba'
    process.env.RESEND_FROM = 'ISN Labs Web <web@secnorthlabs.eu>'
    process.env.LEAD_MAILBOX_TO = 'leads-ingest@secnorthlabs.eu'

    const llamada = vi.fn()
    vi.stubGlobal('fetch', llamada)

    const respuesta = await handler(peticion(cuerpoValido()))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(datos.delivery).toBe('skipped')
    // Y no se ha intentado enviar nada, que es la otra mitad de la afirmacion:
    // 'skipped' con una llamada a Resend detras seria igual de mentira.
    expect(llamada).not.toHaveBeenCalled()
  })
})

describe('quote · calculo y respuesta', () => {
  it('devuelve el precio y una referencia derivada del submissionId', async () => {
    const respuesta = await handler(peticion(cuerpoValido()))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(datos.ok).toBe(true)
    expect(datos.reference).toBe('550E8400')

    const quote = datos.quote as Record<string, unknown>
    expect(quote.size).toBe('S')
    expect(quote.currency).toBe('EUR')
    expect(Array.isArray(quote.totalRangeCents)).toBe(true)
  })

  it('la respuesta NO lleva nada del modelo interno', async () => {
    const respuesta = await handler(peticion(cuerpoValido()))
    const quote = ((await respuesta.json()) as Record<string, unknown>).quote as Record<
      string,
      unknown
    >

    // `toPublicDto()` es el unico camino de salida, y esto lo comprueba desde
    // fuera: ni horas internas, ni total exacto, ni tarifa efectiva, ni margen.
    for (const prohibido of [
      'technicalHours',
      'auditHoursMonthly',
      'auditHoursAnnual',
      'managedServiceCents',
      'exactTotalCents',
      'totalCents',
      'modelVersion',
    ]) {
      expect(quote).not.toHaveProperty(prohibido)
    }
  })

  it('rechaza un total inventado por el cliente', async () => {
    // El esquema es `.strict()`: una clave que no espera es un 400, no un campo
    // que se ignora. Es lo que impide que el navegador imponga su propio precio.
    const cuerpo = { ...cuerpoValido(), totalCents: 1 }

    const respuesta = await handler(peticion(cuerpo))

    expect(respuesta.status).toBe(400)
  })

  it('rechaza la incoherencia CPD ↔ servidores en lugar de abaratar', async () => {
    // Bloqueante B06: poner a cero los servidores incompatibles y seguir
    // calculando produce una cotizacion mas barata que la real.
    const cuerpo = cuerpoValido()
    cuerpo.data = { ...ORO, cpd: 'own' }

    const respuesta = await handler(peticion(cuerpo))
    const datos = (await respuesta.json()) as Record<string, unknown>

    expect(respuesta.status).toBe(400)
    expect(datos.error).toBe('validation')
  })
})

describe('quote · antispam y trazas', () => {
  it('honeypot relleno: exito silencioso y sin precio', async () => {
    const cuerpo = cuerpoValido()
    cuerpo.antispam.honeypot = 'https://spam.example'

    const respuesta = await handler(peticion(cuerpo))
    const datos = (await respuesta.json()) as Record<string, unknown>

    // Al bot no se le dice que se le ha detectado, pero tampoco se le calcula.
    expect(respuesta.status).toBe(200)
    expect(datos.ok).toBe(true)
    expect(datos.quote).toBeNull()
    expect(traza.join('\n')).toContain('descartado_antispam')
  })

  it('las trazas no llevan ningun dato personal', async () => {
    await handler(peticion(cuerpoValido()))

    const todo = traza.join('\n')
    for (const dato of [
      'María José',
      'García Pérez',
      'Acme Industrial',
      'maria@acme.example',
      '600 000 000',
    ]) {
      expect(todo).not.toContain(dato)
    }
    // Lo que si debe estar: el identificador con el que responder una consulta.
    expect(todo).toContain(SUBMISSION_ID)
  })
})
