import { execFileSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Pruebas del pipeline de contenido ejecutandolo de verdad.
 *
 * Existen por un fallo concreto: al anadir un `README.md` con la documentacion
 * del directorio de traducciones, el pipeline lo trato como un articulo y rompio
 * el build entero con «el nombre del fichero es el slug de la URL: README». La
 * documentacion junto al contenido es lo normal, asi que el script tiene que
 * distinguir un articulo de una nota, y esto lo fija.
 */
describe('content:build', () => {
  it('compila el contenido real sin errores', () => {
    const salida = execFileSync(process.execPath, [join(root, 'scripts', 'content-build.mjs')], {
      cwd: root,
      encoding: 'utf8',
    })

    expect(salida).toContain('content:build · OK')
  })

  it('ignora README.md y los ficheros que empiezan por _', async () => {
    const compilado = JSON.parse(
      await readFile(join(root, 'src', 'generated', 'blog.json'), 'utf8'),
    )
    const slugs = [...compilado.es, ...compilado.en].map((articulo) => articulo.slug)

    expect(slugs).not.toContain('README')
    for (const slug of slugs) expect(slug.startsWith('_')).toBe(false)
  })

  it('publica un articulo por cada .md que no sea borrador ni documentacion', async () => {
    const compilado = JSON.parse(
      await readFile(join(root, 'src', 'generated', 'blog.json'), 'utf8'),
    )

    for (const locale of ['es', 'en']) {
      const ficheros = (await readdir(join(root, 'content', 'blog', locale))).filter(
        (f) => f.endsWith('.md') && f !== 'README.md' && !f.startsWith('_'),
      )

      const borradores = (
        await Promise.all(
          ficheros.map(async (f) => {
            const texto = await readFile(join(root, 'content', 'blog', locale, f), 'utf8')
            return /^draft:\s*true$/m.test(texto)
          }),
        )
      ).filter(Boolean).length

      expect(compilado[locale]).toHaveLength(ficheros.length - borradores)
    }
  })
})
