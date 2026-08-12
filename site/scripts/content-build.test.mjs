import { execFileSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Solo se compilan los idiomas activos (IDIOMAS_ACTIVOS): con el ingles
// retirado, content/blog/en/ sigue en disco pero blog.json no lo refleja.
const { IDIOMAS_ACTIVOS, LOCALES, PREFIJO_URL } = await import(
  pathToFileURL(join(root, 'src', 'config', 'routes.ts')).href
)

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
    const slugs = IDIOMAS_ACTIVOS.flatMap((locale) => compilado[locale] ?? []).map(
      (articulo) => articulo.slug,
    )

    expect(slugs).not.toContain('README')
    for (const slug of slugs) expect(slug.startsWith('_')).toBe(false)
  })

  it('publica un articulo por cada .md que no sea borrador ni documentacion', async () => {
    const compilado = JSON.parse(
      await readFile(join(root, 'src', 'generated', 'blog.json'), 'utf8'),
    )

    for (const locale of IDIOMAS_ACTIVOS) {
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

  // Los dos casos siguientes son de corpus y no dependen de como este escrita la
  // guardia: seguirian fallando aunque alguien la desactivara. Fijan el estado
  // en el que 108 enlaces `/es/…` convivieron con un `content:build · OK`.
  it('ningun .md enlaza con un prefijo de idioma que no sea el suyo', async () => {
    for (const locale of IDIOMAS_ACTIVOS) {
      const dir = join(root, 'content', 'blog', locale)
      const ficheros = (await readdir(dir)).filter((f) => f.endsWith('.md') && f !== 'README.md')

      // Prefijos de los DEMAS idiomas del catalogo, mas el propio si es la raiz:
      // con PREFIJO_URL.es === '' un `/es/…` nunca es correcto en espanol.
      const prohibidos = LOCALES.filter((otro) => PREFIJO_URL[otro] !== `/${locale}`)

      for (const fichero of ficheros) {
        const texto = await readFile(join(dir, fichero), 'utf8')
        for (const prefijo of prohibidos) {
          expect(texto, `content/blog/${locale}/${fichero}`).not.toContain(`](/${prefijo}/`)
        }
      }
    }
  })

  it('el HTML compilado no lleva enlaces con prefijo de idioma inactivo', async () => {
    const compilado = JSON.parse(
      await readFile(join(root, 'src', 'generated', 'blog.json'), 'utf8'),
    )
    const validos = new Set(
      IDIOMAS_ACTIVOS.filter((locale) => PREFIJO_URL[locale] === `/${locale}`),
    )

    for (const locale of IDIOMAS_ACTIVOS) {
      for (const articulo of compilado[locale] ?? []) {
        for (const otro of LOCALES) {
          if (validos.has(otro)) continue
          expect(articulo.html, `${locale}/${articulo.slug}`).not.toContain(`href="/${otro}/`)
        }
      }
    }
  })
})
