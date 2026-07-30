import { z } from 'zod'
import mensajesEn from '../../messages/en.json' with { type: 'json' }
import mensajesEs from '../../messages/es.json' with { type: 'json' }
import {
  ContactoSchema,
  SobreSchema,
  buzonContacto,
  entorno,
  error,
  esProbableBot,
  puedeEnviarCorreo,
  referenciaCorta,
  registrar,
  responder,
  textoLargo,
  validarPeticion,
} from './_comun.ts'
import { enviarCorreo } from './_correo.ts'
import { avisoContacto } from './_plantillas/aviso-contacto.ts'

/**
 * `POST /api/contact` - formulario de contacto general.
 *
 * Valida y avisa por correo al buzón de atención. No consulta EspoCRM, no guarda
 * en base de datos y no acepta destinatario, plantilla ni URL de retorno del
 * cliente: el destinatario sale de `CONTACT_MAILBOX_TO` y la plantilla, del
 * repositorio.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Este flujo NO usa el sobre cifrado de MIG-02 §9, y es una decisión, no un
 * olvido. Aquel sobre existe para que un buzón que lee un programa pueda
 * alimentar EspoCRM sin que Resend ni el proveedor de correo vean los datos.
 * Aquí el destinatario es un buzón que lee una persona: cifrar el contenido lo
 * dejaría ilegible justo para quien tiene que atender la consulta.
 *
 * El coste asumido: Resend trata datos personales en claro (nombre, correo,
 * teléfono y mensaje). Obliga a tener el DPA aceptado y a que la política de
 * privacidad lo refleje (REQ-01 §H). Lo que sí se mantiene es la regla de no
 * poner datos personales en el asunto ni en las trazas, que es donde quedarían
 * registrados y consultables sin abrir el mensaje.
 * ═══════════════════════════════════════════════════════════════════════════
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

  const buzon = buzonContacto()
  const entornoActual = entorno()

  if (!puedeEnviarCorreo(buzon)) {
    registrar({
      tipo: 'contact',
      submissionId: peticion.submissionId,
      locale: peticion.locale,
      estado: 'modo_prueba',
      ms: Date.now() - inicio,
    })
    return responder({ ok: true, reference: referencia, delivery: 'skipped' })
  }

  const aviso = avisoContacto({
    referencia,
    submissionId: peticion.submissionId,
    locale: peticion.locale,
    createdAt: peticion.createdAt,
    entorno: entornoActual,
    contacto: peticion.contact,
    datos: peticion.data,
    privacidad: peticion.privacy,
    marketing: peticion.marketing,
  })

  const envio = await enviarCorreo({
    para: buzon as string,
    asunto:
      entornoActual === 'production' ? aviso.asunto : `[${entornoActual.toUpperCase()}] ${aviso.asunto}`,
    html: aviso.html,
    texto: aviso.texto,
    // Responder al correo escribe a la persona, no al buzón. Es la diferencia
    // entre atender la consulta y tener que copiar la dirección a mano.
    responderA: peticion.contact.email,
    idempotencia: `isnlabs/${entornoActual}/contact/${peticion.submissionId}`,
    cabeceras: {
      'X-ISNLabs-Schema': peticion.schemaVersion,
      'X-ISNLabs-Submission': peticion.submissionId,
      'X-ISNLabs-Type': 'contact',
      'X-ISNLabs-Environment': entornoActual,
      // Referencia de entidad: es lo que usan los clientes de correo para no
      // agrupar dos consultas distintas en la misma conversación.
      'X-Entity-Ref-ID': peticion.submissionId,
    },
    etiquetas: { type: 'contact', environment: entornoActual, schema: '1_0' },
  })

  if (!envio.ok) {
    registrar({
      tipo: 'contact',
      submissionId: peticion.submissionId,
      locale: peticion.locale,
      estado: `fallo_correo_${envio.codigo}`,
      ms: Date.now() - inicio,
    })
    // 503 y no 200. Si el correo no ha salido, no hay constancia de la consulta
    // en ninguna parte: decir «lo hemos recibido» sería mentir, y la persona se
    // quedaría esperando una respuesta que nadie va a escribir (REQ-01 §F.3).
    return error('unavailable', 503)
  }

  registrar({
    tipo: 'contact',
    submissionId: peticion.submissionId,
    locale: peticion.locale,
    estado: 'enviado',
    ms: Date.now() - inicio,
  })

  return responder({ ok: true, reference: referencia, delivery: 'sent' })
}

/**
 * Las necesidades admitidas, tomadas de los propios ficheros de mensajes.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `need` era texto libre de hasta 60 caracteres, **y va en el asunto del
 * correo**. Eso permitía a cualquiera que llamase al endpoint escribir lo que
 * quisiera en la línea de asunto de un correo que llega a `info@` con la marca
 * de ISN Labs: publicidad, una orden dirigida a quien lo lea, o una dirección
 * falsa a la que responder.
 *
 * Con una lista cerrada, el asunto solo puede contener uno de doce valores que
 * están en el repositorio. Se leen de `messages/*.json` en vez de copiarse aquí
 * para que añadir una opción al desplegable no obligue a acordarse de tocar
 * también la función: si se copiaran, el día que divergieran, la opción nueva
 * dejaría de funcionar en producción y en ningún sitio pondría por qué.
 *
 * Se aceptan los valores de los **dos idiomas** a la vez, no los del idioma del
 * envío: alguien puede empezar el formulario en español y cambiar de idioma
 * antes de enviarlo, y eso no es un ataque.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const NECESIDADES = new Set<string>([
  ...mensajesEs.contact.form.needOptions,
  ...mensajesEn.contact.form.needOptions,
])

const PeticionSchema = SobreSchema.extend({
  type: z.literal('contact'),
  contact: ContactoSchema,
  data: z
    .object({
      // El código de error es `need`, el mismo que usa el desplegable: quien lo
      // reciba vera «Selecciona una opción», que es exactamente lo que pasa.
      need: z.string().trim().refine((v) => NECESIDADES.has(v), 'need'),
      message: textoLargo(1000).optional(),
    })
    .strict(),
}).strict()
