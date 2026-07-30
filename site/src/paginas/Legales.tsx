import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { TextoEnlazado } from '@/components/ui/TextoEnlazado'
import { getLocalizedPath, type Locale, type RouteId } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import type { TramoBreadcrumb } from '@/lib/tipos'

/**
 * Paginas legales - `/politica-privacidad/`, `/aviso-legal/` y `/cookies/`
 * (secciones 4.13 a 4.15).
 *
 * **El texto se porta palabra por palabra.** No se reescribe ni se resume ni se
 * "mejora": lo redacto quien lleva cumplimiento y solo esa persona puede
 * cambiarlo (pendiente P16). Aqui solo se reestiliza con los tokens nuevos.
 *
 * De donde sale cada texto:
 *
 * - **Politica de privacidad** (21 apartados) y **aviso legal** (10), de los
 *   dos documentos v1.0 que entrego cumplimiento. Sustituyen a los que venian
 *   de la SPA anterior, que tenian 9 y 10 apartados con otro articulado.
 * - **Politica de cookies** (11 apartados y la tabla), redactada a partir de la
 *   de ewala.es cerrando sus huecos, el mayor de los cuales era que el apartado
 *   «Detalle de cookies instaladas» no detallaba ninguna.
 *
 * ⚠️ **La politica de cookies describe un aviso de consentimiento que todavia
 * no existe.** Dice que las analiticas no se cargan hasta aceptarlas, y hoy
 * `Analitica.tsx` las carga siempre. Esta pagina NO puede publicarse antes que
 * el aviso: hasta entonces el texto es falso, y un texto falso es peor que uno
 * incompleto. Las cadenas del aviso y del panel ya estan en `consent`.
 *
 * **El ingles de los tres documentos es una traduccion de trabajo**, no un
 * original: por eso cada pagina declara que en caso de discrepancia prevalece
 * el espanol. Cumplimiento tiene que repasarla.
 *
 * ⚠️ Los datos de empresa de estos dos documentos viven ahora en
 * `messages/*.json`, y **no** en `lib/empresa.ts`. Es deliberado -el texto
 * legal se porta literal del documento firmado, no se compone a trozos- pero
 * significa que un cambio de domicilio o de telefono hay que hacerlo en los dos
 * sitios.
 */

function ArmazonLegal({
  locale,
  routeId,
  title,
  titleHighlight,
  children,
}: {
  locale: Locale
  routeId: RouteId
  title: string
  titleHighlight: string
  children: React.ReactNode
}) {
  const { common } = cargarMensajes(locale)
  const inicio = locale === 'es' ? 'Inicio' : 'Home'

  const migas: TramoBreadcrumb[] = [
    { label: inicio, href: getLocalizedPath('home', locale) },
    { label: `${title} ${titleHighlight}`.trim(), href: null },
  ]
  void routeId

  return (
    <main id="contenido" className="site-container flex flex-col gap-8 py-10 md:py-14">
      <Breadcrumbs tramos={migas} etiqueta={common.a11y.breadcrumb} />

      <h1 className="heading-display">
        {title} <span className="text-cyan">{titleHighlight}</span>
      </h1>

      {/* Las paginas legales son texto largo: se limita la medida de linea, que
          es lo que hace legible un parrafo de veinte lineas. */}
      <div className="flex max-w-3xl flex-col gap-10">{children}</div>
    </main>
  )
}

/** Bloque numerado de una seccion legal. */
function SeccionLegal({
  numero,
  titulo,
  children,
}: {
  numero: number
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="subtitle flex items-baseline gap-3">
        <span aria-hidden="true" className="text-cyan text-sm">
          {String(numero).padStart(2, '0')}
        </span>
        {titulo}
      </h2>
      <div className="texto-cuerpo flex max-w-none flex-col gap-3 text-sm">{children}</div>
    </section>
  )
}

/**
 * La forma de un apartado de un documento legal.
 *
 * Se declara a mano en lugar de deducirla del JSON porque TypeScript ensancha
 * los literales de un fichero importado: `kind` le sale `string`, no
 * `'p' | 'ul' | …`, y sin eso el `switch` de abajo no discrimina nada. Cuesta
 * una asercion en un solo punto, y a cambio anadir un tipo de bloque nuevo sin
 * pintarlo deja de compilar.
 */
type Bloque =
  | { kind: 'p'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: readonly string[] }
  | { kind: 'dl'; items: readonly { term: string; text: string }[] }
  /** Marcador: la tabla de cookies, que se pinta con `documento.tabla`. */
  | { kind: 'tabla' }

interface SeccionDeTexto {
  title: string
  blocks: readonly Bloque[]
}

interface TablaCookies {
  caption: string
  headers: { name: string; owner: string; purpose: string; duration: string; category: string }
  rows: readonly {
    name: string
    owner: string
    purpose: string
    duration: string
    category: string
  }[]
  note: string
}

/** Lo comun a los tres documentos legales. */
interface DocumentoLegal {
  title: string
  titleHighlight: string
  intro: string
  prevalence: string
  sections: readonly SeccionDeTexto[]
  /** Solo la politica de cookies la trae. */
  tabla?: TablaCookies
}

/**
 * Un bloque de texto legal.
 *
 * Los apartados no tienen todos la misma forma -unos son parrafos, otros listas
 * de termino y definicion, y el de derechos lleva ademas un subtitulo-, asi que
 * cada apartado declara sus bloques en `messages/*.json` y aqui solo se decide
 * como se pinta cada tipo. La alternativa era un componente por apartado, que
 * con 31 apartados entre los dos documentos y en dos idiomas significa tocar
 * codigo cada vez que cumplimiento cambia una coma.
 */
function BloqueLegal({ bloque, tabla }: { bloque: Bloque; tabla?: TablaCookies }) {
  switch (bloque.kind) {
    case 'tabla':
      // Sin tabla no se pinta nada, en lugar de una cabecera vacia: una tabla de
      // cookies sin filas es justo el defecto que tenia la politica anterior.
      return tabla ? <TablaDeCookies tabla={tabla} /> : null

    case 'p':
      return (
        <p>
          <TextoEnlazado texto={bloque.text} />
        </p>
      )

    case 'h3':
      return <h3 className="font-display text-text mt-2 text-sm font-bold">{bloque.text}</h3>

    case 'ul':
      return (
        <ul className="ml-5 flex list-disc flex-col gap-2">
          {bloque.items.map((item, indice) => (
            <li key={`${indice}-${item.slice(0, 24)}`}>
              <TextoEnlazado texto={item} />
            </li>
          ))}
        </ul>
      )

    case 'dl':
      return (
        // `<dl>` y no una lista con negritas: cada fila es un termino y su
        // definicion, que es literalmente lo que describe este elemento, y un
        // lector de pantalla puede anunciarlos como tales.
        <dl className="flex flex-col gap-3">
          {bloque.items.map((item) => (
            <div key={item.term}>
              <dt className="font-display text-cyan text-[0.8125rem] font-bold">{item.term}</dt>
              <dd>
                <TextoEnlazado texto={item.text} />
              </dd>
            </div>
          ))}
        </dl>
      )
  }
}

/**
 * La tabla de cookies que exige la AEPD.
 *
 * En movil no se apila en tarjetas ni se recorta: se deja **desplazar en
 * horizontal** dentro de su propio contenedor. Una tabla de cinco columnas con
 * texto legal no cabe en 320px de ninguna forma honesta, y convertir cada fila
 * en un bloque rompe la comparacion entre cookies, que es para lo que sirve la
 * tabla. El desplazamiento es del contenedor, no de la pagina: la prueba de
 * `movil.spec.ts` comprueba que ninguna pagina desborda a lo ancho.
 */
function TablaDeCookies({ tabla }: { tabla: TablaCookies }) {
  const columnas = [
    tabla.headers.name,
    tabla.headers.owner,
    tabla.headers.purpose,
    tabla.headers.duration,
    tabla.headers.category,
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border overflow-x-auto rounded-[10px] border">
        <table className="w-full min-w-[46rem] border-collapse text-left text-xs">
          <caption className="sr-only">{tabla.caption}</caption>
          <thead>
            <tr className="bg-panel">
              {columnas.map((columna) => (
                <th
                  key={columna}
                  scope="col"
                  className="font-display text-cyan border-border border-b px-3 py-2.5 font-bold"
                >
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabla.rows.map((fila) => (
              <tr key={fila.name} className="border-border border-b last:border-b-0">
                {/* El nombre es la clave de la fila y va como cabecera de fila:
                    un lector de pantalla lo repite al leer cada celda. */}
                <th scope="row" className="font-display text-text px-3 py-2.5 font-bold">
                  {fila.name}
                </th>
                <td className="text-text-dim px-3 py-2.5">{fila.owner}</td>
                <td className="text-text-dim px-3 py-2.5">{fila.purpose}</td>
                <td className="text-text-dim px-3 py-2.5 whitespace-nowrap">{fila.duration}</td>
                <td className="text-text-dim px-3 py-2.5 whitespace-nowrap">{fila.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-text-dim text-xs italic">{tabla.note}</p>
    </div>
  )
}

/**
 * Documento legal completo: encabezado normativo, version y apartados.
 *
 * La politica de privacidad y el aviso legal lo comparten porque tienen la
 * misma forma. No es una abstraccion prematura: son los dos documentos que
 * llegan de cumplimiento en Word, con el mismo articulado numerado, y
 * mantenerlos por separado significaba arreglar dos veces cada detalle de
 * maquetacion.
 */
function PaginaDocumento({
  locale,
  routeId,
  documento,
}: {
  locale: Locale
  routeId: RouteId
  documento: DocumentoLegal
}) {
  return (
    <ArmazonLegal
      locale={locale}
      routeId={routeId}
      title={documento.title}
      titleHighlight={documento.titleHighlight}
    >
      {/* La version va a la vista porque los dos documentos se comprometen a
          publicarla, y porque sin ella nadie puede saber si esta leyendo la que
          acepto hace seis meses. */}
      <div className="border-border flex flex-col gap-3 border-b pb-8">
        <p className="texto-cuerpo text-sm">{documento.intro}</p>
        <p className="text-text-dim text-xs italic">{documento.prevalence}</p>
      </div>

      {documento.sections.map((seccion, indice) => (
        <SeccionLegal key={seccion.title} numero={indice + 1} titulo={seccion.title}>
          {seccion.blocks.map((bloque, i) => (
            <BloqueLegal key={`${bloque.kind}-${i}`} bloque={bloque} tabla={documento.tabla} />
          ))}
        </SeccionLegal>
      ))}
    </ArmazonLegal>
  )
}

export function Privacidad({ locale }: { locale: Locale }) {
  const { privacy } = cargarMensajes(locale)
  return (
    <PaginaDocumento locale={locale} routeId="privacy" documento={privacy as DocumentoLegal} />
  )
}

export function AvisoLegal({ locale }: { locale: Locale }) {
  const { legal } = cargarMensajes(locale)
  return <PaginaDocumento locale={locale} routeId="legal" documento={legal as DocumentoLegal} />
}

export function Cookies({ locale }: { locale: Locale }) {
  const { cookies } = cargarMensajes(locale)
  return (
    <PaginaDocumento locale={locale} routeId="cookies" documento={cookies as DocumentoLegal} />
  )
}
