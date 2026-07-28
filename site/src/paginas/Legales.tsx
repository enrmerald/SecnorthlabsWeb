import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { getLocalizedPath, type Locale, type RouteId } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import { EMPRESA } from '@/lib/empresa'
import type { TramoBreadcrumb } from '@/lib/tipos'

/**
 * Paginas legales — `/politica-privacidad/`, `/aviso-legal/` y `/cookies/`
 * (secciones 4.13 a 4.15).
 *
 * **El texto se porta palabra por palabra desde la SPA actual.** No se reescribe
 * ni se resume ni se "mejora": lo redacto quien lleva cumplimiento y solo esa
 * persona puede cambiarlo (pendiente P16). Aqui solo se reestiliza con los
 * tokens nuevos.
 *
 * Un cambio si se ha hecho, y es una correccion de dato: los datos del
 * responsable estaban **incrustados en el JSX** de `Privacidad.tsx` y
 * `Aviso.tsx`, no en el JSON, y la razon social que figuraba —«Innovation &
 * NORTH LABS SL»— no es la denominacion registrada. Ahora salen de
 * `lib/empresa.ts`, que es la unica fuente de datos de empresa del sitio.
 */

/** Ficha del responsable del tratamiento. La comparten privacidad y aviso legal. */
function FichaResponsable({
  etiquetas,
}: {
  etiquetas: { holder: string; address: string; nif: string; email: string }
}) {
  const filas = [
    { label: etiquetas.holder, value: EMPRESA.razonSocial },
    {
      label: etiquetas.address,
      value: `${EMPRESA.direccion.calle}, ${EMPRESA.direccion.poligono}, ${EMPRESA.direccion.localidad}, CP ${EMPRESA.direccion.codigoPostal}`,
    },
    { label: etiquetas.nif, value: EMPRESA.nif },
  ]

  return (
    <address className="flex flex-col gap-2 not-italic">
      {filas.map((fila) => (
        <p key={fila.label} className="text-sm">
          <span className="font-display text-cyan font-bold">{fila.label}:</span> {fila.value}
        </p>
      ))}
      <p className="text-sm">
        <span className="font-display text-cyan font-bold">{etiquetas.email}:</span>{' '}
        <a href={`mailto:${EMPRESA.email}`} className="hover:text-cyan underline">
          {EMPRESA.email}
        </a>
      </p>
    </address>
  )
}

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

const Parrafos = ({ textos }: { textos: readonly string[] }) => (
  <>
    {textos.map((texto, indice) => (
      <p key={`${indice}-${texto.slice(0, 24)}`}>{texto}</p>
    ))}
  </>
)

const Lista = ({ textos }: { textos: readonly string[] }) => (
  <ul className="ml-5 flex list-disc flex-col gap-2">
    {textos.map((texto, indice) => (
      <li key={`${indice}-${texto.slice(0, 24)}`}>{texto}</li>
    ))}
  </ul>
)

export function Privacidad({ locale }: { locale: Locale }) {
  const { privacy } = cargarMensajes(locale)
  const s = privacy.sections

  return (
    <ArmazonLegal
      locale={locale}
      routeId="privacy"
      title={privacy.title}
      titleHighlight={privacy.titleHighlight}
    >
      <SeccionLegal numero={1} titulo={s.responsable.title}>
        <FichaResponsable etiquetas={s.responsable} />
      </SeccionLegal>

      <SeccionLegal numero={2} titulo={s.finalidades.title}>
        <p className="text-text">{s.finalidades.intro}</p>
        <Lista textos={s.finalidades.list} />
      </SeccionLegal>

      <SeccionLegal numero={3} titulo={s.legitimacion.title}>
        <Parrafos textos={s.legitimacion.content} />
      </SeccionLegal>

      <SeccionLegal numero={4} titulo={s.categorias.title}>
        <Lista textos={s.categorias.list} />
        <p className="border-border border-t pt-4 text-xs italic">{s.categorias.note}</p>
      </SeccionLegal>

      <SeccionLegal numero={5} titulo={s.comunicaciones.title}>
        <Lista textos={s.comunicaciones.list} />
      </SeccionLegal>

      <SeccionLegal numero={6} titulo={s.transferencias.title}>
        <p>{s.transferencias.content}</p>
      </SeccionLegal>

      <SeccionLegal numero={7} titulo={s.conservacion.title}>
        <Parrafos textos={s.conservacion.content} />
      </SeccionLegal>

      <SeccionLegal numero={8} titulo={s.derechos.title}>
        <Lista textos={s.derechos.list} />
      </SeccionLegal>

      <SeccionLegal numero={9} titulo={s.seguridad.title}>
        <Parrafos textos={s.seguridad.content} />
      </SeccionLegal>
    </ArmazonLegal>
  )
}

export function AvisoLegal({ locale }: { locale: Locale }) {
  const { legal } = cargarMensajes(locale)
  const s = legal.sections

  return (
    <ArmazonLegal
      locale={locale}
      routeId="legal"
      title={legal.title}
      titleHighlight={legal.titleHighlight}
    >
      <SeccionLegal numero={1} titulo={s.responsable.title}>
        <FichaResponsable etiquetas={s.responsable} />
      </SeccionLegal>

      <SeccionLegal numero={2} titulo={s.objeto.title}>
        <Parrafos textos={[s.objeto.p1, s.objeto.p2]} />
      </SeccionLegal>

      <SeccionLegal numero={3} titulo={s.propiedad.title}>
        <Parrafos textos={[s.propiedad.p1, s.propiedad.p2, s.propiedad.p3]} />
      </SeccionLegal>

      <SeccionLegal numero={4} titulo={s.enlaces.title}>
        <Parrafos textos={[s.enlaces.p1, s.enlaces.p2, s.enlaces.p3]} />
      </SeccionLegal>

      <SeccionLegal numero={5} titulo={s.uso.title}>
        <Parrafos textos={[s.uso.p1, s.uso.p2]} />
      </SeccionLegal>

      <SeccionLegal numero={6} titulo={s.exclusion.title}>
        <Parrafos
          textos={[s.exclusion.p1, s.exclusion.p2, s.exclusion.p3, s.exclusion.p4, s.exclusion.p5]}
        />
      </SeccionLegal>

      <SeccionLegal numero={7} titulo={s.proteccion.title}>
        <Parrafos textos={[s.proteccion.p1, s.proteccion.p2]} />
      </SeccionLegal>

      <SeccionLegal numero={8} titulo={s.cookies.title}>
        <p>{s.cookies.content}</p>
      </SeccionLegal>

      <SeccionLegal numero={9} titulo={s.miscelanea.title}>
        <p>{s.miscelanea.p1}</p>
      </SeccionLegal>

      <SeccionLegal numero={10} titulo={s.jurisdiccion.title}>
        <Parrafos textos={[s.jurisdiccion.p1, s.jurisdiccion.p2]} />
      </SeccionLegal>
    </ArmazonLegal>
  )
}

export function Cookies({ locale }: { locale: Locale }) {
  const { cookies, consent } = cargarMensajes(locale)

  return (
    <ArmazonLegal
      locale={locale}
      routeId="cookies"
      title={cookies.title}
      titleHighlight={cookies.titleHighlight}
    >
      <SeccionLegal numero={1} titulo={cookies.sections.info.title}>
        <Parrafos textos={cookies.sections.info.paragraphs} />
      </SeccionLegal>

      {/* Tabla de cookies y tecnologias utilizadas (Fase 8). La AEPD la exige y
          hoy no existe en la web actual. Se rellena cuando este decidida la
          analitica (pendiente P12); mientras tanto se declara con honestidad
          que no hay mas que las estrictamente necesarias, en lugar de publicar
          una tabla inventada. */}
      <section className="flex flex-col gap-4">
        <h2 className="subtitle">{consent.table.caption}</h2>
        <Card className="p-5">
          <p className="texto-cuerpo text-sm">{consent.table.empty}</p>
        </Card>
      </section>
    </ArmazonLegal>
  )
}
