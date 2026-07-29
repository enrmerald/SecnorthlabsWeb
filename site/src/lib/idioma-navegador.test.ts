import { describe, expect, it } from 'vitest'
import { PREFIJOS_ESPANOL, idiomaDelNavegador } from './idioma-navegador'
import { variantesDeEspanol } from '../../scripts/idioma-preferido.mjs'

describe('idiomaDelNavegador', () => {
  it('reconoce el castellano y sus dialectos', () => {
    expect(idiomaDelNavegador(['es'])).toBe('es')
    expect(idiomaDelNavegador(['es-ES'])).toBe('es')
    expect(idiomaDelNavegador(['es-419'])).toBe('es')
    expect(idiomaDelNavegador(['es-MX', 'en-US'])).toBe('es')
  })

  it('trata las lenguas cooficiales como castellano', () => {
    // El sitio no esta en catalan, gallego ni euskera, y quien los configura lee
    // castellano: es mejor destino que el ingles.
    expect(idiomaDelNavegador(['ca-ES', 'es-ES'])).toBe('es')
    expect(idiomaDelNavegador(['gl'])).toBe('es')
    expect(idiomaDelNavegador(['eu'])).toBe('es')
  })

  it('manda a ingles cualquier otro idioma', () => {
    expect(idiomaDelNavegador(['en-GB'])).toBe('en')
    expect(idiomaDelNavegador(['fr-FR'])).toBe('en')
    expect(idiomaDelNavegador(['de', 'nl'])).toBe('en')
    expect(idiomaDelNavegador(['zh-CN'])).toBe('en')
  })

  it('respeta el ORDEN de preferencia, no la simple mencion', () => {
    // Aqui si se puede: la lista viene ordenada. Es la diferencia deliberada con
    // la condicion `Language` de Netlify, que solo mira si el idioma aparece.
    expect(idiomaDelNavegador(['en-US', 'es'])).toBe('en')
    expect(idiomaDelNavegador(['es', 'en-US'])).toBe('es')
  })

  it('sin idiomas declarados, el predeterminado', () => {
    expect(idiomaDelNavegador([])).toBe('es')
  })
})

describe('coherencia con netlify.toml', () => {
  it('los prefijos del cliente cubren todas las variantes del borde', () => {
    // Las dos listas tienen que decir lo mismo: si el borde manda `es-CL` a /es/ y
    // el cliente no lo reconociera, un visitante veria una redireccion distinta
    // segun por donde entrase. No se pueden compartir -una lee un fichero y la
    // otra corre en el navegador-, asi que se comparan aqui.
    const noCubiertas = variantesDeEspanol().filter(
      (variante) =>
        !(PREFIJOS_ESPANOL as readonly string[]).includes(variante.split('-')[0] ?? ''),
    )

    expect(noCubiertas).toEqual([])
  })
})
