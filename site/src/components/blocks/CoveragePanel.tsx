import { Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/**
 * Panel «Cobertura bajo un mismo techo» del hero de la Home (mockup
 * image3.png): cabecera `> servicio gestionado` con indicador `● operativo`,
 * titulo, cinco filas de etiqueta + linea de puntos + valor, y pie.
 *
 * **Los datos del panel son ilustrativos**; el brief lo dice expresamente y
 * prohibe exponer datos reales de clientes. Salen del fichero de mensajes, no
 * de ninguna fuente en vivo.
 *
 * En movil el panel baja debajo del texto: lo coloca la Home, no este bloque.
 */
interface PropsCoveragePanel {
  header: string
  status: string
  title: string
  rows: readonly { label: string; value: string }[]
  footer: string
}

export function CoveragePanel({ header, status, title, rows, footer }: PropsCoveragePanel) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="border-border flex items-center justify-between gap-4 border-b pb-4">
        <p className="font-display text-cyan text-xs">
          <span aria-hidden="true">&gt; </span>
          {header}
        </p>
        <p className="font-display text-green flex items-center gap-2 text-xs">
          <span aria-hidden="true" className="bg-green size-1.5 rounded-full" />
          {status}
        </p>
      </div>

      <h2 className="subtitle mt-5 mb-4">{title}</h2>

      <ul className="flex flex-col gap-3.5">
        {rows.map((fila) => (
          <li key={fila.label} className="flex items-baseline gap-3 text-sm">
            <Check aria-hidden="true" className="text-green size-4 shrink-0" strokeWidth={2.5} />
            <span className="shrink-0">{fila.label}</span>
            {/* La linea es un borde y no una fila de puntos escritos: un lector
                de pantalla no debe leer cincuenta caracteres de relleno. */}
            <span aria-hidden="true" className="linea-guia" />
            <span className="font-display text-cyan shrink-0 text-xs font-bold">{fila.value}</span>
          </li>
        ))}
      </ul>

      <p className="border-border text-text-dim mt-6 border-t pt-4 text-xs">{footer}</p>
    </Card>
  )
}
