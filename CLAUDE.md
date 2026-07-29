# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estructura del repositorio

Dos carpetas y una raiz, sin workspace que las una:

- **`site/`** - **todo el sitio**. Next.js 16 (App Router) con `output: 'export'`,
  las 32 paginas estaticas, las dos Netlify Functions de ingestion y el motor
  PBCG. Aqui ocurre todo el desarrollo.
- **`contracts/`** - contrato de ingestion, mapeo de enums y los vectores de oro
  del PBCG, compartidos con el servicio local de importacion, que es externo a
  este repositorio.
- **`docs/`** - especificacion (`ISNLA-DOC-XXXX-YY-...`). No se compila.
  **`docs/*.xlsx` esta en `.gitignore`**: contiene tarifas y datos reales de
  clientes. Y `docs/*-metadata-*.md`, que puede llevar claves de API.
- **`index.html`** (raiz) - pagina «En Construccion». Es lo que sirve el dominio
  hoy. No comparte codigo con nada.
- **`claves/`** - material criptografico. **Nunca en git** (ver `.gitignore`).

### Dentro de `site/`

```text
site/
├── src/                  Next.js. NO puede importar de pbcg/ ni de netlify/
├── netlify/functions/    quote.ts y contact.ts. Netlify las despliega aparte
├── pbcg/                 motor + 59 tests + CLI. Solo lo ejecuta la funcion
├── content/blog/         los articulos, en Markdown: es/ y en/
├── assets/images/        originales de las imagenes. NO se publican tal cual
├── messages/             es.json y en.json
├── e2e/                  512 pruebas en cuatro anchuras
└── netlify.toml
```

### El blog se escribe en Markdown, y se compila en build

Un articulo es **un fichero** en `content/blog/<idioma>/<slug>.md`; el nombre del
fichero es la URL. `content:build` valida la cabecera con zod, convierte el
Markdown a HTML y emite `src/generated/blog.json`, que es lo unico que leen las
paginas.

El conversor (`markdown-it`) **se queda en el build**: no viaja al navegador, asi
que publicar veinte articulos mas no mueve el presupuesto de `check:js`. El mismo
patron que `images:build`: fuente en `content/`, salida en `src/generated/`.

`content:build` falla el build si una cabecera esta mal, si una imagen del cuerpo
no sale de `assets/images/`, si queda un shortcode de Hugo sin convertir o si un
enlace interno apunta a un articulo que no existe. El flujo completo de autoria
esta en `site/content/blog/README.md`.

**La regla que sostiene todo lo demas:** `verify:architecture` falla el build si
un fichero de `src/` importa de `pbcg/` o de `netlify/`. Es lo unico que impide
que las tarifas del modelo economico acaben en el navegador (bloqueante B01), y
sustituye a la garantia que daba tener el motor en otro repositorio.

### Lo que ya no existe

- **`web/`** - la SPA de Vite. Eliminada: su texto legal esta portado palabra por
  palabra (98 de 101 cadenas identicas; las 3 restantes eran los enlaces «volver
  al inicio», sustituidos por migas de pan) y su inventario de URLs quedo
  recogido en las redirecciones de `netlify.toml`. Sigue en el commit de baseline
  `dba82ef` si hace falta consultarla.
- **`gateway/`** - el Web Gateway publico con Fastify. Cancelado por
  ISNLA-DOC-0008-MIG-02: EspoCRM no se expone, y la ingestion pasa por correo
  cifrado con un importador local. El motor se movio a `site/pbcg/`.

## Comandos

Cada carpeta se instala y compila de forma independiente con **pnpm 11.5.0** (Node 24.18.0, ambos fijados en `packageManager`/`engines`).

### `site/`
```bash
cd site
pnpm install --frozen-lockfile
pnpm dev              # next dev
pnpm build            # clean → images:build → next build → verify:export (encadenado, no llamar next build directo si se quiere el artefacto completo)
pnpm preview           # sirve out/ generado, sin servidor Next (no existe next start: output es 'export')
pnpm lint              # eslint . --max-warnings=0 (next lint no existe en Next 16)
pnpm typecheck         # tsc --noEmit
pnpm test              # vitest run
pnpm test:e2e          # playwright test
pnpm check:i18n        # es.json / en.json deben tener las mismas claves
pnpm check:routes      # ningún RouteId sin registrar, ningún slug duplicado por idioma
pnpm verify:architecture   # falla si aparece código de servidor (route.ts, middleware.ts, 'use server', etc.)
```

### `gateway/`
```bash
cd gateway
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test              # incluye el "caso de oro" del Excel: 7.5 h/mes → 840 €, horquilla 815–900 €/mes
```
Sin `dev`/`start` todavía: no hay servidor HTTP implementado (ver estado abajo).

### `web/` (legado, referencia)
```bash
cd web
npm install
npm run dev / build / lint / preview
```

No hay CI ni framework de tests unificado entre carpetas.

## Arquitectura de `site/` (Next.js, `output: 'export'`)

**Una sola ruta física resuelve las 15 páginas del sitio.** `src/app/[locale]/[[...slug]]/page.tsx` es un catch-all con `generateStaticParams()` y `dynamicParams = false` (obligatorio con exportación estática). No hay un `page.tsx` por sección: el contenido real vive en `src/paginas/` (Home, Mssp, Grc, Catalogos, Software, Sectores, Compania, Contacto, Blog, Legales, NoEncontrada), y `src/paginas/registro.tsx` mapea cada `RouteId` a su componente renderer.

**`src/config/routes.ts` es el manifiesto central de rutas** - única fuente de verdad, consumida por navegación, pie, selector de idioma, `generateStaticParams`, metadatos, sitemap y breadcrumbs. Define 15 `RouteId` (home, mssp, msspIt, msspOt, grc, grcCatalog, software, sectors, company, contact, calculator, blog, privacy, legal, cookies, notFound) con slugs **traducidos** por idioma (`/es/soluciones/mssp/` ↔ `/en/solutions/mssp/`). No añadas una ruta sin registrarla aquí; `check:routes` falla si no coincide.

**i18n vive bajo `/es/` y `/en/`, nunca en `/`.** No hay detección de `Accept-Language`, ni cookie de idioma, ni redirección por ubicación - el idioma solo cambia con acción explícita del usuario. `src/i18n/mensajes.ts` + `request.ts` (next-intl) cargan `messages/es.json` y `messages/en.json`; ambos deben mantener el mismo árbol de claves (verificado por `check:i18n`).

**La calculadora PBCG (ruta `calculator`) está registrada pero sin implementar.** En `registro.tsx` apunta al renderer genérico `EnConstruccion` (placeholder). El motor de cálculo ya existe y está probado en `gateway/`, pero la UI cliente en `site/` es la pieza pendiente de la Fase 5.

**Regla dura de arquitectura, con enforcement automático:** nada de `'use server'`, `app/api/`, `route.ts`, `middleware.ts`, `proxy.ts`, `runtime = 'nodejs'|'edge'`, `output: 'standalone'`, `cookies()`, `revalidatePath/Tag()`, ni `import 'server-only'` en `site/`. `scripts/assert-static-architecture.mjs` (invocado como `verify:architecture`) falla el build si encuentra cualquiera de estos. La regla de componentes es la inversa de la intuición común: usar el mínimo de Client Components (`'use client'` solo para interacción real - menú móvil, formularios, calculadora), y no desplegar ningún runtime en producción; Server Components de build no son "más peligrosos", son los que generan HTML sin enviar JS.

**`netlify.toml` todavía no existe** en ningún sitio del repo, pese a que `next.config.ts` ya delega ahí `redirects`/`rewrites`/`headers` (no soportados con `output: 'export'`). Es un hueco pendiente antes de poder desplegar.

## Arquitectura de `gateway/`

**Motivo de existir:** si el modelo económico del PBCG viviera en `site/`, Netlify lo compilaría dentro del JavaScript público - tarifas, coeficientes y el algoritmo completo quedarían legibles por cualquier visitante, y la puerta de captación de leads sería evitable abriendo las devtools. La separación en un repositorio/servidor sin conexión a Netlify es la mitigación (bloqueante B01 del plan).

**Estado real (no confundir con el plan aspiracional):**

| Pieza | Estado |
|---|---|
| Motor PBCG (`src/domain/pbcg/`: `calculate.ts`, `config.ts`, `schemas.ts`, `types.ts`) | ✅ Implementado y probado contra el "caso de oro" del Excel |
| Bandeja de salida (`submission` + `delivery_job`, SQLite) | ⬜ Pendiente - sin código ni dependencia todavía |
| Servidor Fastify + verificación de firma de Netlify | ⬜ Pendiente - **no hay Fastify instalado ni ningún endpoint HTTP** |
| Adaptador de EspoCRM | ⛔ Bloqueado por pendientes de negocio (rol/equipo, campos, duplicados) |

**Reglas que no se negocian** (de `gateway/README.md`):
1. El repositorio del sitio no contiene ninguna tarifa ni coeficiente - ni en código, JSON, comentarios o tests. `site/`'s `verify:export` lo comprueba en cada build.
2. El gateway recalcula siempre; no confía en ningún total, horquilla ni número de horas que llegue del navegador.
3. La respuesta al cliente es solo el `PublicQuoteDto` (vía `toPublicDto()`) - nunca coeficientes, desglose de horas internas, tarifa efectiva ni margen.
4. De la hoja `PARAMETROS` del Excel no se porta coste interno (`B7`, `B8`); de `CALCULADORA` no se portan tarifa efectiva (`E29`) ni margen bruto (`E30`).
5. Ningún dato personal en los logs - solo `requestId` y `submission.id`.

## Idioma del proyecto

El código, comentarios, nombres de componentes y ficheros están en español. Mantén esa convención al añadir código, en cualquiera de las carpetas.
