import { z } from 'zod'

/**
 * Validacion de entrada del motor PBCG (seccion 5.4).
 *
 * Se rechazan explicitamente **negativos, decimales donde se espera entero,
 * `NaN`, `Infinity`, notacion cientifica y valores por encima del maximo**. Un
 * formulario numerico sin estas comprobaciones es la via mas facil de sacar un
 * presupuesto absurdo.
 *
 * Las claves desconocidas se rechazan con `.strict()`, no se ignoran: asi un
 * campo mal escrito da error en desarrollo en lugar de perderse en silencio.
 */

/** Entero finito dentro de un rango. `z.int()` ya excluye NaN e Infinity. */
const entero = (min: number, max: number) => z.int().min(min).max(max)

const CamposCalculo = z.object({
  sedes: entero(1, 50),
  usuarios: entero(1, 2000),
  cpd: z.enum(['externo', 'propio', 'hibrido']),
  srvFisPropio: entero(0, 200),
  srvVirPropio: entero(0, 500),
  srvFisExt: entero(0, 200),
  srvVirExt: entero(0, 500),
  instalacionesOT: entero(0, 20),
  edr: z.enum(['ninguno', 'edr', 'mdr']),
  licenciasIncluidas: z.boolean(),
  backup: z.boolean(),
  firewalls: entero(0, 50),
  siem: z.boolean(),
  parcheo: z.boolean(),
  horasConsultoria: z.union([z.literal(0), z.literal(2), z.literal(4), z.literal(6)]),
  modulo: z.enum(['ninguno', 'nis2', 'ensMedia', 'ensAlta']),
})

/** Codigos de error que devuelve la API. El texto lo pone el sitio. */
export const ERROR_CPD_PROPIO = 'cpdPropioConServidoresExternos'
export const ERROR_CPD_EXTERNO = 'cpdExternoConServidoresPropios'

/**
 * Coherencia CPD ↔ servidores (bloqueante B06).
 *
 * **No se genera presupuesto**, no se pone nada a cero. La version anterior del
 * plan normalizaba en silencio los servidores incompatibles con el CPD elegido
 * y seguia calculando, lo que puede producir una cotizacion **mas barata que la
 * real**: quien marque «CPD propio» y rellene los servidores externos veria un
 * precio que no los incluye.
 *
 * Caso concreto que motiva la regla: el usuario elige «Hibrido», rellena los
 * cuatro campos de servidores y luego cambia a «Propio». Los valores externos
 * siguen en el estado del formulario aunque sus campos esten ocultos. Debe
 * saltar el error.
 */
export const CalcInputSchema = CamposCalculo.strict()
  .refine((v) => !(v.cpd === 'propio' && v.srvFisExt + v.srvVirExt > 0), {
    error: ERROR_CPD_PROPIO,
    path: ['cpd'],
  })
  .refine((v) => !(v.cpd === 'externo' && v.srvFisPropio + v.srvVirPropio > 0), {
    error: ERROR_CPD_EXTERNO,
    path: ['cpd'],
  })

export type CalcInputValidado = z.infer<typeof CalcInputSchema>
