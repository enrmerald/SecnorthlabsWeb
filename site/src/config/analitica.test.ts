import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// Ruta relativa y no el alias `@/`: esto importa un VALOR, y el alias solo lo
// resuelve el bundler, no vitest.
import { GA_ID, GTM_ID } from './analitica'

/**
 * Pruebas de `public/analitica.js`, el arranque de GTM y GA4.
 *
 * Ese fichero **no pasa por el compilador**: se sirve tal cual al navegador, asi
 * que no puede importar los identificadores y los lleva escritos. Aqui se
 * ejecuta con un `window` y un `document` de mentira y se comprueba **que pide
 * exactamente lo que dice el manifiesto**. Si alguien cambia un identificador en
 * un sitio y no en el otro, esto falla; sin esta prueba, el sitio dejaria de
 * medir en silencio y nadie se enteraria hasta mirar el panel de Analytics.
 *
 * Se ejecuta el script en lugar de buscar el identificador con una expresion
 * regular, por el mismo motivo que en `reparto-idioma.test.ts`: asi se comprueba
 * el comportamiento y no el texto.
 */
const FUENTE = readFileSync(
  fileURLToPath(new URL('../../public/analitica.js', import.meta.url)),
  'utf8',
)

interface Ejecucion {
  /** `src` de cada script que el arranque ha pedido cargar. */
  cargados: string[]
  /** Todo lo empujado a `dataLayer`, en orden. */
  dataLayer: unknown[]
  insertadosAntesDelPrimerScript: number
}

function ejecutar(): Ejecucion {
  const cargados: string[] = []
  let insertadosAntesDelPrimerScript = 0

  const primerScript = {
    parentNode: {
      insertBefore: (etiqueta: { src: string }) => {
        insertadosAntesDelPrimerScript++
        cargados.push(etiqueta.src)
      },
    },
  }

  const document = {
    createElement: () => ({ async: false, src: '' }),
    getElementsByTagName: () => [primerScript],
    head: { appendChild: (etiqueta: { src: string }) => cargados.push(etiqueta.src) },
    documentElement: {},
  }

  const window: { dataLayer?: unknown[]; gtag?: unknown } = {}

  new Function('window', 'document', FUENTE)(window, document)

  return { cargados, dataLayer: window.dataLayer ?? [], insertadosAntesDelPrimerScript }
}

describe('analitica.js', () => {
  it('pide el contenedor de GTM del manifiesto', () => {
    const { cargados } = ejecutar()
    expect(cargados).toContain(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`)
  })

  it('NO carga GA4 por su cuenta: de eso se encarga el contenedor', () => {
    const { cargados, dataLayer } = ejecutar()

    // Esta prueba afirmaba lo contrario, y lo contrario estaba mal por dos
    // motivos: duplicaba la medicion si el contenedor tenia su propia etiqueta de
    // GA4, y sobre todo dejaba a Analytics fuera del Consent Mode, que solo
    // gobierna lo que dispara GTM. Con GA4 dentro del contenedor, el
    // consentimiento se gestiona sin tocar codigo, que es la razon de usar GTM.
    expect(cargados.some((src) => src.includes('/gtag/js'))).toBe(false)
    expect(cargados.some((src) => src.includes(GA_ID))).toBe(false)

    const configuraciones = dataLayer
      .filter(
        (entrada): entrada is IArguments =>
          typeof entrada === 'object' && entrada !== null && 'length' in entrada,
      )
      .map((argumentos) => Array.from(argumentos))
    expect(configuraciones).not.toContainEqual(['config', GA_ID])
  })

  it('no pide ningun identificador que no este en el manifiesto', () => {
    const { cargados } = ejecutar()
    // Cazaria un identificador copiado a mano que ya no se corresponde con el
    // de `analitica.ts`, que es el fallo que esta prueba existe para evitar.
    for (const src of cargados) {
      expect(src.includes(GTM_ID)).toBe(true)
    }
  })

  it('marca el arranque de GTM en dataLayer antes de cargar nada', () => {
    const { dataLayer } = ejecutar()
    const arranque = dataLayer[0] as Record<string, unknown>
    expect(arranque.event).toBe('gtm.js')
    expect(typeof arranque['gtm.start']).toBe('number')
  })

  it('deja `dataLayer` con el arranque de GTM y nada mas', () => {
    const { dataLayer } = ejecutar()

    // Antes se comprobaba aqui el `['config', GA_ID]` que este fichero ya no
    // emite. Lo que si tiene que seguir cumpliendose es que el arranque no
    // ensucie la cola con nada que el contenedor no espere: GTM lee `dataLayer`
    // tal cual, y una entrada de mas es una variable que alguien depurara.
    expect(dataLayer).toHaveLength(1)
    expect((dataLayer[0] as Record<string, unknown>).event).toBe('gtm.js')
  })

  it('expone gtag en window, para que GTM y las etiquetas puedan usarlo', () => {
    const cargados: string[] = []
    const document = {
      createElement: () => ({ async: false, src: '' }),
      getElementsByTagName: () => [
        { parentNode: { insertBefore: (e: { src: string }) => cargados.push(e.src) } },
      ],
      head: { appendChild: () => {} },
      documentElement: {},
    }
    const window: { gtag?: unknown } = {}

    new Function('window', 'document', FUENTE)(window, document)

    expect(typeof window.gtag).toBe('function')
  })

  it('los dos scripts se insertan de forma asincrona', () => {
    const asincronos: boolean[] = []
    const document = {
      createElement: () => ({ async: false, src: '' }),
      getElementsByTagName: () => [
        {
          parentNode: {
            insertBefore: (etiqueta: { async: boolean }) => asincronos.push(etiqueta.async),
          },
        },
      ],
      head: { appendChild: () => {} },
      documentElement: {},
    }

    new Function('window', 'document', FUENTE)({}, document)

    // Sin `async`, gtm.js bloquearia el analisis del HTML y retrasaria el
    // primer pintado de todas las paginas. Es uno solo desde que GA4 vive en el
    // contenedor; antes eran dos.
    expect(asincronos).toEqual([true])
  })
})
