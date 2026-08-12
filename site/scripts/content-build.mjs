// content:build - compila content/blog/**/*.md a src/generated/blog.json.
//
// Por que un script de build y no leer los .md desde los componentes:
//
//   1. El conversor de Markdown se queda **fuera del arbol de React**. Nada de
//      markdown-it llega al navegador, y el presupuesto de JavaScript de
//      `check:js` no se mueve ni un byte al publicar veinte articulos mas.
//   2. El contenido se valida una vez, en un sitio, y un articulo mal escrito
//      rompe el build con fichero y linea en lugar de renderizar una pagina a
//      medias.
//   3. Es el mismo patron que `images:build`: entrada en `content/`, salida
//      generada en `src/generated/`, y las paginas solo consumen el resultado.
//
// Se ejecuta antes de `next build`, igual que el pipeline de imagenes.
import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import MarkdownIt from 'markdown-it'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(root, 'content', 'blog')
const imagesDir = join(root, 'assets', 'images')
const salida = join(root, 'src', 'generated', 'blog.json')

// Los dos modulos son TypeScript y los carga el type stripping nativo de Node
// 24, como ya hace check:routes con el manifiesto de rutas: una sola definicion
// del contrato, sin duplicarla en JavaScript para el script de build.
const { separarFrontMatter } = await import(
  pathToFileURL(join(root, 'src', 'lib', 'blog', 'frontmatter.ts')).href
)
const { FrontMatterSchema, PALABRAS_POR_MINUTO, OPTIMO_SEO } = await import(
  pathToFileURL(join(root, 'src', 'lib', 'blog', 'esquema.ts')).href
)
const {
  IDIOMAS_ACTIVOS,
  MULTIIDIOMA,
  ROUTES,
  LOCALES: LOCALES_CATALOGO,
} = await import(pathToFileURL(join(root, 'src', 'config', 'routes.ts')).href)
const { revisarEnlacesInternos } = await import(
  pathToFileURL(join(root, 'src', 'lib', 'blog', 'enlaces.ts')).href
)

// Solo se compilan los idiomas activos: los `.md` de content/blog/en/ se
// quedan en disco sin tocar mientras IDIOMAS_ACTIVOS sea ['es'] (interruptor
// de PLAN-solo-espanol.md), listos para recompilarse el dia que el ingles
// vuelva a activarse.
const LOCALES = IDIOMAS_ACTIVOS
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const exists = async (path) => access(path).then(() => true, () => false)

/** @type {string[]} */
const errores = []
/** @type {string[]} */
const avisos = []

// ── Markdown ─────────────────────────────────────────────────────────────────
// `html: false` es una decision de seguridad, no de estilo: el HTML crudo de un
// .md se escapa en lugar de inyectarse, asi que el cuerpo que acaba en
// dangerouslySetInnerHTML solo puede contener lo que genere este conversor.
const md = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: false })

const anclas = new Map()
/** Encabezados de segundo nivel del articulo en curso, para el indice. @type {{id: string, text: string}[]} */
let indice = []

md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const texto = tokens[idx + 1]?.content ?? ''
  const base = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // Dos secciones pueden llamarse igual dentro del mismo articulo, y dos ids
  // iguales rompen el enlace profundo en silencio.
  const visto = anclas.get(base) ?? 0
  anclas.set(base, visto + 1)
  const id = visto === 0 ? base : `${base}-${visto + 1}`
  tokens[idx].attrSet('id', id)

  // Solo los h2 entran en el indice: con h3 y h4 se convierte en una segunda
  // tabla de contenidos tan larga como el articulo.
  if (tokens[idx].tag === 'h2' && base) indice.push({ id, text: texto })

  return self.renderToken(tokens, idx, options)
}

const enlaceOriginal = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) =>
  self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') ?? ''
  if (/^https?:\/\//i.test(href)) {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
  }
  return enlaceOriginal(tokens, idx, options, env, self)
}

// Una tabla ancha rompe el ancho de la pagina en movil (seccion 1.6). El scroll
// se contiene en su propio envoltorio, no en el body.
//
// El envoltorio lleva `tabindex="0"` y nombre accesible porque una region con
// scroll que no se puede enfocar no se puede desplazar con el teclado: quien no
// use raton no llega a las columnas de la derecha.
const ETIQUETA_TABLA = { es: 'Tabla', en: 'Table' }
let etiquetaTabla = ETIQUETA_TABLA.es

md.renderer.rules.table_open = () =>
  `<div class="tabla-scroll" tabindex="0" role="region" aria-label="${etiquetaTabla}">\n<table>\n`
md.renderer.rules.table_close = () => '</table>\n</div>\n'

// ── Compilacion ──────────────────────────────────────────────────────────────
/** @type {Record<string, unknown[]>} */
const compilado = { es: [], en: [] }

for (const locale of LOCALES) {
  etiquetaTabla = ETIQUETA_TABLA[locale]
  const dir = join(contentDir, locale)
  if (!(await exists(dir))) {
    avisos.push(`content/blog/${locale}/ no existe todavia`)
    continue
  }

  // Cada `.md` es un articulo, salvo la documentacion del propio directorio:
  // `README.md` explica el flujo de autoria y el estado de las traducciones, y no
  // es una pagina del blog. Se ignora tambien lo que empiece por `_`, que es la
  // convencion habitual para borradores y notas que no se publican.
  const ficheros = (await readdir(dir))
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && !f.startsWith('_'))
    .sort()

  for (const fichero of ficheros) {
    const ruta = `content/blog/${locale}/${fichero}`
    const slug = fichero.replace(/\.md$/, '')

    if (!SLUG.test(slug)) {
      errores.push(`${ruta} · el nombre del fichero es el slug de la URL: ${slug}`)
      continue
    }

    let separado
    try {
      separado = separarFrontMatter(await readFile(join(dir, fichero), 'utf8'), ruta)
    } catch (error) {
      errores.push(String(error.message ?? error))
      continue
    }

    const analizado = FrontMatterSchema.safeParse(separado.datos)
    if (!analizado.success) {
      for (const problema of analizado.error.issues) {
        errores.push(`${ruta} · ${problema.path.join('.') || '(raiz)'}: ${problema.message}`)
      }
      continue
    }

    const meta = analizado.data
    if (meta.draft === 'true') {
      avisos.push(`${ruta} · borrador: no se publica`)
      continue
    }

    // Shortcodes de Hugo. El blog anterior los usaba para figuras con pie, y
    // aqui no significan nada: markdown-it los dejaria tal cual, con las llaves
    // visibles en medio del articulo. Se convierten a Markdown al migrar.
    const shortcode = /\{\{[<%]\s*(\w+)/.exec(separado.cuerpo)
    if (shortcode) {
      errores.push(
        `${ruta} · shortcode de Hugo sin convertir: {{< ${shortcode[1]} ... >}}. ` +
          'Usa Markdown: ![alt](/img/<nombre>-<ancho>.webp) y el pie en cursiva debajo',
      )
      continue
    }

    if (separado.cuerpo.length < 400) {
      errores.push(`${ruta} · el cuerpo tiene ${separado.cuerpo.length} caracteres: parece vacio`)
      continue
    }

    const disponibles = (await readdir(imagesDir)).map((f) => f.replace(/\.[^.]+$/, ''))

    if (meta.image && !disponibles.includes(meta.image)) {
      errores.push(`${ruta} · image: "${meta.image}" no existe en assets/images/`)
    }

    // Imagenes dentro del cuerpo. Dos de los articulos migrados apuntaban a
    // `/blog/images/...`, la ruta del blog anterior, que en este sitio es un 404:
    // el articulo se veia bien salvo por dos huecos donde deberia haber una
    // captura. Ahora eso rompe el build en lugar de publicarse.
    for (const [, destino] of separado.cuerpo.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
      if (destino.startsWith('/img/')) {
        const nombre = destino.replace(/^\/img\//, '').replace(/-\d+\.(avif|webp)$/, '')
        if (!disponibles.includes(nombre)) {
          errores.push(`${ruta} · la imagen ${destino} no sale de assets/images/`)
        }
        continue
      }
      if (destino.startsWith('http')) continue
      errores.push(
        `${ruta} · imagen con ruta no valida: ${destino}. ` +
          'Las imagenes del cuerpo van en assets/images/ y se enlazan como /img/<nombre>-<ancho>.webp',
      )
    }

    // Avisos de SEO: no bloquean, pero se ven en cada build.
    if (meta.titleSeo.length > OPTIMO_SEO.titleSeo) {
      avisos.push(
        `${ruta} · titleSeo de ${meta.titleSeo.length} caracteres (optimo <= ${OPTIMO_SEO.titleSeo})`,
      )
    }
    if (meta.descriptionSeo.length > OPTIMO_SEO.descriptionSeo) {
      avisos.push(
        `${ruta} · descriptionSeo de ${meta.descriptionSeo.length} caracteres (optimo <= ${OPTIMO_SEO.descriptionSeo})`,
      )
    }

    anclas.clear()
    indice = []
    const html = md.render(separado.cuerpo)
    const palabras = separado.cuerpo.split(/\s+/).filter(Boolean).length

    compilado[locale].push({
      slug,
      title: meta.title,
      titleSeo: meta.titleSeo,
      subtitle: meta.subtitle,
      description: meta.description,
      descriptionSeo: meta.descriptionSeo,
      date: meta.date,
      category: meta.category,
      tags: meta.tags,
      image: meta.image,
      imageAlt: meta.imageAlt,
      author: meta.author,
      ...(meta.originalUrl ? { originalUrl: meta.originalUrl } : {}),
      readingMinutes: Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO)),
      // Un indice de tres entradas no ayuda a nadie y ocupa una columna: por
      // debajo de cuatro secciones, el articulo se lee de arriba abajo.
      indice: indice.length >= 4 ? indice : [],
      html,
    })
  }

  // Mas reciente primero: es el orden del listado y el de la portada del blog.
  compilado[locale].sort((a, b) => b.date.localeCompare(a.date))
}

// ── Enlaces internos entre articulos ────────────────────────────────────────
// El caso que esto atrapa es concreto y facil de cometer: al traducir un
// articulo se traducen tambien sus enlaces (`/es/blog/x/` -> `/en/blog/x/`), y si
// `x` todavia no esta traducido, el articulo ingles apunta a un 404. No se ve
// hasta que alguien lo pulsa.
// Mientras la traduccion avanza, un articulo ingles enlaza a otros que quiza no
// esten traducidos todavia. Hay tres formas de tratarlo y solo una es aceptable:
//
//   - Dejar el enlace roto: produce 404 en produccion. Descartada.
//   - Romper el build: bloquearia el blog entero hasta tener los 23 traducidos,
//     y ademas volveria a bloquearlo cada vez que se escriba un articulo nuevo
//     antes de traducirlo. Descartada.
//   - Reescribir el enlace al idioma en el que ese articulo SI existe. El lector
//     llega al contenido -en el otro idioma, pero llega- y en cuanto la
//     traduccion aparezca, el enlace vuelve a su idioma sin tocar nada.
//
// Se aplica la tercera, y cada reescritura se registra: si la lista crece y no
// baja, es que la traduccion se ha quedado parada.
//
// La validacion vive en `src/lib/blog/enlaces.ts` y va **contra el manifiesto**,
// no contra un prefijo escrito aqui. Antes habia una constante `PREFIJO_BLOG`
// copiada de `ROUTES`, y esa copia es la que causo el incidente: al pasar el
// espanol a la raiz se actualizo la copia, los `.md` se quedaron con sus `/es/…`
// y la regex dejo de casar con un solo enlace, en silencio. De paso, ahora se
// revisan tambien los enlaces a paginas fijas -`/compania/`, `/contacto/`…-, que
// eran dos tercios del total y no los miraba nadie.
let reescritos = 0

const slugsPorIdioma = Object.fromEntries(
  LOCALES_CATALOGO.map((locale) => [
    locale,
    new Set((compilado[locale] ?? []).map((articulo) => articulo.slug)),
  ]),
)

for (const locale of LOCALES) {
  for (const articulo of compilado[locale]) {
    const revision = revisarEnlacesInternos({
      html: articulo.html,
      locale,
      origen: `content/blog/${locale}/${articulo.slug}.md`,
      slugsPorIdioma,
      manifiesto: { rutas: ROUTES, locales: LOCALES_CATALOGO },
    })
    articulo.html = revision.html
    reescritos += revision.reescrituras
    errores.push(...revision.errores)
  }
}

if (reescritos > 0) {
  avisos.push(`${reescritos} enlace(s) interno(s) apuntan al otro idioma por falta de traduccion`)
}

// Un articulo traducido que no exista en espanol no tendria alternativa de
// idioma ni canonical coherente. Al reves si vale: el ingles va por detras.
//
// Con el ingles retirado (!MULTIIDIOMA) no se compila content/blog/en/, asi
// que esta comprobacion y el aviso de abajo no dirian nada util -saldrian
// vacia y a maximo respectivamente- y se saltan.
if (MULTIIDIOMA) {
  for (const articulo of compilado.en) {
    if (!compilado.es.some((otro) => otro.slug === articulo.slug)) {
      errores.push(`content/blog/en/${articulo.slug}.md · no existe la version en espanol`)
    }
  }

  const sinTraducir = compilado.es.filter(
    (articulo) => !compilado.en.some((otro) => otro.slug === articulo.slug),
  )
  if (sinTraducir.length > 0) {
    avisos.push(`${sinTraducir.length} articulo(s) sin version en ingles`)
  }
}

if (errores.length > 0) {
  console.error('content:build · FALLO\n')
  for (const error of errores) console.error(`  ${error}`)
  console.error('\nEl formato de la cabecera esta documentado en content/blog/README.md')
  process.exit(1)
}

await mkdir(dirname(salida), { recursive: true })
await writeFile(salida, `${JSON.stringify(compilado, null, 2)}\n`, 'utf8')

for (const aviso of avisos) console.log(`content:build · aviso · ${aviso}`)
console.log(
  `content:build · OK · ${compilado.es.length} articulo(s) en espanol, ${compilado.en.length} en ingles`,
)
