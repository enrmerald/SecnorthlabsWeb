// Ruta relativa y no el alias `@/`: esto importa un VALOR, y el alias solo lo
// resuelve el bundler. Con `@/` el fichero compila pero los tests no lo pueden
// cargar, que es como se descubrio.
import { DEFAULT_LOCALE, type Locale } from '../config/routes'

/**
 * Reparto por idioma **en el navegador**, para la pagina de `/`.
 *
 * ⚠️ En produccion esto normalmente no se ejecuta: la redireccion la hacen las dos
 * reglas de `netlify.toml`, en el borde y sin JavaScript, antes de que el HTML de
 * `/` llegue a servirse. Esto cubre los otros dos casos:
 *
 *   1. **`next dev`**, donde no hay Netlify y `/` daba un 404.
 *   2. **Red de seguridad**: si algun dia la regla del borde se desactiva o su
 *      condicion deja de casar, `/` sigue llevando a alguna parte en lugar de
 *      quedarse en una pagina muerta.
 *
 * La lista de prefijos tiene que decir lo mismo que las variantes de
 * `netlify.toml`. No se puede importar de alli -esto se ejecuta en el navegador y
 * aquello lee un fichero-, asi que hay una prueba que compara las dos y falla si
 * divergen.
 */
export const PREFIJOS_ESPANOL = ['es', 'ca', 'gl', 'eu'] as const

/**
 * Decide el idioma a partir de la lista de preferencias del navegador.
 *
 * Se recorre en orden y gana el primero que se reconozca, que es lo que el
 * visitante ha pedido. Es una diferencia deliberada con la condicion `Language` de
 * Netlify, que solo mira si la cabecera **menciona** el idioma: aqui el orden esta
 * disponible y usarlo es mejor.
 */
export function idiomaDelNavegador(idiomas: readonly string[]): Locale {
  for (const etiqueta of idiomas) {
    const primario = etiqueta.trim().toLowerCase().split('-')[0]
    if (!primario) continue
    if ((PREFIJOS_ESPANOL as readonly string[]).includes(primario)) return 'es'
    if (primario === 'en') return 'en'
  }

  // Ni castellano ni ingles: el ingles es el destino menos presuntuoso para
  // quien llega con un tercer idioma.
  return idiomas.length > 0 ? 'en' : DEFAULT_LOCALE
}
