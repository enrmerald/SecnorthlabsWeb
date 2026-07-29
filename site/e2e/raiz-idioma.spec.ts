import { expect, test } from '@playwright/test'

/**
 * Reparto de la raiz segun el idioma del navegador.
 *
 * En produccion lo hacen las dos reglas de `netlify.toml`; aqui se ejercita la
 * copia del servidor de preview, que lee la lista de variantes del propio
 * `netlify.toml` para que las dos no puedan divergir.
 *
 * ⚠️ Lo que esto NO puede comprobar es la implementacion de Netlify: que su
 * condicion `Language` case como se espera solo se ve desplegando. Lo que si fija
 * es el comportamiento acordado, de modo que si alguien cambia la lista del toml,
 * estas pruebas lo dicen.
 */

/** Sin seguir la redireccion: lo que se comprueba es la respuesta, no el destino. */
async function pedirRaiz(request: import('@playwright/test').APIRequestContext, idioma?: string) {
  return request.get('/', {
    maxRedirects: 0,
    headers: idioma ? { 'Accept-Language': idioma } : {},
  })
}

test.describe('la raiz reparte por idioma', () => {
  for (const idioma of ['es', 'es-ES,es;q=0.9,en;q=0.8', 'es-419', 'es-MX', 'ca-ES,es;q=0.8']) {
    test(`"${idioma}" va a /es/`, async ({ request }) => {
      const respuesta = await pedirRaiz(request, idioma)

      expect(respuesta.status()).toBe(302)
      expect(respuesta.headers()['location']).toBe('/es/')
    })
  }

  for (const idioma of ['en-US,en;q=0.9', 'fr-FR', 'de', 'pt-BR']) {
    test(`"${idioma}" va a /en/`, async ({ request }) => {
      const respuesta = await pedirRaiz(request, idioma)

      expect(respuesta.status()).toBe(302)
      expect(respuesta.headers()['location']).toBe('/en/')
    })
  }

  test('es 302 y no 301, y declara Vary', async ({ request }) => {
    const respuesta = await pedirRaiz(request, 'es-ES')

    // Un 301 lo cachean navegadores y CDN sin volver a mirar la cabecera: el
    // primero que entrase dejaria su idioma fijado para todos los demas.
    expect(respuesta.status()).toBe(302)
    expect(respuesta.headers()['vary']).toContain('Accept-Language')
  })

  test('el fichero de la raiz reparte tambien sin Netlify', async ({ request }) => {
    // `next dev` no conoce netlify.toml, y ahi `/` daba un 404. La pagina de la
    // raiz cubre ese hueco y sirve de red de seguridad si la regla del borde
    // dejara de aplicarse. Se pide el fichero directamente porque el servidor de
    // preview, como Netlify, intercepta `/` antes de servirlo.
    const respuesta = await request.get('/index.html')
    expect(respuesta.status()).toBe(200)

    const html = await respuesta.text()

    // Los dos enlaces funcionan sin JavaScript: si el script no se ejecuta, queda
    // una eleccion de idioma y no una pagina en blanco.
    expect(html).toContain('href="/es/"')
    expect(html).toContain('href="/en/"')

    // Y no es contenido: no se indexa ni entra en el sitemap.
    expect(html).toContain('noindex')
  })

  test('la raiz no esta en el sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    expect(xml).not.toContain('<loc>https://secnorthlabs.eu/</loc>')
    expect(xml).toContain('<loc>https://secnorthlabs.eu/es/</loc>')
  })

  test('el destino existe y es la home del idioma correcto', async ({ page }) => {
    // Con la redireccion seguida de verdad, para comprobar que no lleva a un 404.
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })
    const respuesta = await page.goto('/')

    expect(respuesta?.status()).toBe(200)
    expect(page.url()).toMatch(/\/en\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
