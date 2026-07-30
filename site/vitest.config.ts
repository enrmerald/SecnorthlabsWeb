import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'pbcg/**/*.test.ts',
      'netlify/**/*.test.ts',
      'scripts/**/*.test.mjs',
    ],
    // El motor PBCG vive en pbcg/, fuera de src/, y solo lo ejecuta la Netlify
    // Function. `verify:architecture` falla si algo de src/ lo importa: es lo
    // unico que impide que las tarifas acaben en el navegador (B01).
    exclude: ['node_modules/**', 'out/**', '.next/**', 'e2e/**'],
    passWithNoTests: true,
  },
})
