import manifiesto from '../../generated/images.json'

/**
 * Resolucion de las variantes generadas por `images:build`.
 *
 * Existe para no escribir a mano rutas como `/img/<nombre>-1280.webp`: el
 * pipeline **no amplia** imagenes, asi que un original de 900 px no tiene
 * variante de 1280 y ese enlace seria un 404. La imagen social de un articulo
 * apuntaria a nada, y eso no se ve hasta que alguien comparte el enlace.
 */

type EntradaManifiesto = {
  width: number
  height: number
  webp: { width: number; src: string }[]
}

const IMAGENES = manifiesto as unknown as Record<string, EntradaManifiesto | undefined>

/** La variante WebP mas grande que exista, o `undefined` si no hay imagen. */
export function rutaImagenSocial(nombre: string): string | undefined {
  if (!nombre) return undefined
  const entrada = IMAGENES[nombre]
  if (!entrada) return undefined

  // WebP y no AVIF: la compatibilidad en previsualizaciones de enlaces -clientes
  // de correo, mensajeria, algunas redes- sigue siendo peor con AVIF.
  return entrada.webp.at(-1)?.src
}

/** Dimensiones reales del original, para declararlas en Open Graph. */
export function dimensionesImagen(nombre: string): { width: number; height: number } | undefined {
  const entrada = IMAGENES[nombre]
  if (!entrada) return undefined
  return { width: entrada.width, height: entrada.height }
}
