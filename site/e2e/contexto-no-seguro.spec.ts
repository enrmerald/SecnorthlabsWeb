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

  // ⚠️ La calculadora tambien se comprobaba aqui, y era el caso mas exigente: 15
  // campos y una llamada a `/api/quote`. Mientras `CALCULADORA_ACTIVA` sea
  // `false` esa pagina no se genera, asi que solo queda contacto. Al reactivarla
  // hay que devolver estas dos pruebas: el fallo que motivo el fichero
  // -`crypto.randomUUID` inexistente sin contexto seguro- afectaba a los dos
  // formularios por igual.
  for (const [ruta, minimoCampos] of [['/es/contacto/', 8]] as const) {
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

  // Aqui iba «la calculadora sigue devolviendo el precio», que enviaba el
  // formulario y comprobaba el importe del caso de oro contra `/api/quote`. Se
  // recupera junto con la ruta cuando `CALCULADORA_ACTIVA` vuelva a `true`.
})
