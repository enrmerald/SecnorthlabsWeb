import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.mjs'],
    // El motor PBCG y su bateria de tests viven en gateway/, no aqui: el sitio
    // no contiene ni una tarifa (seccion 5.1).
    exclude: ['node_modules/**', 'out/**', '.next/**', 'e2e/**'],
    passWithNoTests: true,
  },
})
