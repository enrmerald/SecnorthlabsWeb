/**
 * Wordmark de ISN Labs escrito con tipografia, blanco sobre fondo oscuro.
 *
 * **Es el respaldo, no el logotipo principal.** El oficial es la imagen de
 * `LOGO_ISNLABS`, que es lo que pintan la navegacion y el pie.
 *
 * Este sigue existiendo porque hay dos sitios donde una imagen no sirve:
 *
 * - Las **plantillas de correo**: las fuentes web no cargan y muchos clientes
 *   bloquean las imagenes por defecto, asi que hace falta una version que se
 *   lea de todos modos.
 * - La **404 de ultimo recurso**, que se sirve sin depender de ningun activo.
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
      {/* El signo entre ISN y Labs es un subrayado corto a la altura de la
          linea base, como en el mockup, no un guion centrado. */}
      <span aria-hidden="true" className="bg-text mr-1 h-[0.09em] w-[0.42em] self-baseline" />
      <span aria-hidden="true">Labs</span>
    </span>
  )
}
