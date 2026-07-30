import { expect, test } from '@playwright/test'

/**
 * El honeypot tiene que llegar al servidor.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTA ES LA PRUEBA QUE FALTABA, y su ausencia costo que la defensa estuviera
 * desconectada sin que nadie lo viera.
 *
 * El campo trampa se pintaba en los dos formularios y el servidor lo comprobaba,
 * pero **nadie leia el input**: el envio mandaba siempre `honeypot: ''`. Un bot
 * que rellenara todo pasaba el filtro sin enterarse de que existia.
 *
 * `funciones.spec.ts` no podia cazarlo: construye el JSON a mano y llama al
 * endpoint, asi que comprueba el contrato del servidor -que esta bien- y nunca el
 * cable que va del navegador al servidor. La unica forma de comprobar un cable es
 * conducir el formulario de verdad, que es lo que se hace aqui.
 *
 * Se intercepta `/api/contact` en lugar de dejar que llegue: lo que se comprueba
 * es lo que el navegador ENVIA, y ademas asi la prueba no depende de que haya
 * claves de Resend ni deja avisos en ningun buzon.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Rellena lo obligatorio del formulario de contacto. */
async function rellenarMinimo(page: import('@playwright/test').Page) {
  await page.locator('input[name="firstName"]').fill('Ana')
  await page.locator('input[name="company"]').fill('Acme Industrial')
  await page.locator('input[name="email"]').fill('ana@acme.example')

  // El desplegable de necesidad: se elige la primera opcion real, sin depender
  // del texto, que esta traducido y puede cambiar.
  const need = page.locator('select[name="need"]')
  const valores = await need.locator('option').evaluateAll((opciones) =>
    opciones.map((o) => (o as HTMLOptionElement).value).filter((v) => v !== ''),
  )
  await need.selectOption(valores[0]!)

  await page.locator('input[name="privacy"]').check()
}

test.describe('honeypot del formulario de contacto', () => {
  // El cliente retiene el envio hasta superar el minimo del antispam (3 s), asi
  // que estas pruebas tardan lo suyo por diseno.
  test.slow()

  test('el valor del campo trampa viaja en la peticion', async ({ page }) => {
    await page.goto('/es/contacto/')

    let cuerpo: Record<string, unknown> | null = null
    await page.route('**/api/contact', async (ruta) => {
      cuerpo = JSON.parse(ruta.request().postData() ?? '{}')
      await ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, reference: 'PRUEBA1', delivery: 'skipped' }),
      })
    })

    await rellenarMinimo(page)

    // Se rellena como lo haria un bot: por DOM, porque el campo esta fuera de la
    // pantalla y no se puede escribir en el como una persona.
    await page.locator('input[name="empresa_web"]').evaluate((campo) => {
      const input = campo as HTMLInputElement
      input.value = 'https://spam.example'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await page.locator('form button[type="submit"]').click()

    await expect.poll(() => cuerpo, { timeout: 15_000 }).not.toBeNull()

    const antispam = (cuerpo as unknown as { antispam: Record<string, unknown> }).antispam
    // Lo que fallaba: aqui llegaba '' aunque el campo tuviera contenido.
    expect(antispam.honeypot).toBe('https://spam.example')
  })

  test('sin rellenar el campo trampa, viaja vacio', async ({ page }) => {
    await page.goto('/es/contacto/')

    let cuerpo: Record<string, unknown> | null = null
    await page.route('**/api/contact', async (ruta) => {
      cuerpo = JSON.parse(ruta.request().postData() ?? '{}')
      await ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, reference: 'PRUEBA2', delivery: 'skipped' }),
      })
    })

    await rellenarMinimo(page)
    await page.locator('form button[type="submit"]').click()

    await expect.poll(() => cuerpo, { timeout: 15_000 }).not.toBeNull()

    // La otra mitad: una persona que no ve el campo no debe quedar marcada.
    const antispam = (cuerpo as unknown as { antispam: Record<string, unknown> }).antispam
    expect(antispam.honeypot).toBe('')
  })
})
