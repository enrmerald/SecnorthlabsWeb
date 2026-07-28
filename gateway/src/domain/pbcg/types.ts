import type { Size } from './config.js'

/**
 * Tipos del motor PBCG.
 *
 * Los de **entrada** describen la forma del formulario y son los mismos que el
 * sitio genera desde el contrato OpenAPI. Los de **resultado** estan separados
 * en dos a proposito (paso 7 de la seccion 5.3): mezclarlos fue una
 * incoherencia de la version anterior del plan.
 */

export type Cpd = 'externo' | 'propio' | 'hibrido'
export type Edr = 'ninguno' | 'edr' | 'mdr'
export type ModuloAuditoria = 'ninguno' | 'nis2' | 'ensMedia' | 'ensAlta'

export interface CalcInput {
  sedes: number
  usuarios: number
  cpd: Cpd
  srvFisPropio: number
  srvVirPropio: number
  srvFisExt: number
  srvVirExt: number
  instalacionesOT: number
  edr: Edr
  licenciasIncluidas: boolean
  backup: boolean
  firewalls: number
  siem: boolean
  parcheo: boolean
  horasConsultoria: number
  modulo: ModuloAuditoria
}

/**
 * ⚠️ **El campo de renting de firewall se elimina por completo de esta
 * version.** No aparece en `CalcInput`, ni en la formula, ni en el resultado,
 * ni en el desglose visual.
 *
 * El diseno original lo dejaba como un importe en euros que **escribia el
 * visitante** y se sumaba a su propia cotizacion: cualquiera podia poner 0 €,
 * 1 € o 10.000 €. Dejarlo «a cero» es peor que quitarlo: un campo fijo a cero
 * que nadie sabe si algun dia se rellena es una trampa esperando.
 *
 * Consecuencia: el pendiente P21 deja de bloquear. Solo bloquearia una futura
 * version que incluya renting, que sera una ampliacion con su propio
 * `PBCG_MODEL_VERSION`.
 */

/**
 * Resultado interno. Tiene lo que necesitan los tests, el CRM y los logs
 * tecnicos. **No sale nunca del gateway.**
 */
export interface InternalCalculationResult {
  modelVersion: string
  size: Size
  technicalHours: number
  auditHoursMonthly: number
  auditHoursAnnual: number
  managedServiceCents: number
  auditCents: number
  licenceCents: number
  /** Suma sin redondeo comercial. Util para depurar contra el Excel. */
  exactTotalCents: number
  totalCents: number
  managedRangeCents: [number, number]
  totalRangeCents: [number, number]
}

/**
 * Lo unico que viaja al navegador: lo que la persona ve en pantalla. Nada de
 * coeficientes, ni de desglose de horas internas, ni de tarifa efectiva, ni de
 * margen.
 */
export interface PublicQuoteDto {
  size: Size
  licenceCents: number
  auditCents: number
  managedRangeCents: [number, number]
  totalRangeCents: [number, number]
  currency: 'EUR'
}

/**
 * Conversion en un unico sitio, para que nadie devuelva el objeto interno por
 * descuido.
 */
export function toPublicDto(resultado: InternalCalculationResult): PublicQuoteDto {
  return {
    size: resultado.size,
    licenceCents: resultado.licenceCents,
    auditCents: resultado.auditCents,
    managedRangeCents: resultado.managedRangeCents,
    totalRangeCents: resultado.totalRangeCents,
    currency: 'EUR',
  }
}
