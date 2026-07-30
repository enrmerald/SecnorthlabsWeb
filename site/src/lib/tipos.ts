/**
 * Tipos compartidos entre componentes visuales y las piezas de SEO, para que no
 * haya dos definiciones de la misma estructura.
 */

/**
 * Un tramo de las migas de pan.
 *
 * Es un array de objetos y no una frase con barras. La primera version del plan
 * proponia coger la cadena "Inicio / Soluciones / MSSP" y partirla por "/", y es
 * un error: no hay destinos, se rompe con cualquier texto que contenga una
 * barra y el ingles no tiene por que usar el mismo separador (seccion 2.4).
 *
 * El ultimo tramo lleva `href: null` porque es la pagina actual y no se enlaza.
 * La misma estructura alimenta el componente visual y el BreadcrumbList de
 * datos estructurados, sin duplicar informacion.
 */
export interface TramoBreadcrumb {
  label: string
  href: string | null
}
