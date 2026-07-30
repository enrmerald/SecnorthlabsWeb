import { describe, expect, it } from 'vitest'
import { idiomaPreferido, variantesDeEspanol } from './idioma-preferido.mjs'

describe('variantesDeEspanol', () => {
  it('lee la lista del propio netlify.toml, para no duplicarla', () => {
    const variantes = variantesDeEspanol()

    expect(variantes).toContain('es')
    expect(variantes).toContain('es-419')
    expect(variantes).toContain('ca')
    expect(variantes.length).toBeGreaterThan(20)
  })

  it('falla ruidosamente si alguien retira la condicion del toml', () => {
    expect(() => variantesDeEspanol('[[redirects]]\n  from = "/"\n')).toThrow(/Language/)
  })
})

describe('idiomaPreferido', () => {
  const es = [
    'es',
    'es-ES',
    'es-ES,es;q=0.9,en;q=0.8',
    'es-419,es;q=0.9',
    'es-MX,es;q=0.9,en-US;q=0.8',
    'es-CL',
    // Un dialecto que no esta en la lista sigue siendo castellano.
    'es-XX',
    // Lenguas cooficiales: quien las tiene configuradas lee castellano, y el
    // sitio no esta en catalan, gallego ni euskera.
    'ca-ES,ca;q=0.9,es;q=0.8',
    'gl',
    'eu-ES',
  ]

  for (const cabecera of es) {
    it(`"${cabecera}" va a /es/`, () => {
      expect(idiomaPreferido(cabecera)).toBe('es')
    })
  }

  const en = ['en', 'en-US,en;q=0.9', 'en-GB', 'fr-FR,fr;q=0.9', 'de,pt-BR;q=0.7', 'pt-PT', 'zh-CN']

  for (const cabecera of en) {
    it(`"${cabecera}" va a /en/`, () => {
      expect(idiomaPreferido(cabecera)).toBe('en')
    })
  }

  it('sin cabecera, ingles', () => {
    // Un cliente que no declara idioma no es un hispanohablante que se pueda
    // suponer: /en/ es el destino menos presuntuoso.
    expect(idiomaPreferido(undefined)).toBe('en')
    expect(idiomaPreferido('')).toBe('en')
  })

  it('menciona el castellano en segundo lugar y aun asi va a /es/', () => {
    // Es la semantica de Netlify, que no ordena por factor q. Se reproduce a
    // proposito para que el preview y produccion coincidan; esta prueba existe
    // para que el dia que se decida cambiarlo, se cambie sabiendolo.
    expect(idiomaPreferido('en-US,en;q=0.9,es;q=0.3')).toBe('es')
  })
})
