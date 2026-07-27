import { defineConfig, devices } from '@playwright/test'

// Las E2E se ejecutan contra el artefacto real (out/ servido por
// scripts/static-server.mjs), no contra `next dev`. Es la unica forma de
// comprobar lo que la Fase 12.5 pide: que el HTML esta completo sin JavaScript
// y que no hay ningun computo detras.
const PORT = 4173
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  webServer: {
    command: 'node scripts/static-server.mjs out',
    url: `${baseURL}/es/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  // Matriz de anchuras obligatoria de la seccion 1.6. El resto (360, 375, 414,
  // 820, 1280) se comprueban con page.setViewportSize dentro de las pruebas de
  // movil, para no multiplicar por diez toda la bateria.
  projects: [
    { name: 'movil-320', use: { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } } },
    { name: 'movil-390', use: { ...devices['iPhone 13'] } },
    { name: 'tablet-768', use: { ...devices['iPad Mini'] } },
    { name: 'escritorio-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
})
