import { expect, test, type APIRequestContext } from '@playwright/test'

/**
 * Pruebas de las funciones de ingestión, contra la función **real**.
 *
 * `scripts/static-server.mjs` sirve `/api/*` invocando los handlers de
 * `netlify/functions/`, así que esto ejercita la validación de verdad y el motor
 * de verdad, sin necesitar el CLI de Netlify.
 *
 * ⚠️ Estas pruebas existen porque un intento anterior de comprobar lo mismo con
 * `curl` construía el JSON concatenando cadenas en el shell y producía payloads
 * corruptos: los tres casos devolvían `validation`, pero por el motivo
 * equivocado, y parecían pasar. Aquí el payload se construye como objeto y lo
 * serializa Playwright, que es la única forma de que la prueba compruebe lo que
 * dice comprobar.
 */

/** Sobre válido. Cada prueba clona esto y estropea una sola cosa. */
function sobreValido(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0',
    submissionId: crypto.randomUUID(),
    type: 'quote_request',
    locale: 'es',
    createdAt: new Date().toISOString(),
    privacy: { acknowledged: true, noticeVersion: '2026-07-28' },
    marketing: { optIn: false, textVersion: '2026-07-28' },
    contact: {
      firstName: 'Ana',
      lastName: 'García Pérez',
      company: 'Acme Industrial S.A.',
      email: 'ana@acme.com',
    },
    data: {
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
    },
    // Tiempo suficiente para no parecer un bot.
    antispam: { honeypot: '', renderedAt: Date.now() - 10_000 },
    ...overrides,
  }
}

const cotizar = (request: APIRequestContext, cuerpo: unknown) =>
  request.post('/api/quote', {
    data: cuerpo,
    headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' },
  })

test.describe('POST /api/quote', () => {
  test('el caso de oro del Excel da 815 – 900 € y tamaño S', async ({ request }) => {
    // Es la prueba que de verdad importa: si el precio cambia, algo se ha roto
    // entre el contrato, el mapeo de enums y el motor.
    const respuesta = await cotizar(request, sobreValido())
    expect(respuesta.status()).toBe(200)

    const cuerpo = await respuesta.json()
    expect(cuerpo.ok).toBe(true)
    expect(cuerpo.quote.size).toBe('S')
    expect(cuerpo.quote.licenceCents).toBe(7500)
    expect(cuerpo.quote.auditCents).toBe(33583)
    expect(cuerpo.quote.managedRangeCents).toEqual([40500, 49000])
    expect(cuerpo.quote.totalRangeCents).toEqual([81500, 90000])
    expect(cuerpo.quote.currency).toBe('EUR')
  })

  test('no devuelve nada del modelo economico', async ({ request }) => {
    // El DTO publico y solo el DTO publico: ni horas internas, ni tarifa
    // efectiva, ni margen, ni coeficientes.
    const texto = await (await cotizar(request, sobreValido())).text()
    for (const prohibido of [
      'technicalHours',
      'auditHoursAnnual',
      'managedServiceCents',
      'exactTotalCents',
      'effectiveRate',
      'grossMargin',
      'tarifa',
      'coef',
    ]) {
      expect(texto, `la respuesta contiene "${prohibido}"`).not.toContain(prohibido)
    }
  })

  test('la referencia se deriva del submissionId, para que un reintento la repita', async ({
    request,
  }) => {
    const sobre = sobreValido()
    const a = await (await cotizar(request, sobre)).json()
    const b = await (await cotizar(request, sobre)).json()
    expect(a.reference).toBe(b.reference)
  })

  test.describe('rechazos', () => {
    test('CPD propio con servidores externos: 400 con su codigo', async ({ request }) => {
      // Bloqueante B06: no se normaliza en silencio. Poner los servidores
      // incompatibles a cero produciria una cotizacion mas barata que la real.
      const sobre = sobreValido()
      const respuesta = await cotizar(request, {
        ...sobre,
        data: { ...sobre.data, cpd: 'own', physicalServersExternal: 2 },
      })

      expect(respuesta.status()).toBe(400)
      const cuerpo = await respuesta.json()
      expect(cuerpo.ok).toBe(false)
      expect(cuerpo.error).toBe('validation')
      // El codigo llega por campo, para que el cliente pinte el mensaje
      // traducido en el sitio correcto.
      expect(JSON.stringify(cuerpo.fields)).toContain('cpdPropioConServidoresExternos')
    })

    test('CPD externo con servidores propios: 400', async ({ request }) => {
      const sobre = sobreValido()
      const respuesta = await cotizar(request, {
        ...sobre,
        data: { ...sobre.data, cpd: 'external', virtualServersOwn: 3 },
      })
      expect(respuesta.status()).toBe(400)
      expect(JSON.stringify(await respuesta.json())).toContain('cpdExternoConServidoresPropios')
    })

    test('el caso de hibrido cambiado a propio conservando los valores', async ({ request }) => {
      // La persona rellena los cuatro campos en «Hibrido» y cambia a «Propio».
      // Los externos siguen en el estado aunque sus campos esten ocultos.
      const sobre = sobreValido()
      const respuesta = await cotizar(request, {
        ...sobre,
        data: {
          ...sobre.data,
          cpd: 'own',
          physicalServersOwn: 2,
          virtualServersOwn: 4,
          physicalServersExternal: 3,
          virtualServersExternal: 6,
        },
      })
      expect(respuesta.status()).toBe(400)
    })

    test('un total inventado por el navegador se rechaza', async ({ request }) => {
      // No porque su nombre este en una lista negra, sino porque el esquema es
      // estricto y no admite claves que no espera. Es lo que hace que la lista
      // de MIG-02 §6.6 no haga falta como filtro de subcadenas — la que incluye
      // `hours` y romperia el campo legitimo `consultingHours`.
      const respuesta = await cotizar(request, { ...sobreValido(), total: 1, quote: { a: 1 } })
      expect(respuesta.status()).toBe(400)
    })

    test('consultingHours SI se acepta, aunque contenga "hours"', async ({ request }) => {
      // La otra mitad de la prueba anterior: la proteccion no puede cargarse un
      // campo valido.
      const sobre = sobreValido()
      for (const horas of [0, 2, 4, 6]) {
        const respuesta = await cotizar(request, {
          ...sobre,
          submissionId: crypto.randomUUID(),
          data: { ...sobre.data, consultingHours: horas },
        })
        expect(respuesta.status(), `consultingHours: ${horas}`).toBe(200)
      }
    })

    test('valores fuera de rango y no enteros', async ({ request }) => {
      const sobre = sobreValido()
      for (const data of [
        { users: -1 },
        { users: 0 },
        { users: 10.5 },
        { users: 2001 },
        { sites: 0 },
        { consultingHours: 3 },
        { cpd: 'nube' },
        { module: 'inventado' },
      ]) {
        const respuesta = await cotizar(request, {
          ...sobre,
          submissionId: crypto.randomUUID(),
          data: { ...sobre.data, ...data },
        })
        expect(respuesta.status(), JSON.stringify(data)).toBe(400)
      }
    })

    test('sin la casilla de privacidad no se procesa', async ({ request }) => {
      const respuesta = await cotizar(request, {
        ...sobreValido(),
        privacy: { acknowledged: false, noticeVersion: '2026-07-28' },
      })
      expect(respuesta.status()).toBe(400)
    })
  })

  test.describe('antispam', () => {
    test('honeypot relleno: exito silencioso y SIN precio', async ({ request }) => {
      // Al bot no se le dice que se le ha detectado, porque entonces prueba otra
      // cosa. Pero tampoco se le da el precio.
      const respuesta = await cotizar(request, {
        ...sobreValido(),
        antispam: { honeypot: 'soy-un-bot', renderedAt: Date.now() - 10_000 },
      })

      expect(respuesta.status()).toBe(200)
      const cuerpo = await respuesta.json()
      expect(cuerpo.ok).toBe(true)
      expect(cuerpo.quote).toBeNull()
      expect(cuerpo.delivery).toBe('skipped')
    })

    test('envio demasiado rapido: exito silencioso y SIN precio', async ({ request }) => {
      const respuesta = await cotizar(request, {
        ...sobreValido(),
        antispam: { honeypot: '', renderedAt: Date.now() },
      })
      expect(respuesta.status()).toBe(200)
      expect((await respuesta.json()).quote).toBeNull()
    })

    test('un reloj adelantado no se toma por bot', async ({ request }) => {
      // `renderedAt` viene del cliente y puede estar desajustado. Una marca en el
      // futuro no es comprobable, pero tampoco motivo para descartar a alguien.
      const respuesta = await cotizar(request, {
        ...sobreValido(),
        antispam: { honeypot: '', renderedAt: Date.now() + 600_000 },
      })
      expect((await respuesta.json()).quote).not.toBeNull()
    })
  })

  test.describe('superficie', () => {
    test('GET no esta permitido', async ({ request }) => {
      const respuesta = await request.get('/api/quote')
      expect(respuesta.status()).toBe(405)
      expect(respuesta.headers()['allow']).toBe('POST')
    })

    test('Content-Type que no sea JSON: 415', async ({ request }) => {
      const respuesta = await request.post('/api/quote', {
        data: 'sites=1',
        headers: { 'Content-Type': 'text/plain', 'Sec-Fetch-Site': 'same-origin' },
      })
      expect(respuesta.status()).toBe(415)
    })

    test('peticion de otro sitio: 403', async ({ request }) => {
      const respuesta = await request.post('/api/quote', {
        data: sobreValido(),
        headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' },
      })
      expect(respuesta.status()).toBe(403)
    })

    test('cuerpo mayor de 32 KB: 413', async ({ request }) => {
      const sobre = sobreValido()
      const respuesta = await cotizar(request, {
        ...sobre,
        contact: { ...sobre.contact, company: 'x'.repeat(40_000) },
      })
      expect(respuesta.status()).toBe(413)
    })

    test('JSON invalido: 400', async ({ request }) => {
      const respuesta = await request.post('/api/quote', {
        data: '{no soy json',
        headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' },
      })
      expect(respuesta.status()).toBe(400)
    })

    test('las respuestas no se cachean', async ({ request }) => {
      // Llevan datos de una persona concreta.
      const cabeceras = (await cotizar(request, sobreValido())).headers()
      expect(cabeceras['cache-control']).toBe('no-store')
      expect(cabeceras['x-content-type-options']).toBe('nosniff')
    })
  })
})

test.describe('POST /api/contact', () => {
  const contactoValido = () => ({
    schemaVersion: '1.0',
    submissionId: crypto.randomUUID(),
    type: 'contact',
    locale: 'es',
    createdAt: new Date().toISOString(),
    privacy: { acknowledged: true, noticeVersion: '2026-07-28' },
    marketing: { optIn: false, textVersion: '2026-07-28' },
    contact: {
      firstName: 'Ana',
      lastName: 'García Pérez',
      company: 'Acme Industrial S.A.',
      email: 'ana@acme.com',
    },
    data: { need: 'MSSP OT', message: 'Hola' },
    antispam: { honeypot: '', renderedAt: Date.now() - 10_000 },
  })

  const enviar = (request: APIRequestContext, cuerpo: unknown) =>
    request.post('/api/contact', {
      data: cuerpo,
      headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' },
    })

  test('un envio valido se acepta', async ({ request }) => {
    const respuesta = await enviar(request, contactoValido())
    expect(respuesta.status()).toBe(200)
    const cuerpo = await respuesta.json()
    expect(cuerpo.ok).toBe(true)
    expect(cuerpo.reference).toHaveLength(8)
  })

  test('nombre demasiado corto: 400', async ({ request }) => {
    const base = contactoValido()
    const respuesta = await enviar(request, {
      ...base,
      contact: { ...base.contact, firstName: 'A' },
    })
    expect(respuesta.status()).toBe(400)
  })

  test('un mensaje de mas de 1000 caracteres: 400', async ({ request }) => {
    const base = contactoValido()
    const respuesta = await enviar(request, {
      ...base,
      data: { ...base.data, message: 'x'.repeat(1001) },
    })
    expect(respuesta.status()).toBe(400)
  })

  test('no acepta destinatario ni plantilla del cliente', async ({ request }) => {
    // El cliente no puede decidir a quien se escribe ni con que plantilla.
    for (const extra of [{ to: 'atacante@example.com' }, { template: 'x' }, { from: 'a@b.c' }]) {
      const respuesta = await enviar(request, { ...contactoValido(), ...extra })
      expect(respuesta.status(), JSON.stringify(extra)).toBe(400)
    }
  })
})
