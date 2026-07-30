/**
 * Vista previa de las plantillas de correo, sin enviar nada.
 *
 * `pnpm correos:preview` escribe los HTML en `.correos/` para abrirlos en el
 * navegador. Existe porque la única alternativa era mandarse correos de prueba a
 * uno mismo con datos inventados, y eso gasta cuota de Resend, ensucia el buzón
 * de atencion y hace lentísimo cualquier ajuste de maquetación.
 *
 * ⚠️ El navegador NO es un cliente de correo. Esto sirve para el contenido, los
 * colores y el escapado; no demuestra que Outlook lo pinte igual. Antes de
 * publicar un cambio grande de plantilla, un envío real a un buzón de prueba.
 *
 * Importa el `.ts` directamente: Node 24 quita los tipos por su cuenta, igual
 * que hace `scripts/static-server.mjs` con las propias funciones.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const raiz = join(import.meta.dirname, '..')
const destino = join(raiz, '.correos')

const { avisoContacto } = await import(
  pathToFileURL(join(raiz, 'netlify', 'functions', '_plantillas', 'aviso-contacto.ts')).href
)

/** Datos de ejemplo. Ninguno es real: es una plantilla, no una prueba de envío. */
const ejemplo = (locale) => ({
  referencia: '550E8400',
  submissionId: '550e8400-e29b-41d4-a716-446655440000',
  locale,
  createdAt: '2026-07-30T10:00:00.000Z',
  entorno: 'development',
  contacto: {
    firstName: 'María José',
    lastName: 'García Pérez',
    company: 'Acme Industrial S.A.',
    email: 'maria@acme.example',
    phone: '+34 600 000 000',
    title: 'CISO',
  },
  datos: {
    // La necesidad la elige el visitante de una lista y llega ya traducida.
    need: 'MSSP OT',
    message:
      locale === 'es'
        ? 'Tenemos dos plantas con PLC antiguos y una auditoría del ENS en octubre.\n\n¿Podemos hablar la semana que viene?'
        : 'We run two plants with legacy PLCs and an ENS audit due in October.\n\nCould we talk next week?',
  },
  privacidad: { noticeVersion: '2026-07-28' },
  marketing: { optIn: true, textVersion: '2026-07-28' },
})

await mkdir(destino, { recursive: true })

for (const locale of ['es', 'en']) {
  const correo = avisoContacto(ejemplo(locale))
  await writeFile(join(destino, `aviso-contacto-${locale}.html`), correo.html, 'utf8')
  await writeFile(join(destino, `aviso-contacto-${locale}.txt`), correo.texto, 'utf8')
  console.log(`${locale}: ${correo.asunto}`)
}

console.log(`\nEscrito en ${destino}`)
