import type { Logotipo } from '@/config/logos'

/**
 * Logotipo de un tercero, con o sin cápsula clara.
 *
 * Se usa `<img>` y no `next/image` a propósito: con `images.unoptimized: true`
 * —obligatorio en la exportación estática— `next/image` no aporta nada sobre un
 * `<img>` y sí añade JavaScript de cliente. Los ficheros ya vienen optimizados
 * del pipeline.
 *
 * `width` y `height` van **siempre** puestos, calculados del ratio real del
 * original: sin ellos el navegador no reserva el hueco y la tarjeta salta cuando
 * el logo carga, que es CLS y cuenta para Core Web Vitals.
 */
interface PropsLogoMarca {
  logo: Logotipo
  /** Alto máximo en píxeles. */
  alto?: number
  /**
   * Ancho máximo. Junto con `alto` forma la **caja óptica** en la que cada logo
   * se inscribe.
   *
   * Acotar solo por alto no funciona con estas marcas: sus proporciones van de
   * 2,2 (Microsoft, icono más texto corto) a 8,9 (Fortinet, un wordmark muy
   * alargado). A 26 px de alto, Fortinet mide 230 px de ancho y llena la placa
   * entera mientras Microsoft se queda en 58 px y parece un error. Con caja, el
   * alargado lo limita el ancho y el compacto lo limita el alto, que es como se
   * componen los muros de logotipos.
   */
  ancho?: number
  /**
   * Fondo claro detrás del logo. Es lo que permite usar la versión positiva de
   * cada marca sobre un sitio oscuro sin recolorear nada (ver `config/logos.ts`).
   */
  capsula?: boolean
  /**
   * Carga inmediata en lugar de diferida.
   *
   * Se usa **solo** en el logotipo de la cabecera, que esta en la primera
   * pantalla: un `loading="lazy"` ahi retrasa lo primero que se ve. En el resto
   * de logos lo diferido es lo correcto, porque estan bajo el pliegue.
   */
  prioritario?: boolean
  className?: string
}

export function LogoMarca({
  logo,
  alto = 24,
  ancho = 132,
  capsula = false,
  prioritario = false,
  className = '',
}: PropsLogoMarca) {
  // El ajuste por marca (`escala`) es el ultimo recurso, para lo que la caja no
  // resuelve: un logotipo con icono y texto corto se percibe mas pequeno que un
  // wordmark que llena su caja, aunque midan lo mismo.
  const escala = logo.escala ?? 1
  const altoFinal = Math.round(alto * escala)
  const anchoFinal = Math.round(ancho * escala)

  // Dimensiones intrinsecas para reservar el hueco: se toma el lado que de
  // verdad va a limitar, para que el atributo coincida con lo pintado.
  const limitadoPorAncho = logo.ratio > anchoFinal / altoFinal
  const anchoAtributo = limitadoPorAncho ? anchoFinal : Math.round(altoFinal * logo.ratio)
  const altoAtributo = limitadoPorAncho ? Math.round(anchoFinal / logo.ratio) : altoFinal

  /* La regla @next/next/no-img-element es correcta en general y equivocada aqui.
     Con `images.unoptimized: true`, obligatorio en la exportacion estatica,
     `next/image` no optimiza nada: solo anade JavaScript de cliente y un wrapper.
     Los ficheros ya vienen optimizados y llevan width/height, que es el CLS que
     la regla quiere evitar. Se desactiva en este fichero y solo en este, para que
     siga protegiendo el resto del sitio. */
  const imagen = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      {...(logo.src2x ? { srcSet: `${logo.src} 1x, ${logo.src2x} 2x` } : {})}
      alt={logo.alt}
      width={anchoAtributo}
      height={altoAtributo}
      loading={prioritario ? 'eager' : 'lazy'}
      fetchPriority={prioritario ? 'high' : undefined}
      decoding="async"
      style={{ maxHeight: `${altoFinal}px`, maxWidth: `${anchoFinal}px` }}
      className="h-auto w-auto object-contain"
    />
  )

  if (!capsula) return <div className={className}>{imagen}</div>

  return (
    <div
      className={[
        // Blanco roto en lugar de blanco puro: sobre un fondo casi negro, el
        // blanco puro deslumbra y tira de la vista antes que el titular.
        'flex items-center justify-center rounded-lg bg-[#f4f6f8] px-4 py-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      // El alto es fijo para que las cuatro placas de la rejilla queden
      // alineadas aunque los logos tengan proporciones muy distintas.
      style={{ minHeight: `${alto + 26}px` }}
    >
      {imagen}
    </div>
  )
}
