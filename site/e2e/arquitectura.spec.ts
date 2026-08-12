import { expect, test } from '@playwright/test'
import { IDIOMAS_ACTIVOS, ROUTES } from '../src/config/routes'

/**
 * Pruebas de la seccion 12.5 que verifican **que la migracion es real**: que lo
 * que sirve el hosting es HTML completo y que detras no hay ningun computo.
 *
 * Se ejecutan contra `out/` servido por `scripts/static-server.mjs`, no contra
 * `next dev`: contra el servidor de desarrollo no probarian nada de esto.
 */

const rutasActivas = ROUTES.filter((route) => route.enabled)

test.describe('exportacion estatica', () => {
  for (const locale of IDIOMAS_ACTIVOS) {
    for (const route of rutasActivas) {
      test(`${route.id} (${locale}) responde HTML completo`, async ({ request }) => {
        const respuesta = await request.get(route.paths[locale])
        expect(respuesta.status()).toBe(200)

        const html = await respuesta.text()
        expect(html).toContain(`<html lang="${locale}"`)
        // Un solo h1 por pagina (seccion 7.6).
        expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
        expect(html).toMatch(/<title[^>]*>[^<]+<\/title>/)
        // Canonical solo donde tiene sentido: la 404 no lo lleva, porque su
        // cuerpo responde a cualquier URL rota y apuntarlas todas a `/404/` es
        // la definicion de soft 404.
        if (route.indexable) {
          expect(html).toContain('rel="canonical"')
        } else {
          expect(html).not.toContain('rel="canonical"')
          expect(html).toContain('noindex')
        }
      })
    }
  }
})

test.describe('contenido sin JavaScript', () => {
  // Es la prueba de que los Server Components hicieron su trabajo en el build.
  test.use({ javaScriptEnabled: false })

  test('la Home muestra su contenido completo', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    // Las cuatro tarjetas de pilar.
    await expect(page.getByRole('link', { name: /ver servicios/i })).toHaveCount(4)
  })

  test('el catalogo IT lista sus 23 servicios', async ({ page }) => {
    await page.goto('/soluciones/mssp/it/')
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(23)
  })
})

test.describe('404', () => {
  for (const [ruta, esperado] of [
    ['/inventado/', 'es'],
    ['/soluciones/mssp/inventado/', 'es'],
  ] as const) {
    test(`${ruta} devuelve 404 en "${esperado}"`, async ({ request }) => {
      const respuesta = await request.get(ruta)
      expect(respuesta.status()).toBe(404)
      const html = await respuesta.text()
      expect(html).toContain(`lang="${esperado}"`)
      // La 404 llego a publicarse sin titulo: con estado 404 Next toma los
      // metadatos de `app/not-found.tsx`, no de la ruta atrapatodo. Esta es la
      // prueba de extremo a extremo de que ese export sigue ahi.
      expect(/<title[^>]*>([^<]+)<\/title>/.exec(html)?.[1]).toContain('no encontrada')
    })
  }

  test('las rutas reales no las intercepta la regla comodin', async ({ request }) => {
    // El orden de netlify.toml importa: si una regla comodin queda por encima
    // de una ruta real, se la come (seccion 10.4).
    //
    // "notFound" entra tambien, y con 200: la regla comodin no lleva `force`,
    // asi que solo actua cuando no hay fichero. Pedir `/404/` directamente
    // devuelve el HTML con 200; es la 404 de verdad -una URL inventada- la que
    // llega con estado 404, y eso lo cubren los tests de arriba.
    for (const route of rutasActivas) {
      const respuesta = await request.get(route.paths.es)
      expect(respuesta.status(), `${route.id} no debe caer en la 404`).toBe(200)
    }
  })
})
