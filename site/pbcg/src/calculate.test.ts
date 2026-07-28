import { describe, expect, it } from 'vitest'
import { calcular, calcularHorasAuditoriaAnuales, calcularTamano } from './calculate.ts'
import { PBCG_MODEL_VERSION } from './config.ts'
import { CalcInputSchema, ERROR_CPD_EXTERNO, ERROR_CPD_PROPIO } from './schemas.ts'
import type { CalcInput } from './types.ts'

/**
 * Bateria del motor PBCG (seccion 5.5).
 *
 * El caso de oro sale del propio Excel (columna B de `CALCULADORA`) y **debe
 * pasar antes de tocar la interfaz**. Si no cuadra, el error esta aqui y no en
 * la pantalla.
 *
 * Y un solo caso de oro no basta: cuadrar un caso demuestra que ese caso esta
 * bien, no que el modelo lo este.
 */

/** Base neutra para variar un solo parametro cada vez. */
const BASE: CalcInput = {
  sedes: 1,
  usuarios: 10,
  cpd: 'externo',
  srvFisPropio: 0,
  srvVirPropio: 0,
  srvFisExt: 0,
  srvVirExt: 0,
  instalacionesOT: 0,
  edr: 'ninguno',
  licenciasIncluidas: false,
  backup: false,
  firewalls: 0,
  siem: false,
  parcheo: false,
  horasConsultoria: 0,
  modulo: 'ninguno',
}

const con = (cambios: Partial<CalcInput>): CalcInput => ({ ...BASE, ...cambios })

// ═══════════════════════════════════════════════════════════════════════════
describe('caso de oro del Excel', () => {
  // 1 sede · 25 usuarios · CPD externo · 1 servidor fisico externo + 3
  // virtuales externos · 0 OT · EDR Defender con licencias · backup si · 1
  // firewall · SIEM no · parcheo no · 2 h de consultoria · modulo ENS Media.
  const oro = calcular(
    con({
      sedes: 1,
      usuarios: 25,
      cpd: 'externo',
      srvFisExt: 1,
      srvVirExt: 3,
      edr: 'edr',
      licenciasIncluidas: true,
      backup: true,
      firewalls: 1,
      horasConsultoria: 2,
      modulo: 'ensMedia',
    }),
  )

  it('tamano S', () => expect(oro.size).toBe('S'))
  it('7,5 horas tecnicas al mes', () => expect(oro.technicalHours).toBe(7.5))
  it('62 horas de auditoria al ano', () => expect(oro.auditHoursAnnual).toBe(62))
  it('5,1666… horas de auditoria al mes', () =>
    expect(oro.auditHoursMonthly).toBeCloseTo(5.166666, 5))

  it('427,50 € de servicio gestionado', () => expect(oro.managedServiceCents).toBe(42750))
  it('335,83 € de modulo de auditoria', () => expect(oro.auditCents).toBe(33583))
  it('75 € de licencias', () => expect(oro.licenceCents).toBe(7500))

  it('840 € de total redondeado', () => expect(oro.totalCents).toBe(84000))
  it('405 – 490 € de horquilla del gestionado', () =>
    expect(oro.managedRangeCents).toEqual([40500, 49000]))
  it('815 – 900 € de horquilla total', () => expect(oro.totalRangeCents).toEqual([81500, 90000]))

  it('deja constancia de la version del modelo', () =>
    expect(oro.modelVersion).toBe(PBCG_MODEL_VERSION))
})

// ═══════════════════════════════════════════════════════════════════════════
describe('fronteras de tamano', () => {
  // Es donde vive el error tipico de `<` frente a `<=`.
  it.each([
    [25, 'S'],
    [26, 'M'],
    [75, 'M'],
    [76, 'L'],
  ] as const)('%i usuarios -> %s', (usuarios, esperado) => {
    expect(calcularTamano(con({ usuarios }))).toBe(esperado)
  })

  it.each([
    [1, 'S'],
    [2, 'M'],
    [3, 'M'],
    [4, 'L'],
  ] as const)('%i sedes -> %s', (sedes, esperado) => {
    expect(calcularTamano(con({ sedes }))).toBe(esperado)
  })

  it('con los dos criterios en conflicto manda el peor', () => {
    // 10 usuarios serian S; 5 sedes son L.
    expect(calcularTamano(con({ usuarios: 10, sedes: 5 }))).toBe('L')
  })
})

describe('escalon por OT y por CPD', () => {
  it('una instalacion OT sube un escalon', () => {
    expect(calcularTamano(con({ instalacionesOT: 0 }))).toBe('S')
    expect(calcularTamano(con({ instalacionesOT: 1 }))).toBe('M')
  })

  it('el CPD propio y el hibrido suben un escalon; el externo no', () => {
    expect(calcularTamano(con({ cpd: 'externo' }))).toBe('S')
    expect(calcularTamano(con({ cpd: 'propio' }))).toBe('M')
    expect(calcularTamano(con({ cpd: 'hibrido' }))).toBe('M')
  })

  it('un caso que ya es L con OT se queda en L, no desborda', () => {
    expect(calcularTamano(con({ usuarios: 500, instalacionesOT: 3, cpd: 'propio' }))).toBe('L')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('modulos de auditoria', () => {
  // Los nueve casos contra las horas anuales del Excel (AUDITORIAS filas 30-32).
  const esperadas = {
    nis2: { S: 50, M: 78, L: 124 },
    ensMedia: { S: 62, M: 94, L: 148 },
    ensAlta: { S: 90, M: 134, L: 210 },
  } as const

  for (const [modulo, porTamano] of Object.entries(esperadas)) {
    for (const [size, horas] of Object.entries(porTamano)) {
      it(`${modulo} en ${size} son ${horas} h/ano`, () => {
        expect(
          calcularHorasAuditoriaAnuales(modulo as keyof typeof esperadas, size as 'S' | 'M' | 'L'),
        ).toBe(horas)
      })
    }
  }

  it('sin modulo, el importe de auditoria es cero', () => {
    const r = calcular(con({ modulo: 'ninguno' }))
    expect(r.auditCents).toBe(0)
    expect(r.auditHoursAnnual).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('licencias', () => {
  it('EDR con licencias son 3 €/usuario', () => {
    expect(calcular(con({ usuarios: 40, edr: 'edr', licenciasIncluidas: true })).licenceCents).toBe(
      12000,
    )
  })

  it('MDR con licencias son 6,58 €/usuario', () => {
    expect(calcular(con({ usuarios: 40, edr: 'mdr', licenciasIncluidas: true })).licenceCents).toBe(
      26320,
    )
  })

  it('sin EDR no hay licencias aunque se marque la casilla', () => {
    expect(
      calcular(con({ usuarios: 40, edr: 'ninguno', licenciasIncluidas: true })).licenceCents,
    ).toBe(0)
  })

  it('con EDR pero sin incluir licencias, cero', () => {
    expect(
      calcular(con({ usuarios: 40, edr: 'edr', licenciasIncluidas: false })).licenceCents,
    ).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('extremos', () => {
  it('todo desactivado y cero horas de consultoria da cero', () => {
    const r = calcular(BASE)
    expect(r.technicalHours).toBe(0)
    expect(r.totalCents).toBe(0)
  })

  it('los valores maximos de todos los campos no rompen nada', () => {
    const r = calcular(
      con({
        sedes: 50,
        usuarios: 2000,
        cpd: 'hibrido',
        srvFisPropio: 200,
        srvVirPropio: 500,
        srvFisExt: 200,
        srvVirExt: 500,
        instalacionesOT: 20,
        edr: 'mdr',
        licenciasIncluidas: true,
        backup: true,
        firewalls: 50,
        siem: true,
        parcheo: true,
        horasConsultoria: 6,
        modulo: 'ensAlta',
      }),
    )
    expect(Number.isFinite(r.totalCents)).toBe(true)
    expect(r.size).toBe('L')
    expect(r.totalCents).toBeGreaterThan(0)
  })

  it('un importe justo en el punto medio del redondeo sube', () => {
    // MROUND de Excel redondea alejandose del cero, igual que Math.round con
    // valores positivos. 2,50 € debe subir a 5 €, no bajar a 0.
    // 0,5 h/mes de consultoria no es una entrada valida, asi que se construye
    // el caso con firewalls, que aportan 1 h justa.
    const r = calcular(con({ horasConsultoria: 0, firewalls: 0 }))
    expect(r.totalCents).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('invariantes sobre entradas generadas', () => {
  // Detectan errores de signo y de redondeo que ningun caso concreto revela.
  const muestras: CalcInput[] = []
  for (const usuarios of [1, 25, 26, 75, 76, 300, 2000]) {
    for (const cpd of ['externo', 'propio', 'hibrido'] as const) {
      for (const modulo of ['ninguno', 'nis2', 'ensMedia', 'ensAlta'] as const) {
        muestras.push(
          con({
            usuarios,
            cpd,
            modulo,
            backup: true,
            siem: true,
            parcheo: true,
            edr: 'mdr',
            licenciasIncluidas: true,
            firewalls: 2,
            // Coherente con el CPD para no chocar con la regla de B06.
            ...(cpd === 'propio'
              ? { srvFisPropio: 2, srvVirPropio: 4 }
              : cpd === 'externo'
                ? { srvFisExt: 2, srvVirExt: 4 }
                : { srvFisPropio: 1, srvVirPropio: 2, srvFisExt: 1, srvVirExt: 2 }),
          }),
        )
      }
    }
  }

  it('el total siempre cae dentro de la horquilla', () => {
    for (const entrada of muestras) {
      const r = calcular(entrada)
      expect(r.totalRangeCents[0]).toBeLessThanOrEqual(r.totalCents)
      expect(r.totalCents).toBeLessThanOrEqual(r.totalRangeCents[1])
    }
  })

  it('anadir usuarios nunca abarata', () => {
    // La mas valiosa de las dos. Si algun dia una regla comercial rompe esto,
    // debe estar documentada y el test cambiarse a proposito.
    for (let usuarios = 1; usuarios < 120; usuarios += 7) {
      const menos = calcular(con({ usuarios, backup: true, siem: true, modulo: 'ensMedia' }))
      const mas = calcular(con({ usuarios: usuarios + 1, backup: true, siem: true, modulo: 'ensMedia' }))
      expect(mas.totalCents).toBeGreaterThanOrEqual(menos.totalCents)
    }
  })

  it('activar un servicio nunca abarata', () => {
    const sin = calcular(con({ usuarios: 40 }))
    for (const extra of [
      { backup: true },
      { siem: true },
      { parcheo: true },
      { firewalls: 3 },
      { edr: 'edr' as const },
      { modulo: 'nis2' as const },
    ]) {
      expect(calcular(con({ usuarios: 40, ...extra })).totalCents).toBeGreaterThanOrEqual(
        sin.totalCents,
      )
    }
  })

  it('nunca se devuelve tarifa efectiva ni margen', () => {
    const r = calcular(muestras[0] as CalcInput)
    expect(Object.keys(r)).not.toContain('effectiveRate')
    expect(Object.keys(r)).not.toContain('grossMargin')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
describe('validacion de entrada', () => {
  const valida = (cambios: Partial<CalcInput> | Record<string, unknown>) =>
    CalcInputSchema.safeParse({ ...BASE, ...cambios })

  it.each([
    ['negativo', { sedes: -1 }],
    ['cero donde el minimo es uno', { sedes: 0 }],
    ['decimal donde se espera entero', { usuarios: 10.5 }],
    ['NaN', { usuarios: Number.NaN }],
    ['Infinity', { usuarios: Number.POSITIVE_INFINITY }],
    ['cadena', { usuarios: '25' }],
    ['por encima del maximo', { usuarios: 2001 }],
    ['notacion cientifica fuera de rango', { usuarios: 1e9 }],
    ['enum inventado', { cpd: 'nube' }],
    ['horas de consultoria no permitidas', { horasConsultoria: 3 }],
    ['clave desconocida', { rentingFirewall: 250 }],
  ])('rechaza %s', (_caso, cambios) => {
    expect(valida(cambios as Record<string, unknown>).success).toBe(false)
  })

  it('rechaza CPD propio con servidores externos', () => {
    const r = valida({ cpd: 'propio', srvFisExt: 2 })
    expect(r.success).toBe(false)
    expect(JSON.stringify(r.error?.issues)).toContain(ERROR_CPD_PROPIO)
  })

  it('rechaza CPD externo con servidores propios', () => {
    const r = valida({ cpd: 'externo', srvVirPropio: 3 })
    expect(r.success).toBe(false)
    expect(JSON.stringify(r.error?.issues)).toContain(ERROR_CPD_EXTERNO)
  })

  it('rechaza el cambio de hibrido a propio conservando los valores antiguos', () => {
    // El caso concreto de la seccion 5.4: la persona rellena los cuatro campos
    // en «Hibrido» y luego cambia a «Propio». Los externos siguen en el estado
    // aunque sus campos esten ocultos. Debe saltar el error, no calcularse un
    // presupuesto barato.
    const estadoDelFormulario = {
      cpd: 'propio' as const,
      srvFisPropio: 2,
      srvVirPropio: 4,
      srvFisExt: 3,
      srvVirExt: 6,
    }
    expect(valida(estadoDelFormulario).success).toBe(false)
  })

  it('acepta el hibrido con los cuatro campos rellenos', () => {
    expect(
      valida({ cpd: 'hibrido', srvFisPropio: 2, srvVirPropio: 4, srvFisExt: 3, srvVirExt: 6 })
        .success,
    ).toBe(true)
  })
})
