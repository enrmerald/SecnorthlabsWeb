import { z } from 'zod'

/**
 * Esquema del front matter y forma de los articulos ya compilados.
 *
 * Es el contrato entre quien escribe un `.md` y el sitio. Se valida en build
 * (`content:build`), asi que un articulo mal escrito **rompe el build y no
 * llega a produccion**: es el equivalente, para el contenido, de lo que
 * `check:i18n` hace con los mensajes.
 */

/**
 * Categorias del blog. Son cerradas a proposito: las del blog anterior habian
 * crecido sin control -`ciberseguridad` y `cybersecurity` a la vez, `ot` y `OT`,
 * `info` como cajon de sastre y cinco articulos sin ninguna-, y una taxonomia
 * asi no sirve ni para filtrar ni para posicionar.
 *
 * Las etiquetas visibles viven en los mensajes (`blog.categories.*`), no aqui:
 * el sitio es bilingue y `check:i18n` verifica que existan en los dos idiomas.
 */
export const CATEGORIAS = ['cumplimiento', 'mssp', 'ot', 'cloud', 'tendencias', 'idi'] as const
export type Categoria = (typeof CATEGORIAS)[number]

/** Palabras por minuto para el tiempo de lectura. Es una estimacion, no un dato. */
export const PALABRAS_POR_MINUTO = 200

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'solo minusculas, digitos y guiones simples')

/**
 * Limites de longitud: los duros hacen fallar el build, porque un titulo vacio o
 * una descripcion de 600 caracteres son errores. Los blandos (los optimos de
 * SEO) solo avisan, porque recortar un titulo publicado por dos caracteres no
 * justifica bloquear un despliegue. Los avisos los imprime `content:build`.
 */
export const OPTIMO_SEO = {
  titleSeo: 65,
  descriptionSeo: 160,
} as const

export const FrontMatterSchema = z.strictObject({
  // El minimo es bajo a proposito: hay titulos legitimamente cortos, como
  // "NDR en OT". Lo que se persigue con el limite es el campo vacio.
  title: z.string().trim().min(6).max(140),
  /** El de la etiqueta `<title>`. Puede diferir del visible, y suele convenir. */
  titleSeo: z.string().trim().min(10).max(90),
  /** Bajo el `<h1>`. Opcional: no todos los articulos lo necesitan. */
  subtitle: z.string().trim().max(260).optional().default(''),
  /** Entradilla visible en la tarjeta del listado y en la cabecera del articulo. */
  description: z.string().trim().min(20).max(500),
  /** La `meta description`. */
  descriptionSeo: z.string().trim().min(50).max(200),
  date: z.iso.datetime({ message: 'fecha ISO 8601 con zona, p. ej. 2026-05-08T09:00:00.000Z' }),
  category: z.enum(CATEGORIAS),
  // Se deduplican al validar: los alias de la migracion podian dejar el mismo
  // tema dos veces -"siem" y "siem-y-xdr" acababan los dos en "siem"- y en la
  // pagina se veria repetido.
  tags: z
    .array(slug)
    .max(12)
    .default([])
    .transform((valores) => [...new Set(valores)]),
  /**
   * Nombre de la imagen en `assets/images/`, **sin extension**: el pipeline de
   * `images:build` genera AVIF y WebP en siete anchos y el manifiesto resuelve
   * el resto. Vacio significa articulo sin imagen de cabecera, que es valido.
   */
  image: z.union([slug, z.literal('')]).default(''),
  /**
   * Texto alternativo. Vacio -el valor por defecto- marca la imagen como
   * decorativa (`alt=""`), que es lo correcto cuando la imagen no aporta
   * informacion que no este ya en el titular. Rellenarlo con el titulo del
   * articulo seria peor: un lector de pantalla lo leeria dos veces.
   */
  imageAlt: z.string().trim().max(180).optional().default(''),
  author: z.string().trim().min(2).max(80),
  /** URL en el blog anterior, para documentar la 301. Solo informativa. */
  originalUrl: z.string().url().optional(),
  /** `true` deja el articulo fuera del build: ni pagina, ni listado, ni sitemap. */
  draft: z.enum(['true', 'false']).optional().default('false'),
})

export type FrontMatter = z.output<typeof FrontMatterSchema>

/**
 * Lo que el listado necesita, y nada mas.
 *
 * Existe separado de `Articulo` por una razon concreta: el filtro por categoria
 * es un componente de cliente, y recibe esto como props. Si recibiera el
 * articulo completo, los 26 cuerpos en HTML viajarian al navegador en el payload
 * de la pagina -unos cientos de kilobytes- para pintar seis botones.
 */
export interface ArticuloIndice {
  slug: string
  title: string
  description: string
  date: string
  category: Categoria
  tags: string[]
  image: string
  imageAlt: string
  readingMinutes: number
}

/** Entrada del indice de contenidos: un `h2` del articulo con su ancla. */
export interface EntradaIndice {
  id: string
  text: string
}

/** Un articulo completo, con el cuerpo ya convertido a HTML en build. */
export interface Articulo extends ArticuloIndice {
  subtitle: string
  titleSeo: string
  descriptionSeo: string
  author: string
  originalUrl?: string
  /** Vacio si el articulo tiene menos de cuatro secciones. */
  indice: EntradaIndice[]
  html: string
}

/** Lo que emite `content:build`. Una clave por idioma. */
export interface BlogCompilado {
  es: Articulo[]
  en: Articulo[]
}
