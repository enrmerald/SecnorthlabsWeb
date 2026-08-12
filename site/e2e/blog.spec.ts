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
    await pagina.goto('/blog/')

    // El destacado va aparte y no se repite en la rejilla.
    const tarjetas = pagina.locator('li[data-categoria]')
    await expect(tarjetas).toHaveCount(ARTICULOS_ES.length - 1)

    await expect(pagina.getByRole('heading', { level: 1 })).toContainText('Blog')
    await expect(
      pagina.getByRole('link', { name: PRIMERO.title, exact: true }),
    ).toHaveAttribute('href', `/blog/${PRIMERO.slug}/`)

    await contexto.close()
  })

  test('el filtro por tema deja solo los articulos de ese tema', async ({ page }) => {
    await page.goto('/blog/')

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
      const respuesta = await page.goto(`/blog/${articulo.slug}/`)
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
        `https://secnorthlabs.eu/blog/${articulo.slug}/`,
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

  test('hay una salida al listado antes de empezar a leer', async ({ page }) => {
    // Las migas ya llevan al blog, pero son de 12px y estan para situarse. Quien
    // entra desde una busqueda necesita un objetivo pulsable antes del articulo,
    // no solo al final de tres mil palabras.
    await page.goto(`/blog/${PRIMERO.slug}/`)

    const volver = page.getByRole('link', { name: /volver al blog/i })
    await expect(volver).toBeVisible()
    await expect(volver).toHaveAttribute('href', '/blog/')

    // Y por encima de la categoria, que es el orden pedido. La fila de la
    // categoria se localiza por el tiempo de lectura, que la acompana: buscarla
    // por clase cogia el propio boton de volver, que tambien es una pildora.
    const arribaDe = async (locator: import('@playwright/test').Locator) =>
      (await locator.boundingBox())?.y ?? Number.NaN

    const volverY = await arribaDe(volver)
    const categoriaY = await arribaDe(page.getByText(/min de lectura/).first())

    expect(volverY).toBeLessThan(categoriaY)
    // Y las migas por encima de todo.
    expect(await arribaDe(page.getByRole('navigation').filter({ hasText: 'Inicio' }))).toBeLessThan(
      volverY,
    )
  })

  test('las tablas se pueden desplazar con el teclado y no desbordan la pagina', async ({
    page,
  }) => {
    // El articulo de ENS vs ISO trae una tabla de tres columnas anchas: es el caso
    // que rompia el ancho de la pagina en movil antes del envoltorio con scroll.
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/blog/ens-vs-iso-27001-diferencias/')

    const envoltorio = page.locator('.tabla-scroll').first()
    await expect(envoltorio).toBeVisible()
    await expect(envoltorio).toHaveAttribute('tabindex', '0')
    await expect(envoltorio).toHaveAttribute('role', 'region')

    // La tabla desborda su envoltorio -por eso hay scroll- pero no la pagina.
    const desbordes = await page.evaluate(() => {
      const caja = document.querySelector('.tabla-scroll') as HTMLElement
      return {
        tabla: caja.scrollWidth > caja.clientWidth,
        pagina: document.documentElement.scrollWidth > window.innerWidth + 1,
      }
    })
    expect(desbordes.tabla).toBe(true)
    expect(desbordes.pagina).toBe(false)
  })

  test('el cuerpo crece con la pantalla en lugar de quedarse fijo', async ({ page }) => {
    await page.goto(`/blog/${PRIMERO.slug}/`)

    const anchoEn = async (ancho: number) => {
      await page.setViewportSize({ width: ancho, height: 1000 })
      return page.locator('.prosa').evaluate((nodo) => nodo.getBoundingClientRect().width)
    }

    const a1024 = await anchoEn(1024)
    const a1920 = await anchoEn(1920)

    // Antes la medida era fija en 68ch y a partir de 1024 el texto se quedaba
    // quieto, dejando un hueco enorme hasta el indice.
    expect(a1920).toBeGreaterThan(a1024 + 40)
  })

  test('no queda ningun enlace al blog anterior', async ({ page }) => {
    for (const articulo of ARTICULOS_ES.slice(0, 5)) {
      await page.goto(`/blog/${articulo.slug}/`)
      const externos = page.locator('.prosa a[href*="ewala.es/blog/posts"]')
      await expect(externos).toHaveCount(0)
    }
  })

  test('un slug que no existe acaba en la 404 y no en una pagina vacia', async ({ page }) => {
    const respuesta = await page.goto('/blog/articulo-inventado/')
    // El servidor estatico devuelve 404; en Netlify lo hace la regla del final
    // de netlify.toml. En los dos casos, lo que no puede pasar es que se sirva
    // una pagina de articulo sin contenido.
    expect(respuesta?.status()).toBe(404)
    await expect(page.locator('.prosa')).toHaveCount(0)
  })
})

// La version inglesa se retira con IDIOMAS_ACTIVOS (PLAN-solo-espanol.md):
// content/blog/en/ se conserva en disco pero content:build no lo compila, asi
// que /en/blog/ no se genera. Las pruebas de esa version se quitan de aqui;
// volver a activarla es devolverlas junto con el interruptor.

test.describe('sitemap y robots', () => {
  test('el sitemap incluye los articulos publicados y ninguno en borrador', async ({
    request,
  }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    for (const articulo of ARTICULOS_ES) {
      expect(xml).toContain(`https://secnorthlabs.eu/blog/${articulo.slug}/`)
    }

    // Los tres borradores no existen como pagina, asi que tampoco pueden estar
    // aqui: un sitemap que declara un 404 es peor que no declarar nada.
    expect(xml).not.toContain('de-tiktok-a-tu-empresa')
    expect(xml).not.toContain('la-importancia-de-una-solucion-integral')
  })

  test('robots.txt apunta al sitemap y no bloquea el blog', async ({ request }) => {
    const texto = await (await request.get('/robots.txt')).text()
    expect(texto).toContain('Sitemap: https://secnorthlabs.eu/sitemap-google.xml')
    expect(texto).toContain('Sitemap: https://secnorthlabs.eu/sitemap.xml')
    expect(texto).not.toMatch(/Disallow: \/(es\/blog|$)/m)
  })

  test('sitemap-google.xml tiene las mismas URLs que sitemap.xml pero sin xhtml:link', async ({
    request,
  }) => {
    const xml = await (await request.get('/sitemap-google.xml')).text()

    expect(xml).not.toContain('xhtml:link')
    expect(xml).not.toContain('<priority>')
    for (const articulo of ARTICULOS_ES) {
      expect(xml).toContain(`https://secnorthlabs.eu/blog/${articulo.slug}/`)
    }
  })
})
