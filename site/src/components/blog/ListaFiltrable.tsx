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
  categorias: { id: Categoria; etiqueta: string }[]
  etiquetaTodos: string
  etiquetaFiltro: string
  children: ReactNode
}

export function ListaFiltrable({
  categorias,
  etiquetaTodos,
  etiquetaFiltro,
  children,
}: PropsListaFiltrable) {
  const [activa, setActiva] = useState<string>(TODOS)

  const opciones = [{ id: TODOS, etiqueta: etiquetaTodos }, ...categorias]

  return (
    <div data-filtro={activa} className="flex flex-col gap-8">
      {/* Botones y no enlaces: no cambian de pagina. Con aria-pressed, un lector
          de pantalla anuncia cual esta activo, que es justo lo que el color
          comunica visualmente. */}
      <div role="group" aria-label={etiquetaFiltro} className="flex flex-wrap gap-2.5">
        {opciones.map(({ id, etiqueta }) => {
          const seleccionada = activa === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={seleccionada}
              onClick={() => setActiva(id)}
              // 44px de alto minimo: es el objetivo tactil de la seccion 1.6.
              className={[
                'font-display min-h-11 rounded-full border px-4 text-xs font-bold tracking-wide uppercase transition-colors',
                'focus-visible:outline-cyan focus-visible:outline-2 focus-visible:outline-offset-2',
                seleccionada
                  ? 'border-cyan/60 bg-cyan/10 text-cyan'
                  : 'border-border text-text-dim hover:border-cyan/40 hover:text-text',
              ].join(' ')}
            >
              {etiqueta}
            </button>
          )
        })}
      </div>

      {children}
    </div>
  )
}
