import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  LOCALES,
  ROUTES,
  getLocalizedPath,
  getRoute,
  isEnabled,
  isLocale,
  pathToSegments,
  resolveRoute,
} from './routes'

describe('manifiesto de rutas', () => {
  it('declara los dos idiomas y el espanol como predeterminado', () => {
    expect(LOCALES).toEqual(['es', 'en'])
    expect(DEFAULT_LOCALE).toBe('es')
  })

  it('reconoce solo los idiomas del manifiesto', () => {
    expect(isLocale('es')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('EN')).toBe(false)
  })

  it('falla ruidosamente ante un RouteId inexistente', () => {
    // @ts-expect-error se comprueba el fallo en runtime, no el tipado
    expect(() => getRoute('inventada')).toThrow(/inventada/)
  })
})

describe('getLocalizedPath', () => {
  it('traduce el slug conservando la pagina logica', () => {
    expect(getLocalizedPath('grc', 'es')).toBe('/es/soluciones/grc/')
    expect(getLocalizedPath('grc', 'en')).toBe('/en/solutions/grc/')
    expect(getLocalizedPath('company', 'es')).toBe('/es/compania/')
    expect(getLocalizedPath('company', 'en')).toBe('/en/company/')
  })

  it('traduce tambien el ancla, no solo la pagina', () => {
    // Es el caso concreto de la seccion 2.1.3 del plan.
    expect(getLocalizedPath('grc', 'es', 'idi')).toBe('/es/soluciones/grc/#idi')
    expect(getLocalizedPath('grc', 'en', 'idi')).toBe('/en/solutions/grc/#rdi')
  })

  it('acepta el ancla con o sin almohadilla', () => {
    expect(getLocalizedPath('mssp', 'es', '#ot')).toBe(getLocalizedPath('mssp', 'es', 'ot'))
  })

  it('no traduce las siglas tecnicas', () => {
    expect(getLocalizedPath('mssp', 'en', 'it')).toBe('/en/solutions/mssp/#it')
  })

  it('falla si se pide un ancla que la ruta no declara', () => {
    // Sin esto, un enlace roto se publicaria en silencio.
    expect(() => getLocalizedPath('software', 'es', 'inventada')).toThrow(/inventada/)
  })
})

describe('pathToSegments y resolveRoute son inversas', () => {
  it('resuelve toda ruta activa a partir de sus propios segmentos', () => {
    for (const route of ROUTES.filter((r) => r.enabled)) {
      for (const locale of LOCALES) {
        const segmentos = pathToSegments(route.paths[locale], locale)
        expect(resolveRoute(locale, segmentos)?.id).toBe(route.id)
      }
    }
  })

  it('la portada no tiene segmentos', () => {
    expect(pathToSegments('/es/', 'es')).toEqual([])
    expect(resolveRoute('es', [])?.id).toBe('home')
  })

  it('no resuelve una ruta inventada', () => {
    expect(resolveRoute('es', ['soluciones', 'inventado'])).toBeUndefined()
  })

  it('no resuelve el slug de un idioma con el prefijo del otro', () => {
    // /en/compania/ no debe existir: el slug ingles es /en/company/.
    expect(resolveRoute('en', ['compania'])).toBeUndefined()
    expect(resolveRoute('es', ['company'])).toBeUndefined()
  })
})

describe('coherencia del manifiesto', () => {
  it('no repite ningun slug dentro del mismo idioma', () => {
    for (const locale of LOCALES) {
      const paths = ROUTES.filter((r) => r.enabled).map((r) => r.paths[locale])
      expect(new Set(paths).size).toBe(paths.length)
    }
  })

  it('toda ruta activa es indexable salvo la 404', () => {
    for (const route of ROUTES.filter((r) => r.enabled && !r.indexable)) {
      expect(route.id).toBe('notFound')
    }
  })

  it('isEnabled distingue activas de inexistentes', () => {
    expect(isEnabled('home')).toBe(true)
    // @ts-expect-error se comprueba el comportamiento con un id que no existe
    expect(isEnabled('inventada')).toBe(false)
  })
})
