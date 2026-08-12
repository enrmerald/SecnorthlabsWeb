import { ROUTES, getLocalizedPath, type Locale } from '@/config/routes'
import { construirNavegacion } from '@/lib/navegacion'
import { NavbarCliente } from './NavbarCliente'

/**
 * Navegacion principal (seccion 3.1).
 *
 * Este componente es de **build**: resuelve las rutas y lee los mensajes aqui, y
 * al navegador solo le llegan cadenas y `href` ya calculados. El estado del menu
 * movil y del desplegable vive en `NavbarCliente`, que es lo unico que necesita
 * JavaScript.
 *
 * El selector de idioma tiene que llevar a **la misma pagina** en el otro
 * idioma, no a la portada. Como el manifiesto es la unica fuente de rutas y no
 * tiene sentido enviarlo entero al navegador, se precalcula aqui la tabla
 * `ruta actual -> ruta equivalente`: son dieciseis pares de cadenas.
 */
export function Navbar({ locale }: { locale: Locale }) {
  const navegacion = construirNavegacion(locale)
  const otro = navegacion.otroIdioma?.locale

  const equivalencias = otro
    ? Object.fromEntries(
        ROUTES.filter((route) => route.enabled).map((route) => [
          route.paths[locale],
          route.paths[otro],
        ]),
      )
    : undefined

  return (
    <NavbarCliente
      navegacion={navegacion}
      equivalencias={equivalencias}
      inicioOtroIdioma={otro ? getLocalizedPath('home', otro) : undefined}
    />
  )
}
