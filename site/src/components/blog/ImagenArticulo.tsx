import manifiesto from '../../generated/images.json'

/**
 * Imagen de cabecera de un articulo, servida desde el pipeline de `images:build`.
 *
 * Se usa `<picture>` con `<img>` y no `next/image` por lo mismo que en
 * `LogoMarca`: con `images.unoptimized: true` -obligatorio en la exportacion
 * estatica- `next/image` no optimiza nada y si anade JavaScript de cliente. Aqui
 * las variantes AVIF y WebP ya estan generadas en build.
 *
 * `width` y `height` salen del manifiesto, con las dimensiones reales del
 * original: sin ellos el navegador no reserva el hueco y el articulo entero salta
 * cuando la imagen carga, que es CLS y cuenta para Core Web Vitals.
 */

type EntradaManifiesto = {
  width: number
  height: number
  aspectRatio: number
  avif: { width: number; src: string }[]
  webp: { width: number; src: string }[]
}

const IMAGENES = manifiesto as unknown as Record<string, EntradaManifiesto | undefined>

interface PropsImagenArticulo {
  /** Nombre en `assets/images/`, sin extension. El `image` del front matter. */
  nombre: string
  /** Vacio marca la imagen como decorativa, que es lo habitual en cabeceras. */
  alt: string
  /**
   * Anchura maxima que la imagen ocupa en pantalla, en `sizes` de CSS. El
   * navegador elige la variante con eso, no con la anchura del fichero.
   */
  sizes?: string
  /**
   * Carga inmediata. Solo para la imagen del articulo destacado y para la
   * cabecera del detalle, que son LCP; el resto va diferido.
   */
  prioritaria?: boolean
  className?: string
}

export function ImagenArticulo({
  nombre,
  alt,
  sizes = '100vw',
  prioritaria = false,
  className = '',
}: PropsImagenArticulo) {
  const entrada = IMAGENES[nombre]

  // Un articulo sin imagen procesada no rompe la pagina: el titular y la
  // entradilla siguen ahi. `content:build` ya falla si el front matter apunta a
  // una imagen que no existe, asi que llegar aqui significa que el articulo no
  // declaraba ninguna.
  if (!entrada) return null

  const conjunto = (variantes: { width: number; src: string }[]) =>
    variantes.map(({ width, src }) => `${src} ${width}w`).join(', ')

  return (
    // `block h-full` no es decorativo: <picture> es inline por defecto, y con
    // eso el <img> no llena un contenedor cuya altura la marca la columna de
    // texto de al lado -que es justo el caso del articulo destacado-.
    <picture className={`block h-full w-full ${className}`.trim()}>
      <source type="image/avif" srcSet={conjunto(entrada.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={conjunto(entrada.webp)} sizes={sizes} />
      <img
        src={entrada.webp.at(-1)?.src}
        alt={alt}
        width={entrada.width}
        height={entrada.height}
        loading={prioritaria ? 'eager' : 'lazy'}
        fetchPriority={prioritaria ? 'high' : 'auto'}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  )
}
