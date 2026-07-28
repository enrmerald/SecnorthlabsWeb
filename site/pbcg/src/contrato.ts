import type { CalcInput, Cpd, Edr, ModuloAuditoria } from './types.ts'

/**
 * Traduccion entre el **contrato de ingestion** y el **motor de calculo**.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUE EXISTE ESTE FICHERO
 *
 * El contrato de ingestion (ISNLA-DOC-0008-MIG-02 §6.5) esta en ingles:
 *
 *     { "cpd": "external", "module": "ensMedium", "licensesIncluded": true }
 *
 * El motor esta en espanol, y sus 59 tests —incluido el caso de oro del Excel—
 * estan escritos contra esos nombres:
 *
 *     { cpd: 'externo', modulo: 'ensMedia', licenciasIncluidas: true }
 *
 * Alguien tiene que traducir. Si esa traduccion vive dispersa en la funcion, en
 * el agente local y en el cliente, se desincronizan, y el sintoma es **el peor
 * posible: no hay error**. Un `cpd` que llega como `"external"` y no se
 * reconoce se queda en `undefined`, el esquema lo rechaza —bien— o peor, si
 * alguien pone un valor por defecto, se cotiza un CPD que el cliente no tiene.
 *
 * Es exactamente el mismo fallo que el plan describe con los campos de EspoCRM:
 * el dato llega, no casa, y desaparece sin avisar.
 *
 * Por eso la traduccion esta **aqui, en un solo sitio, y exhaustiva por
 * construccion**: los `Record<>` de abajo obligan al compilador a comprobar que
 * no falta ningun valor del enum, en los dos sentidos.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Version del contrato. Se sube si cambia la forma del payload. */
export const CONTRACT_VERSION = '1.0'

// ── Valores del contrato (los que viajan por el cable, en ingles) ───────────

export type CpdContrato = 'external' | 'own' | 'hybrid'
export type EdrContrato = 'none' | 'edr' | 'mdr'
export type ModuloContrato = 'none' | 'nis2' | 'ensMedium' | 'ensHigh'

/**
 * Mapas explicitos, no `Record<string, string>`.
 *
 * Al declararlos como `Record<CpdContrato, Cpd>`, anadir un valor al enum del
 * contrato sin traducirlo **no compila**. Con un mapa laxo, compilaria y
 * devolveria `undefined` en produccion.
 */
const CPD: Record<CpdContrato, Cpd> = {
  external: 'externo',
  own: 'propio',
  hybrid: 'hibrido',
}

const EDR: Record<EdrContrato, Edr> = {
  none: 'ninguno',
  edr: 'edr',
  mdr: 'mdr',
}

const MODULO: Record<ModuloContrato, ModuloAuditoria> = {
  none: 'ninguno',
  nis2: 'nis2',
  ensMedium: 'ensMedia',
  ensHigh: 'ensAlta',
}

/** Forma de `data` en un `quote_request`, tal cual llega por el cable. */
export interface DatosCotizacionContrato {
  sites: number
  users: number
  cpd: CpdContrato
  physicalServersOwn: number
  virtualServersOwn: number
  physicalServersExternal: number
  virtualServersExternal: number
  otInstallations: number
  edr: EdrContrato
  licensesIncluded: boolean
  backup: boolean
  firewalls: number
  siem: boolean
  patching: boolean
  consultingHours: number
  module: ModuloContrato
}

/**
 * Contrato → motor.
 *
 * No valida: eso lo hace `CalcInputSchema` justo despues, y a proposito en ese
 * orden. Traducir primero y validar despues significa que los mensajes de error
 * hablan de los campos del motor, que son los que el caso de oro y los tests
 * conocen; validar en ingles obligaria a mantener dos juegos de mensajes.
 */
export function contratoAEntrada(datos: DatosCotizacionContrato): CalcInput {
  return {
    sedes: datos.sites,
    usuarios: datos.users,
    cpd: CPD[datos.cpd],
    srvFisPropio: datos.physicalServersOwn,
    srvVirPropio: datos.virtualServersOwn,
    srvFisExt: datos.physicalServersExternal,
    srvVirExt: datos.virtualServersExternal,
    instalacionesOT: datos.otInstallations,
    edr: EDR[datos.edr],
    licenciasIncluidas: datos.licensesIncluded,
    backup: datos.backup,
    firewalls: datos.firewalls,
    siem: datos.siem,
    parcheo: datos.patching,
    horasConsultoria: datos.consultingHours,
    modulo: MODULO[datos.module],
  }
}

// ── Inversos, para el agente local y para las pruebas de ida y vuelta ───────

const CPD_INVERSO = invertir(CPD)
const EDR_INVERSO = invertir(EDR)
const MODULO_INVERSO = invertir(MODULO)

/** Motor → contrato. Lo usa el agente local al escribir en el CRM. */
export function entradaAContrato(entrada: CalcInput): DatosCotizacionContrato {
  return {
    sites: entrada.sedes,
    users: entrada.usuarios,
    cpd: CPD_INVERSO[entrada.cpd],
    physicalServersOwn: entrada.srvFisPropio,
    virtualServersOwn: entrada.srvVirPropio,
    physicalServersExternal: entrada.srvFisExt,
    virtualServersExternal: entrada.srvVirExt,
    otInstallations: entrada.instalacionesOT,
    edr: EDR_INVERSO[entrada.edr],
    licensesIncluded: entrada.licenciasIncluidas,
    backup: entrada.backup,
    firewalls: entrada.firewalls,
    siem: entrada.siem,
    patching: entrada.parcheo,
    consultingHours: entrada.horasConsultoria,
    module: MODULO_INVERSO[entrada.modulo],
  }
}

/**
 * Invierte un mapa comprobando que es biyectivo.
 *
 * Si dos valores del contrato apuntasen al mismo valor del motor, la vuelta
 * seria ambigua y se perderia informacion. Se detecta al cargar el modulo, no
 * en la primera cotizacion de un cliente real.
 */
function invertir<A extends string, B extends string>(mapa: Record<A, B>): Record<B, A> {
  const salida = {} as Record<B, A>
  for (const [contrato, motor] of Object.entries(mapa) as [A, B][]) {
    if (salida[motor] !== undefined) {
      throw new Error(`contrato: "${motor}" tiene dos origenes, el mapa no es biyectivo`)
    }
    salida[motor] = contrato
  }
  return salida
}

/** Los valores validos, para que el esquema de la funcion no los repita. */
export const VALORES_CONTRATO = {
  cpd: Object.keys(CPD) as CpdContrato[],
  edr: Object.keys(EDR) as EdrContrato[],
  module: Object.keys(MODULO) as ModuloContrato[],
} as const
