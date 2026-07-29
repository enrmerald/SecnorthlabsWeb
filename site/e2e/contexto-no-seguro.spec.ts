import { expect, test } from '@playwright/test'

/**
 * Los formularios tienen que funcionar **sin contexto seguro**.
 *
 * `crypto.randomUUID()` solo existe en HTTPS o `localhost`. En el servidor de
 * revision interno, servido por HTTP en una IP de la red local, no existe: el
 * `useEffect` que lo llamaba lanzaba durante la fase de commit de React y, sin
 * error boundary, React desmontaba el arbol entero. El formulario de contacto y
 * la calculadora aparecian EN BLANCO.
 *
 * Las 372 pruebas anteriores no lo detectaron porque corren contra `localhost`,
 * que si es contexto seguro. Aqui se simula quitando `randomUUID` antes de que
 * cargue la pagina, que es exactamente lo que ve el navegador por IP.
 */
test.describe('sin contexto seguro (HTTP en una IP)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // `getRandomValues` SI esta disponible sin contexto seguro; `randomUUID` no.
      // Se reproduce esa asimetria exacta.
      Reflect.deleteProperty(crypto, 'randomUUID')
      Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
    })
  })

  for (const [ruta, minimoCampos] of [
    ['/es/contacto/', 8],
    ['/es/calculadora/', 15],
  ] as const) {
    test(`${ruta} se renderiza y no lanza`, async ({ page }) => {
      const errores: string[] = []
      page.on('pageerror', (e) => errores.push(e.message))

      await page.goto(ruta)
      await expect(page.locator('form')).toBeVisible()

      // Lo que fallaba: el arbol se desmontaba y no quedaba ni un campo.
      expect(await page.locator('form input, form select').count()).toBeGreaterThanOrEqual(
        minimoCampos,
      )
      expect(errores, `errores en consola: ${errores.join(' | ')}`).toHaveLength(0)
    })
  }

  test('la calculadora sigue devolviendo el precio', async ({ page }) => {
    // No basta con que se pinte: el submissionId del respaldo tiene que ser un
    // UUID valido o la funcion lo rechaza con un 400.
    await page.goto('/es/calculadora/')

    const form = page.locator('form')
    await form.getByLabel(/^nombre/i).fill('Ana')
    await form.getByLabel(/^apellidos/i).fill('García Pérez')
    await form.getByRole('textbox', { name: /empresa/i }).fill('Acme S.A.')
    await form.getByLabel(/^email profesional/i).fill('ana@acme.com')
    await form.locator('input[type=checkbox]').check()
    await form.getByRole('button', { name: /ver mi estimación/i }).click()

    // El importe del caso de oro con los valores por defecto del formulario.
    await expect(page.getByText(/€\/mes/)).toBeVisible({ timeout: 10_000 })
  })
})
