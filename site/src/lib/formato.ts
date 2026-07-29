import type { Locale } from '@/config/routes'

/**
 * Formateo de importes para pantalla.
 *
 * El motor devuelve **céntimos enteros** y aquí se pasan a euros. Se formatea
 * con `Intl` y no a mano porque el separador decimal cambia con el idioma: en
 * español «335,83» y en inglés «335.83». Escribirlo con un `replace` produce
 * cifras que en inglés se leen como millares.
 */
const formateador = (locale: Locale, decimales: number) =>
  new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })

/**
 * Céntimos a euros.
 *
 * Sin decimales cuando el importe es redondo, que es lo habitual porque el PVP
 * se redondea a múltiplos de 5 €. «840 €» se lee mejor que «840,00 €».
 */
export function euros(centimos: number, locale: Locale): string {
  const esRedondo = centimos % 100 === 0
  return formateador(locale, esRedondo ? 0 : 2).format(centimos / 100)
}

/** Horquilla, con un guion largo y espacios finos alrededor. */
export function horquilla(rango: readonly [number, number], locale: Locale): string {
  return `${euros(rango[0], locale)} – ${euros(rango[1], locale)}`
}
