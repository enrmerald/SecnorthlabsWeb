import {
  Banknote,
  Factory,
  HeartPulse,
  Landmark,
  ShieldCheck,
  Truck,
  Wheat,
  Zap,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { Card } from '@/components/ui/Card'
import { LogoMarca } from '@/components/ui/LogoMarca'
import { Tag } from '@/components/ui/Tag'
import type { Logotipo } from '@/config/logos'

/**
 * Tarjetas simples que comparten forma entre paginas. Estan juntas porque
 * separarlas en cinco ficheros de veinte lineas no aporta nada: ninguna tiene
 * logica, todas reciben su contenido por props y ninguna lee del JSON.
 */

/**
 * Licencia de tecnologia (mockup image6.png): Microsoft, Huntress, OPNsense y
 * Fortinet, todas «+ gestion ISN Labs».
 *
 * El logotipo va dentro de una **capsula clara**, que es lo que permite usar la
 * version positiva de cada marca -la disenada para fondo claro- sobre un sitio
 * oscuro sin recolorear nada, cosa que el brief prohibe expresamente. El motivo
 * completo esta en `config/logos.ts`.
 *
 * Si una marca no tiene logo registrado, la tarjeta se pinta sin el en lugar de
 * romperse: el nombre en texto sigue estando en el titular.
 */
export function LicenseCard({
  name,
  subtitle,
  description,
  footer,
  logo,
}: {
  name: string
  subtitle: string
  description: string
  footer: string
  logo?: Logotipo
}) {
  return (
    <Card as="li" className="flex flex-col gap-2 p-6">
      {logo && <LogoMarca logo={logo} alto={26} capsula className="mb-4" />}
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
/**
 * Icono de cada sector.
 *
 * La clave viaja en `messages/*.json` junto al sector, no se deduce del orden:
 * reordenar la rejilla dejaria el rayo en sanidad sin que fallara nada. Son
 * iconos de `lucide-react` en un componente de build, asi que salen como SVG en
 * el HTML y no envian JavaScript.
 */
const ICONOS_SECTOR: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  industria: Factory,
  agro: Wheat,
  energia: Zap,
  sanidad: HeartPulse,
  suministro: Truck,
  administracion: Landmark,
  finanzas: Banknote,
}

export function SectorCard({
  title,
  description,
  tag,
  icon,
}: {
  title: string
  description: string
  tag: string
  icon?: string
}) {
  const Icono = (icon && ICONOS_SECTOR[icon]) || ShieldCheck

  return (
    <Card as="li" className="flex flex-col gap-3 p-6">
      <div className="flex items-center gap-3">
        {/* En capsula y no suelto: siete iconos sueltos sobre fondo oscuro se
            leen como ruido, y el circulo los ancla a la misma linea base que el
            titulo. Decorativo: el titulo de al lado ya dice el sector. */}
        <span
          aria-hidden="true"
          className="border-border bg-panel text-cyan flex size-10 shrink-0 items-center justify-center rounded-full border"
        >
          <Icono className="size-5" strokeWidth={1.75} />
        </span>
        <h3 className="font-display text-base font-bold">{title}</h3>
      </div>
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
        {/* En color y no en blanco: el rol es lo que se busca al recorrer la
            rejilla, y comparte el cian del kicker `/03 Equipo` de su seccion. */}
        <h3 className="font-display text-cyan text-sm font-bold">{title}</h3>
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
