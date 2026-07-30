import { PBCG, PBCG_MODEL_VERSION, type Modulo, type Prueba, type Size } from './config.ts'
import type { CalcInput, InternalCalculationResult } from './types.ts'

/**
 * Motor de calculo del PBCG. Sin React, sin DOM, sin traducciones: entrada →
 * salida. **Solo de servidor.**
 *
 * Es un espejo de la hoja `CALCULADORA` del dimensionador. Donde el plan y el
 * Excel difieren, manda el Excel: es el documento aprobado y el que fija el
 * caso de oro.
 */

const PRUEBAS = Object.keys(PBCG.auditoriaHoras) as Prueba[]

/**
 * `MROUND(x, 5)` de Excel: redondea al multiplo comercial mas cercano.
 *
 * Se trabaja en **euros** hasta este punto, igual que el Excel, y solo despues
 * se pasa a centimos enteros. La conversion es exacta porque el resultado ya es
 * un multiplo de 5 €.
 *
 * El plan proponia convertir a centimos antes de redondear. Da el mismo
 * resultado en la practica, pero anade un redondeo intermedio que el Excel no
 * hace, y el objetivo aqui es que las dos implementaciones sean identicas y no
 * solo parecidas.
 */
function mroundACentimos(euros: number): number {
  return Math.round(euros / PBCG.redondeo) * PBCG.redondeo * 100
}

/** Tamano del cliente - `CALCULADORA!E6`. */
export function calcularTamano(input: Pick<CalcInput, 'usuarios' | 'sedes' | 'instalacionesOT' | 'cpd'>): Size {
  const { usuariosS, usuariosM, sedesS, sedesM } = PBCG.umbrales

  const porUsuarios = input.usuarios <= usuariosS ? 1 : input.usuarios <= usuariosM ? 2 : 3
  const porSedes = input.sedes <= sedesS ? 1 : input.sedes <= sedesM ? 2 : 3

  // El tamano lo marca el peor de los dos criterios; tener OT, CPD propio o
  // hibrido sube un escalon, con tope en L.
  let n = Math.max(porUsuarios, porSedes)
  if (input.instalacionesOT > 0 || input.cpd !== 'externo') n = Math.min(3, n + 1)

  return (['S', 'M', 'L'] as const)[n - 1] as Size
}

/** Horas tecnicas mensuales - `CALCULADORA!E7:E16` → `E17`. */
export function calcularHorasTecnicas(input: CalcInput): number {
  const { coef } = PBCG
  const srvTotal = input.srvFisPropio + input.srvVirPropio + input.srvFisExt + input.srvVirExt
  const srvFisicos = input.srvFisPropio + input.srvFisExt

  let h = 0

  // Las cinco primeras filas son condicionales; las cinco ultimas, no. Es como
  // esta en el Excel: el pseudocodigo del plan sugeria con la indentacion que
  // firewall, servidores fisicos, OT, sedes y consultoria colgaban de la
  // condicion anterior, y no es asi.
  if (input.edr !== 'ninguno') h += coef.edrBase + input.usuarios * coef.edrUsuario // E7
  if (input.backup) h += coef.backupBase + srvTotal * coef.backupServidor //            E8
  h += input.firewalls * coef.firewallPorEquipo //                                      E9
  if (input.siem) h += coef.siemBase + input.usuarios * coef.siemUsuario //             E10
  if (input.parcheo) h += srvTotal * coef.parcheoServidor + input.usuarios * coef.parcheoUsuario // E11
  h += srvFisicos * coef.servidorFisico //                                              E12
  h += input.instalacionesOT * coef.otPorInstalacion //                                 E13
  if (input.cpd !== 'externo') h += coef.cpdPropioOHibrido //                           E14
  h += Math.max(0, input.sedes - 1) * coef.sedeAdicional //                             E15
  h += input.horasConsultoria //                                                        E16

  // Bloques de media hora, como el contrato: ROUND(SUM*2,0)/2.
  return Math.round(h * 2) / 2
}

/** Horas anuales de auditoria por modulo y tamano - bloques de `AUDITORIAS`. */
export function calcularHorasAuditoriaAnuales(modulo: Modulo, size: Size): number {
  const ejecuciones = PBCG.auditoriaEjecuciones[modulo]
  // Se recorre por **nombre de prueba**, nunca por indice.
  return PRUEBAS.reduce(
    (total, prueba) => total + PBCG.auditoriaHoras[prueba][size] * ejecuciones[prueba],
    0,
  )
}

/**
 * Calculo completo.
 *
 * La entrada llega ya validada y coherente: la incoherencia CPD ↔ servidores es
 * un **error bloqueante** que rechaza `schemas.ts` antes de llegar aqui, no un
 * aviso ni una normalizacion silenciosa (bloqueante B06). Poner a cero los
 * servidores incompatibles y seguir calculando produce una cotizacion mas
 * barata que la real.
 */
export function calcular(input: CalcInput): InternalCalculationResult {
  const size = calcularTamano(input)
  const horasTecnicas = calcularHorasTecnicas(input)

  const horasAuditoriaAnuales =
    input.modulo === 'ninguno' ? 0 : calcularHorasAuditoriaAnuales(input.modulo, size)
  const horasAuditoriaMensuales = horasAuditoriaAnuales / 12

  // Orden exacto de redondeo (paso 6 de la seccion 5.3): el Excel NO redondea
  // ningun componente intermedio. Mantiene precision completa en E22, E23 y E24
  // y aplica MROUND una sola vez sobre cada importe final.
  const servicioGestionado = horasTecnicas * PBCG.tarifaTecnica // E22
  const moduloAuditoria = horasAuditoriaMensuales * PBCG.tarifaAuditoria // E23
  const licencias =
    input.licenciasIncluidas && input.edr !== 'ninguno'
      ? input.usuarios *
        (input.edr === 'edr' ? PBCG.licencias.edrDefender : PBCG.licencias.mdrHuntress)
      : 0 // E24

  const fijos = moduloAuditoria + licencias

  // Los factores salen de la configuracion, no escritos a mano: definir
  // horquillaAbajo: 0.05 y luego usar 0.95 literal son dos fuentes de verdad
  // para el mismo numero, de modo que cambiar la configuracion no cambiaria el
  // resultado.
  const factorBajo = 1 - PBCG.horquillaAbajo
  const factorAlto = 1 + PBCG.horquillaArriba

  return {
    modelVersion: PBCG_MODEL_VERSION,
    size,
    technicalHours: horasTecnicas,
    auditHoursMonthly: horasAuditoriaMensuales,
    auditHoursAnnual: horasAuditoriaAnuales,

    managedServiceCents: Math.round(servicioGestionado * 100),
    auditCents: Math.round(moduloAuditoria * 100),
    licenceCents: Math.round(licencias * 100),
    exactTotalCents: Math.round((servicioGestionado + fijos) * 100),

    totalCents: mroundACentimos(servicioGestionado + fijos), // E26

    // La horquilla se aplica **solo al servicio gestionado**, porque ahi esta la
    // incertidumbre de horas; licencias y modulo se suman como importe fijo.
    // Esta dicho literalmente en el Excel (CALCULADORA!D33).
    managedRangeCents: [
      mroundACentimos(servicioGestionado * factorBajo),
      mroundACentimos(servicioGestionado * factorAlto),
    ], // E27
    totalRangeCents: [
      mroundACentimos(servicioGestionado * factorBajo + fijos),
      mroundACentimos(servicioGestionado * factorAlto + fijos),
    ], // E28
  }
}

// No se calcula ni se devuelve tarifa efectiva (E29) ni margen bruto (E30).
