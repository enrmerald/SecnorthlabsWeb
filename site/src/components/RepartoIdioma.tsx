'use client'

import { useEffect } from 'react'
import { getLocalizedPath } from '@/config/routes'
import { idiomaDelNavegador } from '@/lib/idioma-navegador'

/**
 * Lleva de `/` al idioma del navegador.
 *
 * `replace` y no `assign`: la raiz no debe quedarse en el historial, o el boton de
 * atras devuelve aqui y vuelve a redirigir, dejando al visitante atrapado.
 *
 * Se usa `navigator.languages` -la lista completa, en orden- y no `language`, que
 * es solo la primera. Alguien con «catalan, castellano, ingles» configurado debe
 * acabar en castellano, no en ingles.
 *
 * No renderiza nada: lo que se ve mientras esto ocurre son los enlaces de la
 * pagina, que siguen funcionando si el JavaScript no llega a ejecutarse.
 */
export function RepartoIdioma() {
  useEffect(() => {
    const idiomas = navigator.languages ?? [navigator.language]
    window.location.replace(getLocalizedPath('home', idiomaDelNavegador(idiomas)))
  }, [])

  return null
}
