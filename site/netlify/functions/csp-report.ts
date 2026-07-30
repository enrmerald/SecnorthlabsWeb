import { CABECERAS, registrar } from './_comun.ts'

/**
 * `POST /api/csp-report` - sumidero de los informes de la CSP.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EXISTE PORQUE UNA CSP EN MODO INFORME SIN SUMIDERO NO INFORMA DE NADA.
 *
 * `netlify.toml` lleva la politica como `Content-Security-Policy-Report-Only` con
 * una nota que dice «no se pasa a bloqueo sin medir con trafico real». Pero sin
 * `report-uri` ni `report-to`, el navegador detecta las violaciones y no las manda
 * a ninguna parte: la politica no protegia -es Report-Only- y tampoco podia
 * informar, de modo que el plan escrito en ese comentario no se podia ejecutar.
 *
 * Con esto, el paso a bloqueo deja de ser un acto de fe. Y de paso, cuando se
 * instale Cookiebot, los informes diran exactamente que hosts hay que anadir a la
 * politica en lugar de tener que adivinarlos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **No se registra el informe entero, y es a proposito.** Un informe de CSP puede
 * llevar `script-sample` -un trozo del script bloqueado- y una `document-uri` con
 * la query completa. Ninguna de las dos cosas hace falta para decidir si un host
 * se anade a la politica, y las dos pueden arrastrar datos de quien navegaba. Se
 * queda solo con la directiva, el host bloqueado y la **ruta** del documento.
 */

/** Informe del `report-uri` clasico. */
interface InformeClasico {
  'csp-report'?: {
    'violated-directive'?: unknown
    'effective-directive'?: unknown
    'blocked-uri'?: unknown
    'document-uri'?: unknown
  }
}

/** Informe de la Reporting API (`report-to`), que llega en lote. */
interface InformeModerno {
  type?: unknown
  body?: {
    effectiveDirective?: unknown
    blockedURL?: unknown
    documentURL?: unknown
  }
}

const texto = (valor: unknown): string | undefined =>
  typeof valor === 'string' && valor !== '' ? valor : undefined

/**
 * Deja de una URL solo lo que sirve para decidir: origen y ruta.
 *
 * La query y el fragmento se tiran. En `document-uri` pueden llevar lo que la
 * persona estuviera consultando, y para saber que hay que permitir
 * `consent.cookiebot.com` no hace falta saber en que pagina estaba.
 */
function sinQuery(valor: unknown): string | undefined {
  const bruto = texto(valor)
  if (!bruto) return undefined

  // Valores como 'inline', 'eval' o 'data' no son URLs y se pasan tal cual.
  try {
    const url = new URL(bruto)
    return `${url.origin}${url.pathname}`
  } catch {
    return bruto.slice(0, 80)
  }
}

/** Normaliza los dos formatos a una sola forma. */
function normalizar(cuerpo: unknown): Array<{ directiva: string; bloqueado: string; documento: string }> {
  const salida: Array<{ directiva: string; bloqueado: string; documento: string }> = []

  const anadir = (directiva?: string, bloqueado?: string, documento?: string) => {
    salida.push({
      directiva: directiva ?? 'desconocida',
      bloqueado: bloqueado ?? 'desconocido',
      documento: documento ?? 'desconocido',
    })
  }

  // Reporting API: un array de informes, y no todos son de CSP.
  if (Array.isArray(cuerpo)) {
    for (const entrada of cuerpo as InformeModerno[]) {
      if (entrada?.type !== 'csp-violation') continue
      anadir(
        texto(entrada.body?.effectiveDirective),
        sinQuery(entrada.body?.blockedURL),
        sinQuery(entrada.body?.documentURL),
      )
    }
    return salida
  }

  const clasico = (cuerpo as InformeClasico)?.['csp-report']
  if (clasico) {
    anadir(
      texto(clasico['effective-directive']) ?? texto(clasico['violated-directive']),
      sinQuery(clasico['blocked-uri']),
      sinQuery(clasico['document-uri']),
    )
  }

  return salida
}

/** Tope de cuerpo. Un informe legitimo no llega ni de lejos. */
const TAMANO_MAXIMO_BYTES = 16 * 1024

export default async function handler(request: Request): Promise<Response> {
  // Siempre 204, pase lo que pase. Un navegador que manda un informe no espera
  // respuesta y no hay nada que pueda hacer con un error: devolver 4xx solo
  // llenaria su consola de ruido sobre un fallo que no es suyo.
  const nada = () => new Response(null, { status: 204, headers: CABECERAS })

  if (request.method !== 'POST') return nada()

  const texto = await request.text()
  if (texto.length > TAMANO_MAXIMO_BYTES) return nada()

  let cuerpo: unknown
  try {
    cuerpo = JSON.parse(texto)
  } catch {
    return nada()
  }

  for (const violacion of normalizar(cuerpo)) {
    // Se reutiliza `registrar()` para que estas trazas tengan la misma forma que
    // las de las otras funciones y se puedan filtrar igual. No hay `submissionId`
    // porque no hay envio: el hueco lo ocupa la directiva.
    registrar({
      tipo: 'csp',
      submissionId: violacion.directiva,
      locale: violacion.documento,
      estado: `bloqueado_${violacion.bloqueado}`,
      ms: 0,
    })
  }

  return nada()
}
