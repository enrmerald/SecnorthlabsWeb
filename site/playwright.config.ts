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
    // La Home, que es la raiz: el espanol se sirve sin prefijo. Con `/es/` esto
    // solo funcionaba porque la redireccion de legado lo llevaba hasta aqui, y
    // se quedaria colgado los 60 segundos el dia que esa regla se retire.
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  // Matriz de anchuras obligatoria de la seccion 1.6. El resto (360, 375, 414,
  // 820, 1280) se comprueban con page.setViewportSize dentro de las pruebas de
  // movil, para no multiplicar por diez toda la bateria.
  //
  // Todos los perfiles usan Chromium a proposito: es el unico navegador que
  // instala `playwright install chromium`, y hacer que la bateria por defecto
  // dependa de WebKit convierte cada ejecucion en un fallo de entorno que la
  // gente aprende a ignorar.
  //
  // ⚠️ Esto **no cubre Safari**, y varias de las reglas moviles del plan son
  // especificas de iOS: el zoom automatico al enfocar un input de menos de 16px
  // y el comportamiento de `env(safe-area-inset-*)`. Para comprobarlas hay que
  // instalar WebKit (`pnpm exec playwright install webkit`) y anadir su perfil,
  // o probar en un dispositivo real antes de publicar.
  projects: [
    {
      name: 'movil-320',
      use: { ...devices['Pixel 7'], viewport: { width: 320, height: 568 } },
    },
    { name: 'movil-390', use: { ...devices['Pixel 7'] } },
    {
      name: 'tablet-768',
      use: { ...devices['Galaxy Tab S4'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'escritorio-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
})
