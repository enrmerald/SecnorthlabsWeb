/**
 * Texto plano con los correos y las direcciones web convertidos en enlaces.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Existe para que los ficheros de mensajes no tengan que llevar HTML.
 *
 * El texto legal esta lleno de correos y direcciones metidos en medio de una
 * frase -«escribiendo a rgpd@…», «www.aepd.es»- y dejarlos como texto plano
 * obliga a seleccionarlos y copiarlos a mano justo a quien esta intentando
 * ejercer un derecho. La alternativa evidente era guardar `<a href>` dentro del
 * JSON y pintarlo con `dangerouslySetInnerHTML`; se descarta por dos razones:
 * un JSON con etiquetas ya no se puede traducir sin tocar codigo, y un helper
 * que inyecta HTML acaba antes o despues recibiendo texto que viene de fuera.
 *
 * Aqui el texto se **parte** y React pinta cada trozo como texto, de modo que
 * todo sigue escapandose. Lo unico que se construye es el `href`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Un correo o una direccion web.
 *
 * El dominio web exige `www.` por delante: sin esa ancla, cualquier frase que
 * acabe en punto y siga con minuscula -«…del sitio.Web»- se convertiria en un
 * enlace roto. Y el correo va primero en la alternancia porque `a@b.com`
 * contiene algo que parece un dominio, y al reves partiria la direccion en dos.
 *
 * El dominio se describe como **etiquetas separadas por puntos**
 * -`(?:\.[\w-]+)+`- y no como «letras y puntos». Con lo segundo, el punto final
 * de la frase entraba en la direccion: «dirigirse a rgpd@secnorthlabs.eu.»
 * generaba un `mailto:rgpd@secnorthlabs.eu.` que no abre nada.
 */
const DOMINIO = String.raw`[\w-]+(?:\.[\w-]+)+`
const PATRON = new RegExp(`([\\w.+-]+@${DOMINIO}|www\\.${DOMINIO})`, 'g')

export function TextoEnlazado({ texto }: { texto: string }) {
  const trozos = texto.split(PATRON)

  return (
    <>
      {trozos.map((trozo, i) => {
        const destino = enlaceDe(trozo)
        if (!destino) return trozo

        return (
          <a
            key={i}
            href={destino}
            className="text-cyan underline"
            // Un enlace externo se abre fuera; un `mailto:` no, porque abriria
            // una pestana en blanco antes de ceder al cliente de correo.
            {...(destino.startsWith('http')
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {trozo}
          </a>
        )
      })}
    </>
  )
}

/** `null` si el trozo no es ni correo ni direccion: entonces es texto y punto. */
function enlaceDe(trozo: string): string | null {
  if (new RegExp(`^[\\w.+-]+@${DOMINIO}$`).test(trozo)) return `mailto:${trozo}`
  if (new RegExp(`^www\\.${DOMINIO}$`).test(trozo)) return `https://${trozo}`
  return null
}
