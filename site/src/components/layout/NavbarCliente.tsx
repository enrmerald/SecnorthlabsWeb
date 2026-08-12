'use client'

import { ChevronDown, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LogoMarca } from '@/components/ui/LogoMarca'
import { LOGO_ISNLABS } from '@/config/logos'
import type { DatosNavegacion } from '@/lib/navegacion'

/**
 * Parte interactiva de la navegacion. Es el unico componente de la cabecera que
 * lleva `'use client'`, y solo por tres motivos reales: el menu movil, el
 * desplegable de Soluciones y el subrayado de la pagina activa.
 *
 * Reglas de accesibilidad que se cumplen aqui (Fase 9):
 *
 * - El desplegable se abre **con teclado y con pulsacion**, no solo con `hover`.
 *   En tactil el `hover` no existe, asi que un menu que solo responde al raton
 *   es inservible en movil y en teclado.
 * - `Escape` cierra el menu movil y el desplegable.
 * - Al cerrar, **el foco vuelve al elemento que lo abrio**.
 * - Al abrir el menu movil, el foco entra en el panel.
 */
interface PropsNavbarCliente {
  navegacion: DatosNavegacion
  /** `ruta en el idioma actual -> misma pagina en el otro idioma`. `undefined`
   * con un solo idioma activo: no hay selector que mostrar. */
  equivalencias?: Record<string, string>
  inicioOtroIdioma?: string
}

export function NavbarCliente({
  navegacion,
  equivalencias,
  inicioOtroIdioma,
}: PropsNavbarCliente) {
  const { a11y } = navegacion
  const pathname = usePathname()

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [desplegableAbierto, setDesplegableAbierto] = useState(false)

  const idDesplegable = useId()
  const idPanel = useId()
  const botonMenu = useRef<HTMLButtonElement>(null)
  const botonDesplegable = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  // El pathname que da Next incluye la barra final porque trailingSlash: true.
  // Si algun dia no la trae, la equivalencia fallaria en silencio y el selector
  // llevaria siempre a la portada, asi que se normaliza.
  const rutaActual = pathname.endsWith('/') ? pathname : `${pathname}/`
  const enlaceIdioma = equivalencias?.[rutaActual] ?? inicioOtroIdioma

  const esActiva = useCallback(
    (href: string) => {
      const base = href.split('#')[0] ?? href
      return rutaActual === base
    },
    [rutaActual],
  )

  const cerrarTodo = useCallback(() => {
    setMenuAbierto(false)
    setDesplegableAbierto(false)
  }, [])

  // Al navegar, el menu debe cerrarse solo: si no, el panel se queda abierto
  // sobre la pagina nueva.
  //
  // Se ajusta durante el render y no en un efecto. Un efecto que llama a
  // setState provoca un render en cascada -React lo senala- y ademas deja
  // pintar un fotograma con el menu todavia abierto. Esta es la forma que
  // documenta React para reaccionar a un cambio de entrada. Cubre tambien la
  // navegacion con los botones de atras y adelante del navegador.
  const [rutaRenderizada, setRutaRenderizada] = useState(pathname)
  if (pathname !== rutaRenderizada) {
    setRutaRenderizada(pathname)
    setMenuAbierto(false)
    setDesplegableAbierto(false)
  }

  // Escape cierra, y devuelve el foco a quien abrio.
  useEffect(() => {
    if (!menuAbierto && !desplegableAbierto) return

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      if (desplegableAbierto) {
        setDesplegableAbierto(false)
        botonDesplegable.current?.focus()
      }
      if (menuAbierto) {
        setMenuAbierto(false)
        botonMenu.current?.focus()
      }
    }

    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [menuAbierto, desplegableAbierto])

  // Al abrir el menu movil el foco entra en el panel; si no, quien navega por
  // teclado sigue en la cabecera y no llega a los enlaces que acaba de abrir.
  //
  // Y mientras esta abierto, el foco no debe salirse por detras del overlay:
  // tabular desde el ultimo enlace del panel llevaria al pie de la pagina que
  // hay debajo, que visualmente no existe.
  useEffect(() => {
    if (!menuAbierto) return
    const contenedor = panel.current
    if (!contenedor) return

    contenedor.focus()

    const alTabular = (evento: KeyboardEvent) => {
      if (evento.key !== 'Tab') return
      const enfocables = contenedor.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      if (!primero || !ultimo) return

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    contenedor.addEventListener('keydown', alTabular)
    return () => contenedor.removeEventListener('keydown', alTabular)
  }, [menuAbierto])

  // La pagina de detras no debe desplazarse mientras el panel esta abierto.
  // Se guarda y restaura el valor previo en lugar de forzar 'auto', para no
  // pisar cualquier otro bloqueo que pudiera existir.
  useEffect(() => {
    if (!menuAbierto) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [menuAbierto])

  // Un desplegable abierto debe cerrarse al pulsar fuera.
  useEffect(() => {
    if (!desplegableAbierto) return
    const alPulsarFuera = (evento: MouseEvent) => {
      if (!(evento.target instanceof Node)) return
      if (botonDesplegable.current?.parentElement?.contains(evento.target)) return
      setDesplegableAbierto(false)
    }
    document.addEventListener('pointerdown', alPulsarFuera)
    return () => document.removeEventListener('pointerdown', alPulsarFuera)
  }, [desplegableAbierto])

  /**
   * El estado NO seleccionado usa `text-text`, no el gris secundario.
   *
   * Con `text-text-dim` (#8C969E) los seis enlaces de la barra quedaban
   * apagados: se leia como una navegacion deshabilitada y solo destacaba el
   * activo. El contraste de un elemento de navegacion tiene que ser suficiente
   * por si mismo, y la diferencia con el activo se marca con color y con la
   * barra inferior, no atenuando todo lo demas.
   *
   * La pagina activa lleva una barra con `after` en lugar de `underline`: el
   * subrayado de texto sigue las curvas de las letras y con Space Mono queda
   * irregular; una barra de dos pixeles se lee como un indicador.
   */
  const claseEnlace = (activa: boolean) =>
    [
      'font-display relative text-sm transition-colors',
      "after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:content-['']",
      'after:transition-transform after:duration-200 after:origin-left',
      activa
        ? 'text-cyan after:bg-cyan after:scale-x-100'
        : 'text-text hover:text-cyan after:bg-cyan after:scale-x-0 hover:after:scale-x-100',
    ].join(' ')

  return (
    <header className="border-border bg-bg/85 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="site-container flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        {/* El logotipo esta en la primera pantalla, asi que va con width/height
            y sin `loading="lazy"`: es de los pocos activos que conviene que
            cargue cuanto antes, y reservar su hueco evita que la cabecera salte. */}
        <Link href={navegacion.inicio} className="shrink-0 py-2" aria-label={LOGO_ISNLABS.alt}>
          <LogoMarca logo={LOGO_ISNLABS} alto={26} ancho={170} prioritario />
        </Link>

        {/* ── Escritorio ── */}
        <nav aria-label={a11y.mainNav} className="hidden items-center gap-7 lg:flex">
          <div className="relative">
            <button
              ref={botonDesplegable}
              type="button"
              aria-expanded={desplegableAbierto}
              aria-controls={idDesplegable}
              onClick={() => setDesplegableAbierto((abierto) => !abierto)}
              className={`${claseEnlace(false)} flex items-center gap-1.5 ${desplegableAbierto ? 'text-cyan' : ''}`}
            >
              {navegacion.soluciones.label}
              <ChevronDown
                aria-hidden="true"
                className={`size-4 transition-transform ${desplegableAbierto ? 'rotate-180' : ''}`}
              />
            </button>

            {desplegableAbierto && (
              /* Desplegable: superficie elevada de verdad -borde, sombra y un
                 fondo mas claro que la barra-, entrada corta y una barra de
                 acento que aparece en el elemento apuntado. Cada entrada es un
                 objetivo de 44px, no una linea de texto de dieciseis. */
              <ul
                id={idDesplegable}
                className="border-border bg-card animar-desplegable absolute top-full left-0 mt-3 min-w-64 overflow-hidden rounded-xl border p-1.5 shadow-2xl shadow-black/50"
              >
                {navegacion.soluciones.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-display text-text hover:bg-panel hover:text-cyan group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors"
                    >
                      <span
                        aria-hidden="true"
                        className="bg-cyan h-4 w-0.5 origin-center scale-y-0 rounded-full transition-transform duration-150 group-hover:scale-y-100"
                      />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {navegacion.enlaces.map((enlace) => (
            <Link
              key={enlace.routeId}
              href={enlace.href}
              aria-current={esActiva(enlace.href) ? 'page' : undefined}
              className={claseEnlace(esActiva(enlace.href))}
            >
              {enlace.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {navegacion.otroIdioma && enlaceIdioma && (
            <Link
              href={enlaceIdioma}
              hrefLang={navegacion.otroIdioma.locale}
              aria-label={a11y.languageSwitch}
              // Fondo propio y texto a plena intensidad: antes era gris sobre
              // transparente y no se leia como un control pulsable.
              className="font-display border-border bg-panel text-text hover:border-cyan hover:text-cyan hover:bg-card inline-flex size-11 items-center justify-center rounded-md border text-xs font-bold transition-colors"
            >
              {navegacion.otroIdioma.label}
            </Link>
          )}

          {/* El CTA se oculta desde un contenedor y no con `hidden` sobre el
              propio boton: `Button` ya trae `inline-flex` en sus clases base y
              las dos utilidades de `display` compiten, con el resultado de que
              el boton se pintaba tambien a 320px y desbordaba la pagina. */}
          <div className="hidden xl:block">
            <Button href={navegacion.cta.href} variante="primario">
              {navegacion.cta.label}
            </Button>
          </div>

          <button
            ref={botonMenu}
            type="button"
            aria-expanded={menuAbierto}
            aria-controls={idPanel}
            aria-label={menuAbierto ? a11y.closeMenu : a11y.openMenu}
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="border-border text-text hover:border-cyan inline-flex size-11 items-center justify-center rounded-md border transition-colors lg:hidden"
          >
            {menuAbierto ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Movil: panel lateral con overlay, por debajo de 1024px ── */}
      {menuAbierto && (
        <div className="fixed inset-0 top-16 z-40 lg:hidden">
          {/* Fondo pulsable. Fuera del orden de tabulacion y oculto al lector
              de pantalla a proposito: para cerrar por teclado estan Escape y el
              boton de la cabecera, y un boton a pantalla completa anunciado
              como tal solo seria ruido. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={cerrarTodo}
            className="absolute inset-0 bg-black/60"
          />

          <div
            id={idPanel}
            ref={panel}
            tabIndex={-1}
            className="border-border bg-bg absolute inset-x-0 top-0 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b outline-none"
            // Respeta el notch y la barra inferior de los dispositivos que la
            // tienen.
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <nav aria-label={a11y.mainNav} className="site-container flex flex-col gap-1 py-4">
              <p className="kicker text-cyan px-2 pt-3 pb-1">
                {navegacion.soluciones.label}
              </p>
              {navegacion.soluciones.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-text hover:bg-panel hover:text-cyan flex min-h-11 items-center rounded-md px-2 text-sm transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <hr className="border-border my-3" />

              {navegacion.enlaces.map((enlace) => (
                <Link
                  key={enlace.routeId}
                  href={enlace.href}
                  aria-current={esActiva(enlace.href) ? 'page' : undefined}
                  className={`flex min-h-11 items-center rounded-md px-1 ${claseEnlace(esActiva(enlace.href))}`}
                >
                  {enlace.label}
                </Link>
              ))}

              <Button href={navegacion.cta.href} variante="primario" ancho className="mt-4">
                {navegacion.cta.label}
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
