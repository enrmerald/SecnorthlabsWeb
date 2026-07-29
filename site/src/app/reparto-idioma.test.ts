import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// Ruta relativa y no el alias `@/`: esto importa un VALOR, y el alias solo lo
// resuelve el bundler, no vitest.
import { getLocalizedPath } from '../config/routes'
import { variantesDeEspanol } from '../../scripts/idioma-preferido.mjs'

/**
 * Pruebas de `public/reparto-idioma.js`, el script que reparte `/` por idioma.
 *
 * Ese fichero **no pasa por el compilador**: se sirve tal cual al navegador, asi
 * que no se puede importar. Aqui se lee y se ejecuta con un `navigator` y un
 * `window` de mentira, que es lo mas parecido a lo que hace el navegador.
 *
 * Ejecutarlo -y no leerlo con una expresion regular- es lo que permite que estas
 * pruebas sirvan de algo: comprueban el comportamiento, no el texto.
 */
const FUENTE = readFileSync(
  fileURLToPath(new URL('../../public/reparto-idioma.js', import.meta.url)),
  'utf8',
)

/** Ejecuta el script con la lista de idiomas dada y devuelve el destino. */
function repartir(idiomas: readonly string[] | undefined): string | undefined {
  let destino: string | undefined
  const navigator = { languages: idiomas, language: idiomas?.[0] }
  const window = { location: { replace: (url: string) => (destino = url) } }

  new Function('navigator', 'window', FUENTE)(navigator, window)

  return destino
}

describe('reparto-idioma.js', () => {
  it('reconoce el castellano y sus dialectos', () => {
    expect(repartir(['es'])).toBe('/es/')
    expect(repartir(['es-ES'])).toBe('/es/')
    expect(repartir(['es-419'])).toBe('/es/')
    expect(repartir(['es-MX', 'en-US'])).toBe('/es/')
  })

  it('trata las lenguas cooficiales como castellano', () => {
    // El sitio no esta en catalan, gallego ni euskera, y quien los configura lee
    // castellano: es mejor destino que el ingles.
    expect(repartir(['ca-ES', 'es-ES'])).toBe('/es/')
    expect(repartir(['gl'])).toBe('/es/')
    expect(repartir(['eu'])).toBe('/es/')
  })

  it('manda a ingles cualquier otro idioma', () => {
    expect(repartir(['en-GB'])).toBe('/en/')
    expect(repartir(['fr-FR'])).toBe('/en/')
    expect(repartir(['de', 'nl'])).toBe('/en/')
    expect(repartir(['zh-CN'])).toBe('/en/')
  })

  it('respeta el ORDEN de preferencia, no la simple mencion', () => {
    // Aqui si se puede: la lista viene ordenada. Es la diferencia deliberada con
    // la condicion `Language` de Netlify, que solo mira si el idioma aparece.
    expect(repartir(['en-US', 'es'])).toBe('/en/')
    expect(repartir(['es', 'en-US'])).toBe('/es/')
  })

  it('sin idiomas declarados, el predeterminado', () => {
    expect(repartir([])).toBe('/es/')
    expect(repartir(undefined)).toBe('/es/')
  })

  it('redirige SIEMPRE, sea cual sea la entrada', () => {
    // Es lo que evita el parpadeo: si alguna rama se quedara sin redirigir, la
    // pagina de eleccion se quedaria pintada y nadie lo notaria hasta produccion.
    for (const idiomas of [['es'], ['fr'], [''], ['  '], []]) {
      expect(repartir(idiomas), JSON.stringify(idiomas)).toBeTruthy()
    }
  })
})

describe('coherencia con el resto del sitio', () => {
  it('los destinos son los del manifiesto de rutas', () => {
    // Si manana la home cambia de ruta, esto lo dice antes que un 404.
    expect(repartir(['es'])).toBe(getLocalizedPath('home', 'es'))
    expect(repartir(['en'])).toBe(getLocalizedPath('home', 'en'))
  })

  it('cubre todas las variantes de castellano del borde', () => {
    // Las dos listas tienen que decir lo mismo: si el borde manda `es-CL` a /es/ y
    // el cliente no lo reconociera, un visitante veria una redireccion distinta
    // segun por donde entrase. No se pueden compartir -una lee un fichero y la
    // otra corre en el navegador-, asi que se comparan aqui.
    const noCubiertas = variantesDeEspanol().filter(
      (variante: string) => repartir([variante]) !== '/es/',
    )

    expect(noCubiertas).toEqual([])
  })
})
