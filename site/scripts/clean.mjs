// Borra los artefactos de build. Se ejecuta al principio de `pnpm build` para
// que `verify:export` inspeccione siempre un out/ recien generado y no restos
// de una compilacion anterior.
import { rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

for (const dir of ['.next', 'out']) {
  await rm(join(root, dir), { recursive: true, force: true })
}

console.log('clean · .next y out eliminados')
