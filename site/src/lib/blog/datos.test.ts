import { describe, expect, it } from 'vitest'
import { CATEGORIAS, FrontMatterSchema } from './esquema'
import {
  articuloDestacado,
  categoriasConArticulos,
  existeArticulo,
  formatearFecha,
  listarArticulos,
  listarIndice,
  obtenerArticulo,
} from './datos'

/** Cabecera minima valida, para no repetirla en cada caso. */
const valido = {
  title: 'Qué es el ENS y por qué es obligatorio',
  titleSeo: 'ENS: qué es y por qué es obligatorio',
  description: 'Una explicación del Esquema Nacional de Seguridad y de a quién aplica.',
  descriptionSeo:
    'Descubre qué es el ENS, para qué sirve, a quién afecta y por qué es clave para trabajar con la Administración.',
  date: '2026-04-30T13:50:00.000Z',
  category: 'cumplimiento',
  author: 'ISN Labs',
}

describe('esquema del front matter', () => {
  it('acepta una cabecera minima y rellena los opcionales', () => {
    const resultado = FrontMatterSchema.parse(valido)
    expect(resultado.tags).toEqual([])
    expect(resultado.image).toBe('')
    expect(resultado.imageAlt).toBe('')
    expect(resultado.draft).toBe('false')
  })

  it('rechaza una categoria que no esta en la taxonomia', () => {
    expect(() => FrontMatterSchema.parse({ ...valido, category: 'info' })).toThrow()
  })

  it('rechaza claves desconocidas en lugar de perderlas en silencio', () => {
    expect(() => FrontMatterSchema.parse({ ...valido, titulo: 'typo' })).toThrow()
  })

  it('rechaza una fecha que no es ISO con zona', () => {
    expect(() => FrontMatterSchema.parse({ ...valido, date: '2026-04-30' })).toThrow()
  })

  it('rechaza tags que no son slugs', () => {
    expect(() => FrontMatterSchema.parse({ ...valido, tags: ['ISO 27001'] })).toThrow()
  })
})

describe('articulos compilados', () => {
  it('hay contenido en espanol y esta ordenado del mas reciente al mas antiguo', () => {
    const articulos = listarArticulos('es')
    expect(articulos.length).toBeGreaterThan(0)

    const fechas = articulos.map((articulo) => articulo.date)
    expect([...fechas].sort((a, b) => b.localeCompare(a))).toEqual(fechas)
  })

  it('cada articulo cumple el esquema y trae cuerpo ya convertido a HTML', () => {
    for (const articulo of listarArticulos('es')) {
      expect(CATEGORIAS).toContain(articulo.category)
      expect(articulo.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(articulo.html).toMatch(/<(p|h2|h3|ul|div)/)
      expect(articulo.readingMinutes).toBeGreaterThan(0)
    }
  })

  it('no quedan enlaces al blog anterior en el cuerpo', () => {
    for (const articulo of listarArticulos('es')) {
      expect(articulo.html).not.toContain('ewala.es/blog/posts/')
    }
  })

  it('los enlaces externos salen con rel de seguridad', () => {
    const conExternos = listarArticulos('es').filter((articulo) =>
      articulo.html.includes('target="_blank"'),
    )
    for (const articulo of conExternos) {
      const externos = articulo.html.match(/<a[^>]*target="_blank"[^>]*>/g) ?? []
      for (const enlace of externos) expect(enlace).toContain('rel="noopener noreferrer"')
    }
  })

  it('el indice no arrastra el cuerpo hacia el cliente', () => {
    for (const entrada of listarIndice('es')) {
      expect(Object.keys(entrada)).not.toContain('html')
    }
  })

  it('resuelve y descarta slugs', () => {
    const primero = listarArticulos('es')[0]
    if (!primero) throw new Error('no hay articulos compilados')

    expect(obtenerArticulo('es', primero.slug)?.title).toBe(primero.title)
    expect(obtenerArticulo('es', 'no-existe')).toBeUndefined()
    expect(existeArticulo('es', primero.slug)).toBe(true)
    expect(existeArticulo('es', 'no-existe')).toBe(false)
  })

  it('destaca el mas reciente', () => {
    expect(articuloDestacado('es')?.slug).toBe(listarArticulos('es')[0]?.slug)
  })

  it('solo ofrece categorias que tienen articulos', () => {
    const categorias = categoriasConArticulos('es')
    expect(categorias.length).toBeGreaterThan(0)
    for (const categoria of categorias) {
      expect(listarArticulos('es').some((articulo) => articulo.category === categoria)).toBe(true)
    }
  })
})

describe('formatearFecha', () => {
  it('formatea en el idioma de la pagina, en UTC', () => {
    expect(formatearFecha('2026-04-30T13:50:00.000Z', 'es')).toBe('30 de abril de 2026')
    expect(formatearFecha('2026-04-30T13:50:00.000Z', 'en')).toBe('30 April 2026')
  })

  it('no desplaza el dia por la zona horaria', () => {
    expect(formatearFecha('2026-01-01T00:30:00.000Z', 'es')).toContain('1 de enero')
  })
})
