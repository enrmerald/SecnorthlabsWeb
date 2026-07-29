import { z } from 'zod'
import {
  ContactoSchema,
  SobreSchema,
  error,
  esProbableBot,
  puedeEnviarCorreo,
  referenciaCorta,
  registrar,
  responder,
  validarPeticion,
} from './_comun.ts'

/**
 * `POST /api/contact` — formulario de contacto general.
 *
 * Es el mismo flujo que `quote` sin el cálculo: valida, cifra y envía al buzón de
 * ingestión. No consulta EspoCRM, no guarda en base de datos y no acepta
 * destinatario, plantilla ni URL de retorno del cliente.
 */
export default async function handler(request: Request): Promise<Response> {
  const inicio = Date.now()

  const previo = await validarPeticion(request)
  if ('rechazo' in previo) return previo.rechazo

  const analizado = PeticionSchema.safeParse(previo.cuerpo)
  if (!analizado.success) {
    const campos: Record<string, string> = {}
    for (const p of analizado.error.issues) {
      campos[p.path.join('.') || 'general'] ??= p.message
    }
    return error('validation', 400, campos)
  }

  const peticion = analizado.data
  const referencia = referenciaCorta(peticion.submissionId)

  if (esProbableBot(peticion.antispam)) {
    registrar({
      tipo: 'contact',
      submissionId: peticion.submissionId,
      locale: peticion.locale,
      estado: 'descartado_antispam',
      ms: Date.now() - inicio,
    })
    // Éxito silencioso: al bot no se le dice que se le ha detectado.
    return responder({ ok: true, reference: referencia, delivery: 'skipped' })
  }

  const enviado = puedeEnviarCorreo()
  if (enviado) {
    // TODO(entrega): firmar, cifrar y enviar por Resend al buzón de ingestión,
    // más el acuse al interesado. Pendiente del buzón y del dominio verificado.
  }

  registrar({
    tipo: 'contact',
    submissionId: peticion.submissionId,
    locale: peticion.locale,
    estado: enviado ? 'enviado' : 'modo_prueba',
    ms: Date.now() - inicio,
  })

  return responder({ ok: true, reference: referencia, delivery: enviado ? 'sent' : 'skipped' })
}

const PeticionSchema = SobreSchema.extend({
  type: z.literal('contact'),
  contact: ContactoSchema,
  data: z
    .object({
      need: z.string().trim().min(1).max(60),
      message: z.string().trim().max(1000).optional().or(z.literal('')),
    })
    .strict(),
}).strict()
