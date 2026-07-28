#!/usr/bin/env node
/**
 * Genera `contracts/pbcg-golden-vectors.json` (ISNLA-DOC-0008-MIG-02 §16.4).
 *
 * Para que sirve: el servicio local de ingestion invoca este motor por CLI, pero
 * necesita poder comprobar **que su lado del contrato funciona** —que serializa
 * bien, que traduce bien los enums, que interpreta bien la respuesta— sin
 * depender de tener el motor delante. Estos vectores son ese banco de pruebas
 * compartido: mismos casos, mismos resultados esperados, en un fichero que
 * cualquier lenguaje puede leer.
 *
 * Sin ellos, la unica forma de saber si Python y TypeScript coinciden es que un
 * cliente real reciba un precio distinto del que se guardo en el CRM.
 *
 * Los vectores se generan **desde el motor**, no se escriben a mano: si alguien
 * cambia una tarifa y sube PBCG_MODEL_VERSION, se regeneran y el diff muestra
 * exactamente que precios se han movido.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { calcular } from '../src/calculate.ts'
import { PBCG_MODEL_VERSION } from '../src/config.ts'
import { CONTRACT_VERSION, contratoAEntrada } from '../src/contrato.ts'
import { CalcInputSchema } from '../src/schemas.ts'
import { toPublicDto } from '../src/types.ts'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const destino = join(raiz, 'contracts', 'pbcg-golden-vectors.json')

/** Caso base neutro, en el idioma del contrato. */
const BASE = {
  sites: 1,
  users: 10,
  cpd: 'external',
  physicalServersOwn: 0,
  virtualServersOwn: 0,
  physicalServersExternal: 0,
  virtualServersExternal: 0,
  otInstallations: 0,
  edr: 'none',
  licensesIncluded: false,
  backup: false,
  firewalls: 0,
  siem: false,
  patching: false,
  consultingHours: 0,
  module: 'none',
}

const con = (cambios) => ({ ...BASE, ...cambios })

/**
 * Los casos. Cubren lo mismo que la bateria de tests: el caso de oro, las
 * fronteras de tamano, el escalon por OT y CPD, los nueve de modulo por tamano,
 * las licencias, los extremos y las entradas que deben ser rechazadas.
 */
const CASOS = [
  {
    id: 'caso-de-oro',
    descripcion: 'Columna B de la hoja CALCULADORA del dimensionador. 840 EUR, 815-900.',
    input: con({
      users: 25,
      physicalServersExternal: 1,
      virtualServersExternal: 3,
      edr: 'edr',
      licensesIncluded: true,
      backup: true,
      firewalls: 1,
      consultingHours: 2,
      module: 'ensMedium',
    }),
  },

  // Fronteras de tamano: donde vive el error de < frente a <=.
  { id: 'usuarios-25-limite-S', input: con({ users: 25 }) },
  { id: 'usuarios-26-pasa-a-M', input: con({ users: 26 }) },
  { id: 'usuarios-75-limite-M', input: con({ users: 75 }) },
  { id: 'usuarios-76-pasa-a-L', input: con({ users: 76 }) },
  { id: 'sedes-1-limite-S', input: con({ sites: 1 }) },
  { id: 'sedes-4-pasa-a-L', input: con({ sites: 4 }) },
  { id: 'criterios-en-conflicto-manda-el-peor', input: con({ users: 10, sites: 5 }) },

  // Escalon por OT y CPD.
  { id: 'ot-sube-un-escalon', input: con({ otInstallations: 1 }) },
  { id: 'cpd-propio-sube-un-escalon', input: con({ cpd: 'own' }) },
  { id: 'cpd-hibrido-sube-un-escalon', input: con({ cpd: 'hybrid' }) },
  {
    id: 'ya-en-L-con-OT-no-desborda',
    input: con({ users: 500, otInstallations: 3, cpd: 'own', physicalServersOwn: 1 }),
  },

  // Los nueve de modulo por tamano.
  ...['nis2', 'ensMedium', 'ensHigh'].flatMap((module) =>
    [
      { etiqueta: 'S', users: 10 },
      { etiqueta: 'M', users: 50 },
      { etiqueta: 'L', users: 200 },
    ].map(({ etiqueta, users }) => ({
      id: `modulo-${module}-tamano-${etiqueta}`,
      input: con({ module, users }),
    })),
  ),

  // Licencias.
  { id: 'licencias-edr', input: con({ users: 40, edr: 'edr', licensesIncluded: true }) },
  { id: 'licencias-mdr', input: con({ users: 40, edr: 'mdr', licensesIncluded: true }) },
  {
    id: 'sin-edr-no-hay-licencias',
    descripcion: 'Aunque se marque la casilla: sin EDR el importe es cero.',
    input: con({ users: 40, edr: 'none', licensesIncluded: true }),
  },
  { id: 'edr-sin-licencias', input: con({ users: 40, edr: 'edr', licensesIncluded: false }) },

  // Extremos.
  { id: 'todo-desactivado', descripcion: 'Todo a cero: el total es cero.', input: BASE },
  {
    id: 'valores-maximos',
    input: con({
      sites: 50,
      users: 2000,
      cpd: 'hybrid',
      physicalServersOwn: 200,
      virtualServersOwn: 500,
      physicalServersExternal: 200,
      virtualServersExternal: 500,
      otInstallations: 20,
      edr: 'mdr',
      licensesIncluded: true,
      backup: true,
      firewalls: 50,
      siem: true,
      patching: true,
      consultingHours: 6,
      module: 'ensHigh',
    }),
  },
]

/** Entradas que el motor debe RECHAZAR. Igual de importantes que las validas. */
const CASOS_INVALIDOS = [
  {
    id: 'cpd-propio-con-servidores-externos',
    descripcion:
      'Bloqueante B06: no se normaliza en silencio. Poner a cero los servidores ' +
      'incompatibles produciria una cotizacion mas barata que la real.',
    input: con({ cpd: 'own', physicalServersExternal: 2 }),
    esperado: 'cpdPropioConServidoresExternos',
  },
  {
    id: 'cpd-externo-con-servidores-propios',
    input: con({ cpd: 'external', virtualServersOwn: 3 }),
    esperado: 'cpdExternoConServidoresPropios',
  },
  {
    id: 'hibrido-cambiado-a-propio-conservando-valores',
    descripcion:
      'La persona rellena los cuatro campos en Hibrido y cambia a Propio. Los ' +
      'externos siguen en el estado del formulario aunque sus campos esten ocultos.',
    input: con({
      cpd: 'own',
      physicalServersOwn: 2,
      virtualServersOwn: 4,
      physicalServersExternal: 3,
      virtualServersExternal: 6,
    }),
    esperado: 'cpdPropioConServidoresExternos',
  },
  { id: 'usuarios-negativos', input: con({ users: -1 }), esperado: 'rango' },
  { id: 'usuarios-decimales', input: con({ users: 10.5 }), esperado: 'entero' },
  { id: 'usuarios-por-encima-del-maximo', input: con({ users: 2001 }), esperado: 'rango' },
  { id: 'horas-consultoria-no-permitidas', input: con({ consultingHours: 3 }), esperado: 'valor' },
]

// ── Generacion ───────────────────────────────────────────────────────────────

const validos = []
for (const caso of CASOS) {
  const entrada = contratoAEntrada(caso.input)
  const validado = CalcInputSchema.safeParse(entrada)
  if (!validado.success) {
    throw new Error(`El caso valido "${caso.id}" no pasa la validacion. Revisa el vector.`)
  }
  const resultado = calcular(validado.data)
  validos.push({
    id: caso.id,
    ...(caso.descripcion ? { descripcion: caso.descripcion } : {}),
    input: caso.input,
    // El DTO publico: es lo unico que el servicio local recibe del CLI.
    quote: toPublicDto(resultado),
    // Y las magnitudes internas, para que el servicio local pueda depurar
    // contra el Excel si algun dia no cuadra un caso.
    interno: {
      size: resultado.size,
      technicalHours: resultado.technicalHours,
      auditHoursAnnual: resultado.auditHoursAnnual,
      totalCents: resultado.totalCents,
    },
  })
}

const invalidos = []
for (const caso of CASOS_INVALIDOS) {
  const validado = CalcInputSchema.safeParse(contratoAEntrada(caso.input))
  if (validado.success) {
    throw new Error(`El caso invalido "${caso.id}" ha pasado la validacion. Es un fallo real.`)
  }
  invalidos.push({
    id: caso.id,
    ...(caso.descripcion ? { descripcion: caso.descripcion } : {}),
    input: caso.input,
    debeRechazarse: true,
    codigos: validado.error.issues.map((i) => i.message),
  })
}

const salida = {
  $comentario:
    'Generado por site/pbcg/bin/generar-vectores.mjs. NO editar a mano: se regenera ' +
    'con `pnpm vectores` y el diff muestra que precios se han movido.',
  contractVersion: CONTRACT_VERSION,
  modelVersion: PBCG_MODEL_VERSION,
  currency: 'EUR',
  $unidades: 'Todos los importes en centimos enteros.',
  casos: validos,
  casosInvalidos: invalidos,
}

await mkdir(dirname(destino), { recursive: true })
await writeFile(destino, `${JSON.stringify(salida, null, 2)}\n`, 'utf8')

console.log(
  `vectores · ${validos.length} casos validos y ${invalidos.length} rechazos -> contracts/pbcg-golden-vectors.json`,
)
