import { describe, expect, it } from 'vitest'
import {
  VALORES_CONTRATO,
  contratoAEntrada,
  entradaAContrato,
  type DatosCotizacionContrato,
} from './contrato.ts'
import { calcular } from './calculate.ts'
import { CalcInputSchema } from './schemas.ts'

/**
 * El mapeo contrato ↔ motor es el punto donde un dato se pierde sin dar error.
 * Estas pruebas existen para que ese fallo sea imposible de introducir sin
 * romper el build.
 */

/** El caso de oro del Excel, escrito en el idioma del contrato (§6.5). */
const ORO_CONTRATO: DatosCotizacionContrato = {
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

describe('el payload del contrato produce el caso de oro', () => {
  // Es la prueba que de verdad importa: si el mapeo se rompe, el precio cambia.
  const entrada = contratoAEntrada(ORO_CONTRATO)

  it('el esquema del motor lo acepta', () => {
    expect(CalcInputSchema.safeParse(entrada).success).toBe(true)
  })

  it('sigue dando 840 € y 815 – 900 €', () => {
    const r = calcular(entrada)
    expect(r.technicalHours).toBe(7.5)
    expect(r.totalCents).toBe(84000)
    expect(r.totalRangeCents).toEqual([81500, 90000])
  })
})

describe('traduccion de enums', () => {
  it.each([
    ['external', 'externo'],
    ['own', 'propio'],
    ['hybrid', 'hibrido'],
  ] as const)('cpd %s -> %s', (contrato, motor) => {
    expect(contratoAEntrada({ ...ORO_CONTRATO, cpd: contrato }).cpd).toBe(motor)
  })

  it.each([
    ['none', 'ninguno'],
    ['edr', 'edr'],
    ['mdr', 'mdr'],
  ] as const)('edr %s -> %s', (contrato, motor) => {
    expect(contratoAEntrada({ ...ORO_CONTRATO, edr: contrato }).edr).toBe(motor)
  })

  it.each([
    ['none', 'ninguno'],
    ['nis2', 'nis2'],
    ['ensMedium', 'ensMedia'],
    ['ensHigh', 'ensAlta'],
  ] as const)('module %s -> %s', (contrato, motor) => {
    expect(contratoAEntrada({ ...ORO_CONTRATO, module: contrato }).modulo).toBe(motor)
  })

  it('ningun valor traducido queda undefined', () => {
    // El fallo silencioso que estas pruebas persiguen: un enum sin traducir
    // pasa como undefined y, si alguien pone un valor por defecto aguas abajo,
    // se cotiza un CPD que el cliente no tiene.
    for (const cpd of VALORES_CONTRATO.cpd) {
      for (const edr of VALORES_CONTRATO.edr) {
        for (const mod of VALORES_CONTRATO.module) {
          const e = contratoAEntrada({ ...ORO_CONTRATO, cpd, edr, module: mod })
          expect(e.cpd, `cpd ${cpd}`).toBeDefined()
          expect(e.edr, `edr ${edr}`).toBeDefined()
          expect(e.modulo, `module ${mod}`).toBeDefined()
        }
      }
    }
  })
})

describe('ida y vuelta', () => {
  it('traducir y destraducir devuelve el original, en todas las combinaciones', () => {
    for (const cpd of VALORES_CONTRATO.cpd) {
      for (const edr of VALORES_CONTRATO.edr) {
        for (const mod of VALORES_CONTRATO.module) {
          const original = { ...ORO_CONTRATO, cpd, edr, module: mod }
          expect(entradaAContrato(contratoAEntrada(original))).toEqual(original)
        }
      }
    }
  })

  it('no se pierde ningun campo por el camino', () => {
    // Un campo que se olvide en contratoAEntrada saldria como undefined aqui.
    const entrada = contratoAEntrada(ORO_CONTRATO)
    for (const [clave, valor] of Object.entries(entrada)) {
      expect(valor, `el campo "${clave}" no se ha traducido`).toBeDefined()
    }
    expect(Object.keys(entrada)).toHaveLength(Object.keys(ORO_CONTRATO).length)
  })
})
