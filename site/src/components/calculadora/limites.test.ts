import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Los rangos numericos de la calculadora estan en TRES sitios, y aqui se
 * comprueba que digan lo mismo.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * No se pueden unificar con un import, y no es por descuido:
 *
 *   - `LIMITES` vive en un componente de cliente, bajo `src/`.
 *   - `DatosCotizacionSchema` vive en la Netlify Function.
 *   - `CalcInputSchema` vive en el motor, en `pbcg/`.
 *
 * `verify:architecture` prohibe que `src/` importe de `pbcg/` o de `netlify/`, y
 * esa regla es lo unico que impide que las tarifas del modelo acaben en el
 * navegador (bloqueante B01). Compartir el fichero de rangos la rompe.
 *
 * Asi que se hace lo que ya se hace con los identificadores de analitica y con
 * las variantes de idioma de `netlify.toml`: **se leen los tres ficheros como
 * texto y se comparan**. Los enums si estan compartidos de verdad, via
 * `VALORES_CONTRATO`, y tienen su propia prueba en `pbcg/src/contrato.test.ts`;
 * los rangos no tenian nada, de modo que cambiar un tope en un sitio y no en los
 * otros no fallaba en ninguna parte.
 *
 * Que pasaria sin esto: si el cliente permite 3000 usuarios y el servidor 2000,
 * la persona rellena el formulario, no ve ningun error y recibe un fallo generico
 * al enviar. Si es al contrario, hay un rango que el formulario no deja alcanzar
 * y nadie sabe por que.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const leer = (ruta: string) => readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), 'utf8')

/** Nombre del campo en cada capa: el motor usa nombres en espanol. */
const EQUIVALENCIAS: ReadonlyArray<readonly [contrato: string, motor: string]> = [
  ['sites', 'sedes'],
  ['users', 'usuarios'],
  ['physicalServersOwn', 'srvFisPropio'],
  ['virtualServersOwn', 'srvVirPropio'],
  ['physicalServersExternal', 'srvFisExt'],
  ['virtualServersExternal', 'srvVirExt'],
  ['otInstallations', 'instalacionesOT'],
  ['firewalls', 'firewalls'],
]

/** `campo: [min, max]` del mapa `LIMITES` del componente de cliente. */
function rangosDelCliente(fuente: string): Record<string, [number, number]> {
  const bloque = /const LIMITES[^{]*\{([\s\S]*?)\n\}/.exec(fuente)
  expect(bloque, 'no se encuentra el mapa LIMITES').not.toBeNull()

  const salida: Record<string, [number, number]> = {}
  for (const [, campo, min, max] of bloque![1]!.matchAll(
    /(\w+)\s*:\s*\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/g,
  )) {
    salida[campo!] = [Number(min), Number(max)]
  }
  return salida
}

/** `campo: [min, max]` de un esquema zod escrito con el ayudante `entero()`. */
function rangosDelEsquema(fuente: string): Record<string, [number, number]> {
  const salida: Record<string, [number, number]> = {}
  for (const [, campo, min, max] of fuente.matchAll(
    /(\w+)\s*:\s*entero\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g,
  )) {
    salida[campo!] = [Number(min), Number(max)]
  }
  return salida
}

const cliente = rangosDelCliente(leer('./CalculadoraCliente.tsx'))
const funcion = rangosDelEsquema(leer('../../../netlify/functions/quote.ts'))
const motor = rangosDelEsquema(leer('../../../pbcg/src/schemas.ts'))

describe('rangos numericos de la calculadora', () => {
  it('las tres capas se han leido de verdad', () => {
    // Si un `sed` cambia la forma de escribir los rangos, estas expresiones
    // dejarian de encontrar nada y las comparaciones de abajo pasarian vacias,
    // que es la manera clasica de que una prueba de coherencia mienta.
    expect(Object.keys(cliente).length).toBe(EQUIVALENCIAS.length)
    expect(Object.keys(funcion).length).toBeGreaterThanOrEqual(EQUIVALENCIAS.length)
    expect(Object.keys(motor).length).toBeGreaterThanOrEqual(EQUIVALENCIAS.length)
  })

  for (const [contrato, nombreMotor] of EQUIVALENCIAS) {
    it(`${contrato} coincide en cliente, funcion y motor`, () => {
      const delCliente = cliente[contrato]
      const deLaFuncion = funcion[contrato]
      const delMotor = motor[nombreMotor]

      expect(delCliente, `${contrato} no esta en LIMITES`).toBeDefined()
      expect(deLaFuncion, `${contrato} no esta en quote.ts`).toBeDefined()
      expect(delMotor, `${nombreMotor} no esta en schemas.ts`).toBeDefined()

      expect(delCliente).toEqual(deLaFuncion)
      expect(deLaFuncion).toEqual(delMotor)
    })
  }
})
