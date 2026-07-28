#!/usr/bin/env node
/**
 * CLI del motor PBCG (ISNLA-DOC-0008-MIG-02 §16.2).
 *
 * Existe para que el **servicio local de ingestion** —que es Python y vive en
 * otro repositorio— use exactamente este motor, con sus 59 tests y su caso de
 * oro, en lugar de una reimplementacion.
 *
 * Portar el calculo a Python introduciria dos fuentes de verdad para el mismo
 * precio, y la unica forma de saber que coinciden seria mantener pruebas
 * cruzadas indefinidamente. Es mas barato invocar este proceso.
 *
 * Entrada por stdin:
 *   { "schemaVersion": "1.0", "input": { …payload del contrato, en ingles… } }
 *
 * Salida por stdout:
 *   { "ok": true,  "modelVersion": "2026-07-v2", "quote": { …PublicQuoteDto… } }
 *   { "ok": false, "error": "validation", "issues": [ … ] }
 *
 * Codigos de salida: 0 si se ha calculado, 1 si la entrada no es valida, 2 si
 * ha fallado algo inesperado. El invocador distingue "dato malo del cliente" de
 * "el motor esta roto", que son dos incidencias distintas.
 *
 * Se ejecuta con type stripping nativo de Node 24: no hay build previo.
 */
import { calcular } from '../src/calculate.ts'
import { CONTRACT_VERSION, contratoAEntrada } from '../src/contrato.ts'
import { PBCG_MODEL_VERSION } from '../src/config.ts'
import { CalcInputSchema } from '../src/schemas.ts'
import { toPublicDto } from '../src/types.ts'

const responder = (objeto, codigo) => {
  process.stdout.write(`${JSON.stringify(objeto)}\n`)
  process.exit(codigo)
}

let crudo = ''
for await (const trozo of process.stdin) crudo += trozo

// Limite de tamano: el invocador no debe poder agotar la memoria del proceso
// con una entrada enorme.
if (crudo.length > 64 * 1024) {
  responder({ ok: false, error: 'payloadTooLarge' }, 1)
}

let sobre
try {
  sobre = JSON.parse(crudo)
} catch {
  responder({ ok: false, error: 'invalidJson' }, 1)
}

if (sobre?.schemaVersion !== CONTRACT_VERSION) {
  // Version distinta = el contrato ha cambiado y este motor no lo entiende. Se
  // rechaza en lugar de intentar adivinar: un calculo con un payload que no se
  // comprende del todo es peor que no calcular.
  responder(
    { ok: false, error: 'unsupportedSchemaVersion', expected: CONTRACT_VERSION },
    1,
  )
}

let entrada
try {
  entrada = contratoAEntrada(sobre.input ?? {})
} catch (error) {
  responder({ ok: false, error: 'contractMapping', detail: String(error?.message ?? '') }, 1)
}

const validado = CalcInputSchema.safeParse(entrada)
if (!validado.success) {
  // Se devuelven los codigos de error, no frases: el texto que ve la persona lo
  // pone el sitio, traducido.
  responder(
    {
      ok: false,
      error: 'validation',
      issues: validado.error.issues.map((i) => ({
        path: i.path.join('.'),
        code: i.message,
      })),
    },
    1,
  )
}

try {
  const resultado = calcular(validado.data)
  // Solo el DTO publico. La conversion pasa por toPublicDto() para que ni aqui
  // se pueda devolver por descuido el resultado interno con las horas y el
  // desglose.
  responder(
    { ok: true, modelVersion: PBCG_MODEL_VERSION, quote: toPublicDto(resultado) },
    0,
  )
} catch (error) {
  // Nada de datos de entrada en el mensaje: este texto puede acabar en un log.
  responder({ ok: false, error: 'engineFailure', detail: String(error?.message ?? '') }, 2)
}
