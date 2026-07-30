import { z } from 'zod'
import { calcular } from '../../pbcg/src/calculate.ts'
import { PBCG_MODEL_VERSION } from '../../pbcg/src/config.ts'
import { VALORES_CONTRATO, contratoAEntrada } from '../../pbcg/src/contrato.ts'
import { CalcInputSchema } from '../../pbcg/src/schemas.ts'
import { toPublicDto } from '../../pbcg/src/types.ts'
import {
  ContactoSchema,
  SobreSchema,
  camposConError,
  error,
  esProbableBot,
  referenciaCorta,
  registrar,
  responder,
  validarPeticion,
} from './_comun.ts'

/**
 * `POST /api/quote` - cotización del PBCG con el precio en pantalla.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTA ES LA VARIANTE HÍBRIDA de MIG-02 §0.4, adoptada por decisión de Dirección
 * del 28/07/2026: el motor se ejecuta aquí, en servidor, para poder devolver el
 * precio al momento.
 *
 * Lo que eso NO significa: las tarifas no viajan al navegador. El código de una
 * Netlify Function se ejecuta en servidor y el visitante nunca lo descarga. El
 * bloqueante B01 original -el modelo publicado en el JavaScript del cliente-
 * sigue cerrado, y `verify:architecture` lo comprueba en cada build prohibiendo
 * que `src/` importe de `pbcg/`.
 *
 * Lo que sí significa: el modelo vive en el repositorio que Netlify clona. Es el
 * coste asumido, y está documentado en ISNLA-DOC-0008-REQ-01 §0.1.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default async function handler(request: Request): Promise<Response> {
  const inicio = Date.now()

  const previo = await validarPeticion(request)
  if ('rechazo' in previo) return previo.rechazo

  const analizado = PeticionSchema.safeParse(previo.cuerpo)
  if (!analizado.success) {
    // Se devuelven los códigos de error por campo, no frases: el texto lo pone
    // el sitio, traducido, desde `calculator.errors.*`.
    return error('validation', 400, camposConError(analizado.error))
  }

  const peticion = analizado.data

  // Bot: éxito silencioso. No se calcula, no se envía, y la respuesta es
  // indistinguible de la buena para quien está automatizando.
  if (esProbableBot(peticion.antispam)) {
    registrar({
      tipo: 'quote',
      submissionId: peticion.submissionId,
      locale: peticion.locale,
      estado: 'descartado_antispam',
      ms: Date.now() - inicio,
    })
    return respuestaSilenciosa(peticion.submissionId)
  }

  // Traducir del contrato al motor, y validar con el esquema del motor. En este
  // orden: así los códigos de error hablan de los campos que el caso de oro y
  // los tests conocen.
  const entrada = CalcInputSchema.safeParse(contratoAEntrada(peticion.data))
  if (!entrada.success) {
    return error('validation', 400, camposConError(entrada.error))
  }

  // ── El único cálculo, y aquí ──
  const resultado = calcular(entrada.data)

  // ═══════════════════════════════════════════════════════════════════════════
  // Constante y NO `puedeEnviarCorreo(buzonIngestion())`, que es lo que decía
  // antes y era un fallo silencioso esperando su momento.
  //
  // La entrega cifrada del TODO de abajo no está implementada. Preguntar por las
  // variables de entorno hacía que `delivery` pasara a `'sent'` el día que
  // alguien definiera `LEAD_MAILBOX_TO` -y `RESEND_API_KEY` y `RESEND_FROM` ya
  // están puestas en producción para el formulario de contacto-, de modo que la
  // función habría empezado a responder «enviado» sin enviar nada y cada lead se
  // habría perdido sin dejar rastro. Es justo lo contrario de lo que razona
  // `contact.ts` al devolver 503 cuando el correo no sale.
  //
  // Se vuelve a calcular a partir del entorno cuando exista el envío, no antes.
  // ═══════════════════════════════════════════════════════════════════════════
  const enviado = false

  // TODO(entrega): firmar (JWS Ed25519), cifrar (JWE RSA-OAEP-256) y enviar
  // por Resend al buzón de ingestión, más el correo con la estimación al
  // interesado. Pendiente de que exista el buzón y el dominio verificado
  // (ISNLA-DOC-0008-REQ-01, bloques A y B). Al implementarlo, `enviado` pasa a
  // ser el resultado real del envío.

  registrar({
    tipo: 'quote',
    submissionId: peticion.submissionId,
    locale: peticion.locale,
    // El modelo con el que se calculó, para poder responder en octubre por qué
    // una oferta de julio decía 815 €.
    estado: `calculado_${PBCG_MODEL_VERSION}`,
    ms: Date.now() - inicio,
  })

  return responder({
    ok: true,
    reference: referenciaCorta(peticion.submissionId),
    // Solo el DTO público, por `toPublicDto()`: ni horas internas, ni tarifa
    // efectiva, ni margen, ni coeficientes.
    quote: toPublicDto(resultado),
    delivery: enviado ? 'sent' : 'skipped',
  })
}

/** Respuesta que ve un bot: idéntica en forma, sin precio. */
const respuestaSilenciosa = (submissionId: string) =>
  responder({
    ok: true,
    reference: referenciaCorta(submissionId),
    quote: null,
    delivery: 'skipped',
  })

/**
 * Parámetros técnicos, en el idioma del contrato.
 *
 * Los rangos se repiten aquí a propósito, aunque `CalcInputSchema` también los
 * comprueba: rechazar un `users: 10000000` antes de traducir evita que un valor
 * absurdo entre en la lógica, y el mensaje de error es el mismo en los dos
 * sitios porque los códigos se comparten.
 */
const entero = (min: number, max: number) => z.number().int().min(min).max(max)

const DatosCotizacionSchema = z
  .object({
    sites: entero(1, 50),
    users: entero(1, 2000),
    cpd: z.enum(VALORES_CONTRATO.cpd),
    physicalServersOwn: entero(0, 200),
    virtualServersOwn: entero(0, 500),
    physicalServersExternal: entero(0, 200),
    virtualServersExternal: entero(0, 500),
    otInstallations: entero(0, 20),
    edr: z.enum(VALORES_CONTRATO.edr),
    licensesIncluded: z.boolean(),
    backup: z.boolean(),
    firewalls: entero(0, 50),
    siem: z.boolean(),
    patching: z.boolean(),
    consultingHours: z.union([z.literal(0), z.literal(2), z.literal(4), z.literal(6)]),
    module: z.enum(VALORES_CONTRATO.module),
  })
  .strict()

const PeticionSchema = SobreSchema.extend({
  type: z.literal('quote_request'),
  contact: ContactoSchema,
  data: DatosCotizacionSchema,
}).strict()

