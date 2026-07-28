/**
 * Wordmark de ISN Labs, blanco sobre fondo oscuro (mockups image2.png e
 * image3.png).
 *
 * Es texto y no una imagen: escala sin perder nitidez, no anade una peticion al
 * LCP y se puede seleccionar y buscar. El brief pide respetar el area de
 * reserva y no deformar ni recolorear; cuando Marketing entregue el SVG
 * oficial, se sustituye aqui y en ningun sitio mas.
 */
interface PropsLogotipo {
  /** Tamano en rem del texto. La barra escala con el. */
  className?: string
}

export function Logotipo({ className = '' }: PropsLogotipo) {
  return (
    <span
      className={`font-display text-text inline-flex items-baseline font-bold ${className}`}
      // El signo entre ISN y Labs es decorativo: sin esto, un lector de
      // pantalla leeria "ISN guion bajo Labs".
      aria-label="ISN Labs"
    >
      <span aria-hidden="true" className="tracking-[0.18em]">
        ISN
      </span>
      <span aria-hidden="true" className="bg-text mx-1 h-px w-3 self-center" />
      <span aria-hidden="true">Labs</span>
    </span>
  )
}
