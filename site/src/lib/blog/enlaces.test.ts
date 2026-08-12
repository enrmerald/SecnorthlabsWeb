import { describe, expect, it } from 'vitest'
import { LOCALES, ROUTES, isEnabled } from '../../config/routes'
import { revisarEnlacesInternos } from './enlaces'

/**
 * El fallo que motiva este fichero: al pasar el espanol a la raiz del dominio se
 * actualizo el prefijo del validador de enlaces pero no los 22 articulos, y como
 * la comprobacion era una regex montada sobre ese prefijo, dejo de casar con un
 * solo enlace. `content:build` siguio diciendo OK con 108 enlaces apuntando a
 * URLs que ya no existian. Los casos 2 y 3 son los que habrian roto el build
 * aquel dia.
 *
 * Los casos negativos van aqui y no en `scripts/content-build.test.mjs` porque
 * meter un `.md` roto en `content/` rompe el build de todos.
 */

const manifiesto = { rutas: ROUTES, locales: LOCALES }

/** Un solo articulo publicado en espanol, para no repetirlo en cada caso. */
const soloEnEspanol = {
  es: new Set(['que-es-el-ens']),
  en: new Set<string>(),
}

function revisar(html: string, locale: 'es' | 'en' = 'es', slugs = soloEnEspanol) {
  return revisarEnlacesInternos({
    html,
    locale,
    origen: 'content/blog/es/prueba.md',
    slugsPorIdioma: slugs,
    manifiesto,
  })
}

describe('enlaces internos de un articulo', () => {
  it('acepta los enlaces legitimos sin tocarlos', () => {
    const html = [
      '<a href="https://ejemplo.com/">externo</a>',
      '<a href="mailto:info@secnorthlabs.eu">correo</a>',
      '<a href="#seccion">ancla propia</a>',
      '<a href="/img/foto.webp">imagen</a>',
      '<a href="/">inicio</a>',
      '<a href="/compania/">compania</a>',
      '<a href="/blog/">listado</a>',
      '<a href="/blog/que-es-el-ens/">articulo</a>',
    ].join('')

    const revision = revisar(html)
    expect(revision.errores).toEqual([])
    expect(revision.reescrituras).toBe(0)
    expect(revision.html).toBe(html)
  })

  it('falla si el articulo enlazado no existe en ningun idioma', () => {
    const revision = revisar('<a href="/blog/no-existe/">roto</a>')
    expect(revision.errores).toHaveLength(1)
    expect(revision.errores[0]).toContain('/blog/no-existe/')
    expect(revision.errores[0]).toContain('no existe en ningun idioma')
  })

  it('falla si un enlace lleva el prefijo de idioma retirado, y dice la URL buena', () => {
    const revision = revisar('<a href="/es/compania/">sobre nosotros</a>')
    expect(revision.errores).toHaveLength(1)
    expect(revision.errores[0]).toContain('/es/compania/')
    expect(revision.errores[0]).toContain('/compania/')
  })

  it('distingue un enlace de blog con prefijo obsoleto de uno que no existe', () => {
    const revision = revisar('<a href="/es/blog/que-es-el-ens/">el ENS</a>')
    expect(revision.errores).toHaveLength(1)
    // No debe reescribirse en silencio ni confundirse con un articulo perdido:
    // el mensaje tiene que decir cual es la URL buena.
    expect(revision.errores[0]).not.toContain('no existe en ningun idioma')
    expect(revision.errores[0]).toContain('/blog/que-es-el-ens/')
    expect(revision.reescrituras).toBe(0)
  })

  it('falla si el enlace apunta a una ruta desactivada', () => {
    // Se afirma la precondicion para que el caso no mienta si algun dia la
    // calculadora vuelve a activarse.
    expect(isEnabled('calculator')).toBe(false)

    const revision = revisar('<a href="/calculadora/">calcular</a>')
    expect(revision.errores).toHaveLength(1)
    expect(revision.errores[0]).toContain('calculator')
    expect(revision.errores[0]).toContain('desactivada')
  })

  it('valida las anclas contra las declaradas en el manifiesto', () => {
    expect(revisar('<a href="/soluciones/mssp/#ot">OT</a>').errores).toEqual([])

    const revision = revisar('<a href="/soluciones/mssp/#inventada">?</a>')
    expect(revision.errores).toHaveLength(1)
    expect(revision.errores[0]).toContain('ancla')
  })

  it('falla si el destino no es ninguna ruta del manifiesto', () => {
    const revision = revisar('<a href="/servicios/">inventada</a>')
    expect(revision.errores).toHaveLength(1)
    expect(revision.errores[0]).toContain('no es ninguna ruta del manifiesto')
  })

  it('reescribe al otro idioma el articulo que aun no esta traducido', () => {
    const slugs = { es: new Set<string>(), en: new Set(['que-es-el-ens']) }
    const revision = revisarEnlacesInternos({
      html: '<a href="/blog/que-es-el-ens/">el ENS</a>',
      locale: 'es',
      origen: 'content/blog/es/prueba.md',
      slugsPorIdioma: slugs,
      manifiesto,
    })

    expect(revision.errores).toEqual([])
    expect(revision.reescrituras).toBe(1)
    expect(revision.html).toContain('href="/en/blog/que-es-el-ens/"')
  })
})
