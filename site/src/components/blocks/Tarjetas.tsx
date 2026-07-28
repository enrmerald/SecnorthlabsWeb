import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'

/**
 * Tarjetas simples que comparten forma entre paginas. Estan juntas porque
 * separarlas en cinco ficheros de veinte lineas no aporta nada: ninguna tiene
 * logica, todas reciben su contenido por props y ninguna lee del JSON.
 */

/**
 * Licencia de tecnologia (mockup image6.png): Microsoft, Huntress, OPNsense y
 * Fortinet, todas «+ gestion ISN Labs».
 *
 * > **Se usa solo el nombre en texto, no el logotipo.** El brief exige usar los
 * > logos «segun sus normas de marca (no recolorear)», y esos ficheros no han
 * > llegado (pendiente P6). Descargarlos de Internet no es una opcion.
 */
export function LicenseCard({
  name,
  subtitle,
  description,
  footer,
}: {
  name: string
  subtitle: string
  description: string
  footer: string
}) {
  return (
    <Card as="li" className="flex flex-col gap-2 p-6">
      <h3 className="font-display text-base font-bold">{name}</h3>
      <p className="font-display text-cyan text-xs">{subtitle}</p>
      <p className="texto-cuerpo mt-1 text-sm">{description}</p>
      <p className="border-border text-text-dim mt-auto border-t pt-4 text-xs">{footer}</p>
    </Card>
  )
}

/**
 * Sector (mockup image7.png): titulo, descripcion y etiqueta con el driver
 * regulatorio.
 *
 * **Se renderiza sin enlace.** Cada sector sera una landing propia en fase 2
 * (pendiente P10), y hasta entonces la regla general del plan es que o el
 * destino es real, o el elemento no se enlaza: mandar todas las tarjetas a
 * `/contacto` es una experiencia enganosa.
 */
export function SectorCard({
  title,
  description,
  tag,
}: {
  title: string
  description: string
  tag: string
}) {
  return (
    <Card as="li" className="flex flex-col gap-3 p-6">
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="texto-cuerpo text-sm">{description}</p>
      <div className="mt-auto pt-2">
        <Tag acento="cian">{tag}</Tag>
      </div>
    </Card>
  )
}

/**
 * Rol del equipo (mockup image9.png).
 *
 * Se muestran **roles, no nombres**, como pide el brief. El brief pide ademas
 * fotos reales en fase 2 (pendiente P9); hasta entonces, la inicial del rol
 * como marcador, marcada como decorativa para que no la lea un lector de
 * pantalla.
 */
export function TeamRoleCard({ title, description }: { title: string; description: string }) {
  return (
    <Card as="li" className="flex items-start gap-4 p-5">
      <span
        aria-hidden="true"
        className="border-border font-display text-cyan flex size-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
      >
        {title.charAt(0)}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-sm font-bold">{title}</h3>
        <p className="texto-cuerpo text-sm">{description}</p>
      </div>
    </Card>
  )
}

/** Fila de diferenciadores de la pagina Compania (mockup image9.png). */
export function StatCard({ title, description }: { title: string; description: string }) {
  return (
    <Card as="li" acento="top" acentoColor="cian" className="flex flex-col gap-2 p-5">
      <h2 className="font-display text-cyan text-sm font-bold">{title}</h2>
      <p className="texto-cuerpo text-sm">{description}</p>
    </Card>
  )
}

/**
 * Lista de pasos numerados. Se usa en «Como funciona» de Software (cuatro
 * pasos) y en «Que pasa despues» del rail de Contacto (tres pasos).
 *
 * El numero es decorativo: la lista ya es un `<ol>` y un lector de pantalla
 * anuncia la posicion por si mismo.
 */
export function StepList({
  steps,
  color = 'verde',
}: {
  steps: readonly { title: string; description: string }[]
  color?: 'cian' | 'verde'
}) {
  const borde = color === 'verde' ? 'border-green text-green' : 'border-cyan text-cyan'

  return (
    <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((paso, indice) => (
        <li key={`${indice}-${paso.title}`} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`font-display flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${borde}`}
          >
            {indice + 1}
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-sm font-bold">{paso.title}</h3>
            <p className="texto-cuerpo text-sm">{paso.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
