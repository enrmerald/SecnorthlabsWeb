# isnlabs-site

Sitio publico de **ISN Labs** (*Innovation and Security North Labs SL*). Next.js
16 con App Router, **exportado por completo** (`output: 'export'`) y publicado
por Netlify como ficheros estaticos.

Implementa `ISNLA-DOC-0008-01` (plan de implementacion, revision 01-d).

## La regla que explica todo lo demas

**En produccion no corre ningun runtime de Next.** El artefacto `out/` contiene
solo HTML, CSS, JavaScript, imagenes y fuentes. Todo el computo -motor de la
calculadora PBCG, acceso a EspoCRM, SMTP y bandeja de salida- vive en el **Web
Gateway**, que es otro despliegue y, en cuanto se separen los repositorios, otro
repositorio.

De ahi salen las tres consecuencias que hay que tener presentes al escribir
codigo aqui:

1. **No existe `'use server'`, ni `app/api/`, ni `route.ts`, ni `middleware.ts`,
   ni `cookies()`.** `pnpm verify:architecture` falla el build si aparecen.
2. **Este repositorio no contiene ni una tarifa ni un coeficiente del modelo
   economico.** Ni en codigo, ni en JSON, ni en comentarios, ni en tests.
   `pnpm verify:export` inspecciona `out/` en cada build para comprobarlo.
3. **Este repositorio no contiene ningun secreto.** El navegador llama a
   `/api/…`, del mismo origen, y Netlify lo proxifica firmado hacia el gateway.

## Requisitos

| Elemento | Version | Donde se fija |
|---|---|---|
| Node.js | 24.18.0 | `.nvmrc`, `engines.node`, `NODE_VERSION` de Netlify |
| pnpm | 11.5.0 | `packageManager`, `engines.pnpm` |
| Next.js | 16.2.12 | `package.json`, sin rango |

Las versiones se fijan **exactas, sin `^` ni `~`**. Un plan que no fija versiones
deja de ser reproducible en tres meses.

```bash
corepack enable
corepack prepare pnpm@11.5.0 --activate
pnpm install --frozen-lockfile
```

## Comandos

```bash
pnpm dev                    # servidor de desarrollo
pnpm build                  # clean + images + next build + verify:export -> out/
pnpm preview                # sirve out/ como lo hara Netlify

pnpm lint                   # eslint . --max-warnings=0
pnpm typecheck              # tsc --noEmit
pnpm test                   # vitest
pnpm test:e2e               # playwright, contra out/

pnpm check:i18n             # paridad estructural ES/EN
pnpm check:routes           # manifiesto de rutas coherente
pnpm check:age              # cadena de suministro: nada publicado hace < 24 h
pnpm verify:architecture    # sin codigo de servidor en el repositorio
pnpm verify:export          # sin filtraciones en el artefacto
```

`next lint` **se elimino en Next 16** y `next build` ya no ejecuta el linter: hay
que invocar ESLint directamente, que es lo que hace `pnpm lint`.

## Estructura

```text
site/
├── assets/images/       originales, FUERA de public/, procesados en build
├── e2e/                 Playwright
├── messages/            es.json y en.json - todo el copy visible
├── scripts/             clean, images, y los verificadores de arquitectura
├── src/
│   ├── app/[locale]/    App Router. Una sola ruta atrapatodo, por manifiesto
│   ├── components/
│   │   ├── blocks/      bloques de pagina, reciben todo por props
│   │   ├── layout/      Navbar y Footer
│   │   └── ui/          Button, Tag, Card, Kicker, CheckList, Breadcrumbs
│   ├── config/routes.ts UNICA fuente de rutas: nav, pie, sitemap, E2E
│   ├── i18n/            carga de mensajes en build
│   └── lib/             metadatos, datos de empresa, cliente de la API
└── next.config.ts       output: 'export'
```

## Convenciones

- **Server Component de build por defecto**; `'use client'` solo cuando hay
  interaccion real (menu movil, formularios, calculadora). Es lo que decide
  cuanto JavaScript acaba en el navegador.
- **Ningun literal de copy en el JSX.** Todo sale de `messages/{es,en}.json`, y
  los dos ficheros deben tener la misma estructura (`pnpm check:i18n`).
- **Todo color sale de un token de `@theme`.** Prohibido el literal suelto tipo
  `text-[#00ffff]`, y prohibido inventarse una clase que no existe.
- **Codigo, comentarios y nombres en espanol**, como el resto del proyecto.
- **Un commit por paso.** No mezclar migracion, rutas y funcionalidad.
