import { expect, test } from '@playwright/test'
import { LOCALES, ROUTES } from '../src/config/routes'

/**
 * Pruebas de la seccion 12.5 que verifican **que la migracion es real**: que lo
 * que sirve el hosting es HTML completo y que detras no hay ningun computo.
 *
 * Se ejecutan contra `out/` servido por `scripts/static-server.mjs`, no contra
 * `next dev`: contra el servidor de desarrollo no probarian nada de esto.
 */

const rutasActivas = ROUTES.filter((route) => route.enabled)

test.describe('exportacion estatica', () => {
  test('la raiz redirige a un idioma, sin servir contenido propio', async ({ request }) => {
    // Desde el 29/07/2026 el destino depende del idioma del navegador y la
    // redireccion es 302, no 301: el detalle se comprueba en `raiz-idioma.spec.ts`.
    // Lo que se fija aqui es lo que interesa a la arquitectura: en `/` no hay
    // pagina, solo un reparto.
    const respuesta = await request.get('/', { maxRedirects: 0 })

    expect(respuesta.status()).toBe(302)
    expect(respuesta.headers()['location']).toMatch(/^\/(es|en)\/$/)
  })

  for (const locale of LOCALES) {
    for (const route of rutasActivas) {
      test(`${route.id} (${locale}) responde HTML completo`, async ({ request }) => {
        const respuesta = await request.get(route.paths[locale])
        expect(respuesta.status()).toBe(200)

        const html = await respuesta.text()
        expect(html).toContain(`<html lang="${locale}"`)
        // Un solo h1 por pagina (seccion 7.6).
        expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
        expect(html).toContain('rel="canonical"')
      })
    }
  }

  test('ES y EN devuelven HTML distinto', async ({ request }) => {
    const es = await (await request.get('/es/')).text()
    const en = await (await request.get('/en/')).text()
    expect(es).not.toBe(en)
  })
})

test.describe('contenido sin JavaScript', () => {
  // Es la prueba de que los Server Components hicieron su trabajo en el build.
  test.use({ javaScriptEnabled: false })

  test('la Home muestra su contenido completo', async ({ page }) => {
    await page.goto('/es/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    // Las cuatro tarjetas de pilar.
    await expect(page.getByRole('link', { name: /ver servicios/i })).toHaveCount(4)
  })

  test('el catalogo IT lista sus 23 servicios', async ({ page }) => {
    await page.goto('/es/soluciones/mssp/it/')
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(23)
  })
})

test.describe('404', () => {
  for (const [ruta, esperado] of [
    ['/inventado/', 'es'],
    ['/es/inventado/', 'es'],
    ['/en/made-up/', 'en'],
    ['/es/soluciones/mssp/inventado/', 'es'],
  ] as const) {
    test(`${ruta} devuelve 404 en "${esperado}"`, async ({ request }) => {
      const respuesta = await request.get(ruta)
      expect(respuesta.status()).toBe(404)
      expect(await respuesta.text()).toContain(`lang="${esperado}"`)
    })
  }

  test('las rutas reales no las intercepta la regla comodin', async ({ request }) => {
    // El orden de netlify.toml importa: si una regla comodin queda por encima
    // de una ruta real, se la come (seccion 10.4).
    for (const route of rutasActivas) {
      const respuesta = await request.get(route.paths.es)
      expect(respuesta.status(), `${route.id} no debe caer en la 404`).toBe(200)
    }
  })
})
