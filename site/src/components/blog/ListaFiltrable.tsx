'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Categoria } from '@/lib/blog/esquema'

/**
 * Filtro por tema del listado del blog.
 *
 * **Las tarjetas no se renderizan aqui.** Llegan como `children` ya compuestas
 * en build, cada una marcada con `data-categoria`, y este componente solo cambia
 * el atributo `data-filtro` del contenedor. El ocultado lo hace CSS
 * (`globals.css`, bloque «filtro del blog»).
 *
 * Por que asi y no filtrando el array en el cliente:
 *
 * - Las 26 tarjetas estan en el HTML exportado, con sus enlaces, asi que el
 *   rastreador las ve todas sin ejecutar JavaScript.
 * - Al navegador solo viaja el estado del filtro y las etiquetas de los botones,
 *   no los 26 articulos: es la separacion entre `Articulo` y `ArticuloIndice`
 *   llevada hasta el final.
 * - No hay lista que volver a montar al pulsar, asi que no hay salto de layout.
 *
 * El filtro es una comodidad, no la navegacion: si el JavaScript no carga, se
 * ven todos los articulos, que es exactamente lo que hace `/es/blog/` sin
 * filtrar.
 */

const TODOS = 'todos'

interface PropsListaFiltrable {
  categorias: { id: Categoria; etiqueta: string; cuenta: number }[]
  etiquetaTodos: string
  etiquetaFiltro: string
  /** Total de articulos de la rejilla, para el contador de «todos los temas». */
  total: number
  children: ReactNode
}

export function ListaFiltrable({
  categorias,
  etiquetaTodos,
  etiquetaFiltro,
  total,
  children,
}: PropsListaFiltrable) {
  const [activa, setActiva] = useState<string>(TODOS)

  const opciones = [{ id: TODOS, etiqueta: etiquetaTodos, cuenta: total }, ...categorias]

  return (
    <div data-filtro={activa} className="flex flex-col gap-8">
      {/* Botones y no enlaces: no cambian de pagina. Con aria-pressed, un lector
          de pantalla anuncia cual esta activo, que es justo lo que el color
          comunica visualmente. */}
      <div role="group" aria-label={etiquetaFiltro} className="flex flex-wrap gap-2.5">
        {opciones.map(({ id, etiqueta, cuenta }) => {
          const seleccionada = activa === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={seleccionada}
              onClick={() => setActiva(id)}
              // 44px de alto minimo: es el objetivo tactil de la seccion 1.6.
              className={[
                'font-display group inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs font-bold tracking-wide uppercase transition-colors',
                'focus-visible:outline-cyan focus-visible:outline-2 focus-visible:outline-offset-2',
                seleccionada
                  ? 'border-cyan/60 bg-cyan/10 text-cyan'
                  : 'border-border text-text-dim hover:border-cyan/40 hover:bg-panel hover:text-text',
              ].join(' ')}
            >
              {etiqueta}
              {/* El numero de articulos de cada tema. Se anuncia con el boton -no
                  va oculto- porque saber que un tema tiene un articulo y otro
                  doce cambia si merece la pena pulsarlo. */}
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[0.625rem] leading-none tabular-nums transition-colors',
                  seleccionada ? 'bg-cyan/20 text-cyan' : 'bg-border/60 text-text-dim',
                ].join(' ')}
              >
                {cuenta}
              </span>
            </button>
          )
        })}
      </div>

      {children}
    </div>
  )
}
