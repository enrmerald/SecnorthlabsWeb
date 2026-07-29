import { expect, test } from '@playwright/test'
// Playwright no pasa por el bundler de Next, asi que el JSON necesita el
// atributo de importacion explicito.
import compilado from '../src/generated/blog.json' with { type: 'json' }

/**
 * Pruebas del blog, contra el artefacto exportado.
 *
 * Los articulos son las unicas paginas del sitio que **no** salen del manifiesto
 * de rutas, sino del contenido de `content/blog/`. Por eso no las cubren las
 * pruebas de rutas existentes y necesitan las suyas: un fallo del pipeline de
 * contenido -un slug que no genera pagina, un cuerpo vacio, un HTML escapado que
 * se ve como texto- no lo detecta ninguna otra comprobacion.
 */

const ARTICULOS_ES = compilado.es
const ARTICULOS_EN = compilado.en
const PRIMERO = ARTICULOS_ES[0]
if (!PRIMERO) throw new Error('no hay articulos compilados: ejecuta pnpm content:build')

test.describe('listado del blog', () => {
  test('las tarjetas de todos los articulos estan en el HTML, sin JavaScript', async ({
    browser,
  }) => {
    // Sin JavaScript a proposito: el filtro por tema es una comodidad, pero el
    // contenido y sus enlaces tienen que estar en el HTML exportado, que es lo
    // que ve un rastreador.
    const contexto = await browser.newContext({ javaScriptEnabled: false })
    const pagina = await contexto.newPage()
    await pagina.goto('/es/blog/')

    // El destacado va aparte y no se repite en la rejilla.
    const tarjetas = pagina.locator('li[data-categoria]')
    await expect(tarjetas).toHaveCount(ARTICULOS_ES.length - 1)

    await expect(pagina.getByRole('heading', { level: 1 })).toContainText('Blog')
    await expect(
      pagina.getByRole('link', { name: PRIMERO.title, exact: true }),
    ).toHaveAttribute('href', `/es/blog/${PRIMERO.slug}/`)

    await contexto.close()
  })

  test('el filtro por tema deja solo los articulos de ese tema', async ({ page }) => {
    await page.goto('/es/blog/')

    const cumplimiento = ARTICULOS_ES.filter(
      (articulo) => articulo.category === 'cumplimiento' && articulo.slug !== PRIMERO.slug,
    ).length

    await page.getByRole('button', { name: 'Cumplimiento' }).click()

    await expect(page.locator('li[data-categoria]:visible')).toHaveCount(cumplimiento)
    await expect(page.getByRole('button', { name: 'Cumplimiento' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // Y volver a "todos" restaura la lista completa.
    await page.getByRole('button', { name: 'Todos los temas' }).click()
    await expect(page.locator('li[data-categoria]:visible')).toHaveCount(
      ARTICULOS_ES.length - 1,
    )
  })
})

test.describe('paginas de articulo', () => {
  for (const articulo of ARTICULOS_ES) {
    test(`${articulo.slug}: se genera con su contenido y sus metadatos`, async ({ page }) => {
      const respuesta = await page.goto(`/es/blog/${articulo.slug}/`)
      expect(respuesta?.status()).toBe(200)

      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(articulo.title)

      // El cuerpo esta convertido a HTML, no escapado: si el conversor fallara,
      // la pagina mostraria etiquetas como texto.
      const cuerpo = page.locator('.prosa')
      await expect(cuerpo).toBeVisible()
      await expect(cuerpo.locator('p').first()).toBeVisible()
      await expect(cuerpo).not.toContainText('<p>')

      // Canonica del propio idioma y BlogPosting con la fecha real.
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://secnorthlabs.eu/es/blog/${articulo.slug}/`,
      )

      const jsonLd = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent()
      const datos = JSON.parse(jsonLd ?? '{}')
      expect(datos['@type']).toBe('BlogPosting')
      expect(datos.datePublished).toBe(articulo.date)
      expect(datos.headline).toBe(articulo.title)
    })
  }

  test('no queda ningun enlace al blog anterior', async ({ page }) => {
    for (const articulo of ARTICULOS_ES.slice(0, 5)) {
      await page.goto(`/es/blog/${articulo.slug}/`)
      const externos = page.locator('.prosa a[href*="ewala.es/blog/posts"]')
      await expect(externos).toHaveCount(0)
    }
  })

  test('un slug que no existe acaba en la 404 y no en una pagina vacia', async ({ page }) => {
    const respuesta = await page.goto('/es/blog/articulo-inventado/')
    // El servidor estatico devuelve 404; en Netlify lo hace la regla del final
    // de netlify.toml. En los dos casos, lo que no puede pasar es que se sirva
    // una pagina de articulo sin contenido.
    expect(respuesta?.status()).toBe(404)
    await expect(page.locator('.prosa')).toHaveCount(0)
  })
})

test.describe('version inglesa', () => {
  test('el listado ingles tiene sus articulos y sus enlaces son de /en/', async ({ page }) => {
    await page.goto('/en/blog/')

    await expect(page.locator('li[data-categoria]')).toHaveCount(ARTICULOS_EN.length - 1)

    const enlaces = await page.locator('li[data-categoria] a').evaluateAll((nodos) =>
      nodos.map((nodo) => nodo.getAttribute('href')),
    )
    expect(enlaces.length).toBeGreaterThan(0)
    for (const href of enlaces) expect(href).toMatch(/^\/en\/blog\//)
  })

  test('cada articulo ingles declara su alternativa en espanol', async ({ page }) => {
    for (const articulo of ARTICULOS_EN.slice(0, 5)) {
      const respuesta = await page.goto(`/en/blog/${articulo.slug}/`)
      expect(respuesta?.status()).toBe(200)

      // Las dos versiones existen, asi que las dos alternativas de idioma tienen
      // que estar declaradas: es lo que le dice al buscador que son la misma
      // pieza en dos idiomas y no dos paginas compitiendo.
      await expect(page.locator('link[hrefLang="es"]')).toHaveAttribute(
        'href',
        `https://secnorthlabs.eu/es/blog/${articulo.slug}/`,
      )
      await expect(page.locator('link[hrefLang="en"]')).toHaveAttribute(
        'href',
        `https://secnorthlabs.eu/en/blog/${articulo.slug}/`,
      )
    }
  })

  test('el cuerpo ingles no arrastra enlaces al blog en espanol', async ({ page }) => {
    for (const articulo of ARTICULOS_EN.slice(0, 8)) {
      await page.goto(`/en/blog/${articulo.slug}/`)
      await expect(page.locator('.prosa a[href^="/es/"]')).toHaveCount(0)
    }
  })
})

test.describe('sitemap y robots', () => {
  test('el sitemap incluye los articulos publicados y ninguno en borrador', async ({
    request,
  }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    for (const articulo of ARTICULOS_ES) {
      expect(xml).toContain(`https://secnorthlabs.eu/es/blog/${articulo.slug}/`)
    }

    // Los tres borradores no existen como pagina, asi que tampoco pueden estar
    // aqui: un sitemap que declara un 404 es peor que no declarar nada.
    expect(xml).not.toContain('de-tiktok-a-tu-empresa')
    expect(xml).not.toContain('la-importancia-de-una-solucion-integral')
  })

  test('robots.txt apunta al sitemap y no bloquea el blog', async ({ request }) => {
    const texto = await (await request.get('/robots.txt')).text()
    expect(texto).toContain('Sitemap: https://secnorthlabs.eu/sitemap.xml')
    expect(texto).not.toMatch(/Disallow: \/(es\/blog|$)/m)
  })
})
