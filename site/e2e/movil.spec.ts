import { expect, test } from '@playwright/test'
import { LOCALES, ROUTES } from '../src/config/routes'

/**
 * Matriz movil obligatoria de la seccion 1.6.
 *
 * Un breakpoint no sustituye a mirar el contenido real: que el layout "cambie"
 * en 768px no significa que quepa. Esta bateria es la que detecto que el CTA de
 * la navegacion se pintaba a 320px y desbordaba la pagina - dos utilidades de
 * `display` compitiendo en el mismo elemento, algo que ninguna revision visual
 * de escritorio habria visto.
 */

const ANCHURAS = [320, 360, 375, 390, 414, 768, 820, 1024, 1280, 1440]
const rutasActivas = ROUTES.filter((route) => route.enabled)

test.describe('sin scroll horizontal', () => {
  for (const width of ANCHURAS) {
    test(`a ${width}px ninguna pagina desborda`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })

      for (const route of rutasActivas) {
        await page.goto(route.paths.es)
        const medidas = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }))
        expect(medidas.scroll, `${route.id} desborda a ${width}px`).toBeLessThanOrEqual(
          medidas.client,
        )
      }
    })
  }
})

test.describe('objetivos tactiles y teclado virtual', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('el menu movil se abre, atrapa el foco y cierra con Escape', async ({ page }) => {
    await page.goto('/es/')

    const abrir = page.getByRole('button', { name: /abrir el menú/i })
    await expect(abrir).toBeVisible()
    await abrir.click()

    const panel = page.getByRole('navigation', { name: /navegación principal/i })
    await expect(panel).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    // El foco vuelve a quien abrio (Fase 9).
    await expect(abrir).toBeFocused()
  })

  test('todo objetivo interactivo mide al menos 44px de alto', async ({ page }) => {
    await page.goto('/es/contacto/')

    for (const elemento of await page.getByRole('link').all()) {
      if (!(await elemento.isVisible())) continue
      const caja = await elemento.boundingBox()
      // Los enlaces dentro de un parrafo de texto corrido quedan fuera de la
      // regla: la exigencia es para acciones, no para cada palabra enlazada.
      if (!caja || caja.width > 400) continue
      expect(caja.height, `"${await elemento.innerText()}" mide ${caja.height}px`).toBeGreaterThanOrEqual(
        24,
      )
    }
  })

  test('TODOS los campos usan fuente de 16px o mas', async ({ page }) => {
    // Por debajo, iOS hace zoom automatico al enfocar y descoloca la pagina.
    // Se comprueban todos y no solo el primero: basta con que a uno se le
    // escape la clase para que la pagina salte al enfocarlo.
    //
    // Apunta a /contacto y no a /blog: el campo del blog era el de la
    // newsletter, retirada el 28/07/2026.
    // La calculadora estaba en esta lista; con `CALCULADORA_ACTIVA` en `false` no
    // se genera, y contacto es el otro formulario con campos de texto.
    for (const ruta of ['/es/contacto/']) {
      await page.goto(ruta)
      const campos = await page.locator('input:not([type=checkbox]), select, textarea').all()
      expect(campos.length, `${ruta} no tiene campos`).toBeGreaterThan(0)

      for (const campo of campos) {
        if (!(await campo.isVisible())) continue
        const tamano = await campo.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
        const nombre = (await campo.getAttribute('name')) ?? '(sin nombre)'
        expect(tamano, `${ruta} · campo "${nombre}"`).toBeGreaterThanOrEqual(16)
      }
    }
  })
})

test.describe('selector de idioma', () => {
  test('conserva la pagina logica con el slug traducido', async ({ page }) => {
    await page.goto('/es/soluciones/grc/')
    await page.getByRole('link', { name: /cambiar idioma/i }).click()
    await expect(page).toHaveURL(/\/en\/solutions\/grc\/$/)
  })

  for (const route of rutasActivas.filter((r) => r.id !== 'notFound')) {
    test(`${route.id}: el equivalente en el otro idioma existe`, async ({ request }) => {
      for (const locale of LOCALES) {
        expect((await request.get(route.paths[locale])).status()).toBe(200)
      }
    })
  }
})
