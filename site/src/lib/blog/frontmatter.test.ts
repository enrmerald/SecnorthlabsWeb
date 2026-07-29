import { describe, expect, it } from 'vitest'
import { ErrorDeFrontMatter, separarFrontMatter } from './frontmatter'

const F = 'content/blog/es/ejemplo.md'

const cabecera = (cuerpo: string) => `---\n${cuerpo}\n---\nTexto del articulo.\n`

describe('separarFrontMatter · lo que acepta', () => {
  it('lee cadenas, escalares y listas', () => {
    const { datos } = separarFrontMatter(
      cabecera('title: "ENS vs ISO 27001: diferencias"\ncategory: cumplimiento\ntags: [ens, iso-27001]'),
      F,
    )

    expect(datos.title).toBe('ENS vs ISO 27001: diferencias')
    expect(datos.category).toBe('cumplimiento')
    expect(datos.tags).toEqual(['ens', 'iso-27001'])
  })

  it('resuelve los escapes de comilla y de barra', () => {
    const { datos } = separarFrontMatter(cabecera('title: "El informe \\"Top 10\\" de 2024"'), F)
    expect(datos.title).toBe('El informe "Top 10" de 2024')
  })

  it('admite lista vacia, comentarios y lineas en blanco', () => {
    const { datos } = separarFrontMatter(cabecera('# un comentario\n\ntags: []\nauthor: ISN Labs'), F)
    expect(datos.tags).toEqual([])
    expect(datos.author).toBe('ISN Labs')
  })

  it('devuelve el cuerpo sin la cabecera y tolera CRLF y BOM', () => {
    const { cuerpo } = separarFrontMatter('﻿---\r\ntitle: "Hola"\r\n---\r\n\r\nCuerpo.\r\n', F)
    expect(cuerpo).toBe('Cuerpo.')
  })

  it('no confunde un --- del cuerpo con el cierre de la cabecera', () => {
    const { datos, cuerpo } = separarFrontMatter(
      '---\ntitle: "Hola"\n---\n\nUno\n\n---\n\nDos\n',
      F,
    )
    expect(datos.title).toBe('Hola')
    expect(cuerpo).toContain('---')
    expect(cuerpo.startsWith('Uno')).toBe(true)
  })
})

describe('separarFrontMatter · lo que rechaza', () => {
  const falla = (fuente: string, patron: RegExp) => {
    expect(() => separarFrontMatter(fuente, F)).toThrow(ErrorDeFrontMatter)
    expect(() => separarFrontMatter(fuente, F)).toThrow(patron)
  }

  it('un fichero sin cabecera', () => {
    falla('# Solo Markdown\n', /debe empezar/)
  })

  it('una cabecera sin cerrar', () => {
    falla('---\ntitle: "Hola"\n', /cierre/)
  })

  it('una linea sin dos puntos', () => {
    falla(cabecera('title'), /clave: valor/)
  })

  it('una cadena sin comilla de cierre', () => {
    falla(cabecera('title: "Hola'), /comilla de cierre/)
  })

  it('una lista repartida en varias lineas, que es lo que traia el blog anterior', () => {
    falla(cabecera('tags: [\n  ens,\n  nis2\n]'), /misma linea/)
  })

  it('un valor sangrado en la linea siguiente', () => {
    falla(cabecera('title: "Hola"\n  continuacion'), /sin sangrado/)
  })

  it('una clave repetida, en lugar de quedarse con la ultima en silencio', () => {
    falla(cabecera('title: "Uno"\ntitle: "Dos"'), /repetida/)
  })

  it('una clave con caracteres raros', () => {
    falla(cabecera('title_seo: "Hola"'), /clave no valida/)
  })

  it('un valor sin comillas con almohadilla, que YAML tratarí­a como comentario', () => {
    falla(cabecera('title: NIS2 # y ENS'), /comillas/)
  })

  it('cita el fichero y la linea en el mensaje', () => {
    expect(() => separarFrontMatter(cabecera('title: "Uno"\nmal'), F)).toThrow(
      /content\/blog\/es\/ejemplo\.md:3/,
    )
  })
})
