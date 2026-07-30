import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './csp-report.ts'

/**
 * Pruebas del sumidero de informes de la CSP.
 *
 * Lo que importa comprobar de un endpoint publico que escribe en las trazas es
 * que **no escriba lo que no debe**: un informe de CSP puede llevar un trozo del
 * script bloqueado y la URL completa del documento, con su query.
 */

const peticion = (cuerpo: unknown, tipo = 'application/csp-report') =>
  new Request('https://www.secnorthlabs.eu/api/csp-report', {
    method: 'POST',
    headers: { 'Content-Type': tipo },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
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
})

describe('csp-report', () => {
  it('registra la directiva y el host bloqueado del formato clasico', async () => {
    const respuesta = await handler(
      peticion({
        'csp-report': {
          'effective-directive': 'script-src',
          'blocked-uri': 'https://consent.cookiebot.com/uc.js',
          'document-uri': 'https://www.secnorthlabs.eu/es/contacto/',
        },
      }),
    )

    expect(respuesta.status).toBe(204)
    const todo = traza.join('\n')
    expect(todo).toContain('script-src')
    expect(todo).toContain('consent.cookiebot.com')
  })

  it('entiende el formato en lote de la Reporting API', async () => {
    const respuesta = await handler(
      peticion(
        [
          {
            type: 'csp-violation',
            body: {
              effectiveDirective: 'connect-src',
              blockedURL: 'https://consentcdn.cookiebot.com/sdk',
              documentURL: 'https://www.secnorthlabs.eu/en/',
            },
          },
          // Un informe que no es de CSP: se ignora, no se registra como violacion.
          { type: 'deprecation', body: {} },
        ],
        'application/reports+json',
      ),
    )

    expect(respuesta.status).toBe(204)
    expect(traza).toHaveLength(1)
    expect(traza[0]).toContain('connect-src')
  })

  it('NO registra la query del documento ni el trozo de script', async () => {
    await handler(
      peticion({
        'csp-report': {
          'effective-directive': 'script-src',
          'blocked-uri': 'https://malo.example/x.js',
          // La query es lo peligroso: aqui puede acabar lo que la persona
          // estuviera consultando, y para decidir si se permite un host no hace
          // ninguna falta.
          'document-uri': 'https://www.secnorthlabs.eu/es/contacto/?email=ana@acme.example',
          'script-sample': 'alert(document.cookie)',
        },
      }),
    )

    const todo = traza.join('\n')
    expect(todo).not.toContain('ana@acme.example')
    expect(todo).not.toContain('email=')
    expect(todo).not.toContain('document.cookie')
    // Lo que si queda: la ruta, que es lo unico que sirve para localizar el fallo.
    expect(todo).toContain('/es/contacto/')
  })

  it('aguanta basura sin lanzar y siempre responde 204', async () => {
    // Un navegador que manda un informe no espera respuesta y no puede hacer nada
    // con un error: devolver 4xx solo le llenaria la consola de ruido.
    for (const entrada of ['no es json', {}, [], null, '{"csp-report":{}}']) {
      const respuesta = await handler(peticion(entrada))
      expect(respuesta.status).toBe(204)
    }
  })

  it('ignora cualquier metodo que no sea POST', async () => {
    const respuesta = await handler(
      new Request('https://www.secnorthlabs.eu/api/csp-report', { method: 'GET' }),
    )

    expect(respuesta.status).toBe(204)
    expect(traza).toHaveLength(0)
  })

  it('descarta un cuerpo desproporcionado', async () => {
    const respuesta = await handler(peticion('x'.repeat(17 * 1024)))

    expect(respuesta.status).toBe(204)
    expect(traza).toHaveLength(0)
  })
})
