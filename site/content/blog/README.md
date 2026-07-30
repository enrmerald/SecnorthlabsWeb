# Cómo se escribe un artículo del blog

Un artículo es **un fichero Markdown** en este directorio. No hay CMS, no hay
base de datos y no hay panel: se escribe, se revisa como cualquier otro cambio de
código y se publica con el despliegue. Es el mismo flujo que había en Hugo, con
el sistema de diseño de ISN Labs y las comprobaciones del sitio.

```text
content/blog/
├── es/<slug>.md      el artículo en español
└── en/<slug>.md      su traducción, con EL MISMO nombre de fichero
```

**El nombre del fichero es la URL.** `es/que-es-el-ens.md` se publica en
`/es/blog/que-es-el-ens/`. Cambiar el nombre de un fichero ya publicado cambia su
URL y pierde su posicionamiento, así que no se renombra: si hay que hacerlo, se
añade la redirección correspondiente en `netlify.toml`.

## Los cuatro pasos

1. **Crear el fichero** en `es/` con la cabecera de abajo.
2. **Poner la imagen** en `site/assets/images/` con el nombre `blog-<slug>.<ext>`
   (PNG, JPG o WebP). El pipeline genera AVIF y WebP en siete anchos; los
   originales no se publican tal cual.
3. **Traducir** el mismo fichero en `en/`, con el mismo nombre. Mientras no
   exista, el artículo simplemente no aparece en la versión inglesa del sitio y
   `content:build` lo avisa; nunca se publica una traducción automática.
4. **Comprobar** con `pnpm content:build`. Si algo falla, dice qué fichero, qué
   línea y qué campo.

## La cabecera

```markdown
---
title: "Qué es el ENS: definición, objetivos y por qué es obligatorio"
titleSeo: "ENS: qué es y por qué es obligatorio en España"
subtitle: "Una explicación clara para entender qué es el Esquema Nacional de Seguridad."
description: "Entradilla de la tarjeta del listado y de la cabecera del artículo."
descriptionSeo: "La meta description que se ve en Google. Entre 50 y 160 caracteres."
date: 2026-04-30T13:50:00.000Z
category: cumplimiento
tags: [ens, nis2, iso-27001]
image: blog-que-es-el-ens
imageAlt: ""
author: ISN Labs
originalUrl: https://ewala.es/blog/posts/que-es-el-ens/
draft: false
---

El cuerpo, en Markdown. Empieza directamente con el texto: el título ya lo pone
la página como `<h1>`, así que **no se repite como encabezado**.

## Las secciones van en h2

### Y las subsecciones en h3
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `title` | Sí | El titular visible. 6-140 caracteres |
| `titleSeo` | Sí | El de la pestaña y el resultado de Google. Óptimo ≤ 65 caracteres |
| `subtitle` | No | Bajo el `<h1>`. Máx. 260 |
| `description` | Sí | Entradilla visible. 20-500 |
| `descriptionSeo` | Sí | `meta description`. 50-200, óptimo ≤ 160 |
| `date` | Sí | ISO 8601 **con zona**: `2026-04-30T13:50:00.000Z` |
| `category` | Sí | Una de: `cumplimiento`, `mssp`, `ot`, `cloud`, `tendencias`, `idi` |
| `tags` | No | Lista en línea, en minúsculas y con guiones. Máx. 12 |
| `image` | No | Nombre en `assets/images/` **sin extensión** |
| `imageAlt` | No | Vacío = imagen decorativa (`alt=""`), que es lo correcto en una cabecera ilustrativa. No se rellena con el título: un lector de pantalla lo leería dos veces |
| `author` | Sí | |
| `originalUrl` | No | Solo para los artículos migrados. Informativo |
| `draft` | No | `true` deja el artículo fuera del sitio: ni página, ni listado, ni sitemap |

### El formato de la cabecera es un subconjunto de YAML, no YAML

Solo se admiten tres formas, y cualquier otra cosa **rompe el build a propósito**:

```markdown
clave: "texto entre comillas, admite : y , sin problema"
clave: escalar-sin-comillas
clave: [uno, dos, tres]
```

Nada de valores repartidos en varias líneas, ni listas con corchetes en líneas
distintas, ni comillas dentro de las listas. El motivo es que los ficheros que
venían del blog anterior traían tres variantes de cabecera y una no era ni YAML
válido: con un subconjunto estricto, una desviación es un error con fichero y
línea en lugar de un campo que llega vacío a producción.

## Lo que el pipeline hace por ti

- Convierte el Markdown a HTML **en build**. El conversor no viaja al navegador.
- Genera un `id` en cada encabezado, para poder enlazar a una sección.
- Construye el índice «En esta página» con los `h2`, si hay cuatro o más.
- Envuelve las tablas en un contenedor con scroll propio, para que una tabla
  ancha no rompa el ancho de la página en móvil.
- Abre los enlaces externos en otra pestaña con `rel="noopener noreferrer"`.
- Calcula el tiempo de lectura.
- Emite `BlogPosting`, `BreadcrumbList`, canónica, `hreflang` y Open Graph, y
  añade el artículo al `sitemap.xml`.

**El HTML crudo dentro del Markdown se escapa, no se interpreta.** Es una
decisión de seguridad: lo único que puede acabar en la página es el marcado que
genera el conversor.

## Comprobaciones antes de publicar

```bash
pnpm content:build     # cabeceras, imágenes, avisos de longitud SEO
pnpm test              # incluye los tests del contenido compilado
pnpm build             # incluye sitemap, robots y verify:export
pnpm check:js          # que el listado siga sin enviar JavaScript de más
```

## Enlazar entre artículos

Con rutas del propio sitio y barra final:

```markdown
Ver también [qué es el ENS](/es/blog/que-es-el-ens/).
```

En el fichero inglés, `/en/blog/...`. **No se enlaza al dominio anterior**: los
artículos migrados ya tienen sus enlaces internos reescritos.
