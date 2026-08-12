import { expect, test } from '@playwright/test'

/**
 * Rutas de legado tras retirar el ingles y el prefijo de idioma (decision de
 * Direccion del 11/08/2026, `PLAN-solo-espanol.md`).
 *
 * Sustituye a `raiz-idioma.spec.ts`: la raiz ya no reparte por idioma del
 * navegador -`/` es la Home real, en espanol- y lo que hay que comprobar ahora
 * es que ninguna URL indexada con prefijo (`/es/*`, `/en/*`) devuelve 404.
 *
 * Se ejercita contra `scripts/static-server.mjs`, que lee las mismas reglas
 * `[[redirects]]` 301 de `netlify.toml` para que las dos no puedan divergir.
 */

test.describe('la raiz sirve la Home en espanol', () => {
  test('/ responde 200 con lang="es", sin redirigir', async ({ request }) => {
    const respuesta = await request.get('/', { maxRedirects: 0 })

    expect(respuesta.status()).toBe(200)
    expect(await respuesta.text()).toContain('<html lang="es"')
  })
})

test.describe('el legado con prefijo de idioma redirige 301', () => {
  test('/es/contacto/ va a /contacto/', async ({ request }) => {
    const respuesta = await request.get('/es/contacto/', { maxRedirects: 0 })

    expect(respuesta.status()).toBe(301)
    expect(respuesta.headers()['location']).toBe('/contacto/')
  })

  test('/en/company/ va a /compania/', async ({ request }) => {
    const respuesta = await request.get('/en/company/', { maxRedirects: 0 })

    expect(respuesta.status()).toBe(301)
    expect(respuesta.headers()['location']).toBe('/compania/')
  })

  test('/en/contact/ va a /contacto/', async ({ request }) => {
    const respuesta = await request.get('/en/contact/', { maxRedirects: 0 })

    expect(respuesta.status()).toBe(301)
    expect(respuesta.headers()['location']).toBe('/contacto/')
  })

  test('/en/blog/<slug>/ va a /blog/<slug>/', async ({ request }) => {
    const respuesta = await request.get('/en/blog/que-es-el-ens/', { maxRedirects: 0 })

    expect(respuesta.status()).toBe(301)
    expect(respuesta.headers()['location']).toBe('/blog/que-es-el-ens/')
  })

  test('/es/* cubre cualquier URL espanola con un solo comodin', async ({ request }) => {
    const respuesta = await request.get('/es/soluciones/mssp/it/', { maxRedirects: 0 })

    expect(respuesta.status()).toBe(301)
    expect(respuesta.headers()['location']).toBe('/soluciones/mssp/it/')
  })

  test('/en/* sin regla especifica cae a la Home', async ({ request }) => {
    const respuesta = await request.get('/en/', { maxRedirects: 0 })

    expect(respuesta.status()).toBe(301)
    expect(respuesta.headers()['location']).toBe('/')
  })

  test('la redireccion se sigue de verdad y llega a una pagina real', async ({ page }) => {
    const respuesta = await page.goto('/es/contacto/')

    expect(respuesta?.status()).toBe(200)
    expect(page.url()).toMatch(/\/contacto\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })
})

test.describe('404', () => {
  test('una URL inventada, con o sin prefijo, da 404', async ({ request }) => {
    expect((await request.get('/inventado/')).status()).toBe(404)
    expect((await request.get('/es/inventado/')).status()).toBe(404)
  })
})
