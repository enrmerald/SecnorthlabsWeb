# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estructura del repositorio

Una carpeta de codigo y varias de apoyo, sin workspace que las una:

- **`site/`** - **todo el sitio**. Next.js 16 (App Router) con `output: 'export'`,
  las 79 paginas estaticas, las dos Netlify Functions de ingestion y el motor
  PBCG. Aqui ocurre todo el desarrollo.
- **`contracts/`** - contrato de ingestion para EspoCRM, mapeo de enums y los
  vectores de oro del PBCG, compartidos con el servicio local de importacion, que
  es externo a este repositorio.
- **`docs/`** - especificacion (`ISNLA-DOC-XXXX-YY-...`). No se compila.
  **`docs/*.xlsx` esta en `.gitignore`**: contiene tarifas y datos reales de
  clientes. Y `docs/*-metadata-*.md`, que puede llevar claves de API.
- **`index.html`** (raiz) - pagina «En Construccion». Es lo que sirve el dominio
  hoy. No comparte codigo con nada y no entra en ningun build.
- **`Dockerfile` + `docker-compose.yml`** (raiz) - **servidor de revision
  interno**, no el despliegue. Compila `site/` dentro de la imagen y sirve `out/`
  mas las dos funciones con `scripts/static-server.mjs`. Va con
  `PREVIEW_NOINDEX=1` y sin claves de Resend, asi que los formularios calculan de
  verdad y avisan en pantalla de que no han registrado ni enviado nada.
  **Solo red interna**: lleva contenido sin aprobar y texto legal sin revisar.
- **`claves/`** - material criptografico. **Nunca en git** (ver `.gitignore`).

El despliegue de produccion lo hace **Netlify** desde `site/netlify.toml`.

### Dentro de `site/`

```text
site/
├── src/                  Next.js. NO puede importar de pbcg/ ni de netlify/
│   ├── app/              layout, la ruta atrapatodo, `/` y las dos 404
│   ├── components/       blocks · blog · calculadora · forms · layout · seo · ui
│   ├── config/           routes.ts (manifiesto) y logos.ts
│   ├── generated/        blog.json e images.json · SALIDA de build, no se edita
│   ├── i18n/             carga de mensajes (next-intl)
│   ├── lib/              navegacion, metadatos, jsonld, empresa, blog/, api/
│   └── paginas/          un renderizador por pagina + registro.tsx
├── netlify/functions/    quote.ts, contact.ts y _comun.ts. Netlify las despliega aparte
├── pbcg/                 motor economico + CLI. 37 pruebas. Solo lo ejecuta la funcion
├── content/blog/         los articulos, en Markdown: es/ y en/
├── assets/images/        originales de las imagenes. NO se publican tal cual
├── messages/             es.json y en.json
├── public/               logos, imagenes procesadas, sitemap, robots y reparto-idioma.js
├── scripts/              build, verificaciones y el servidor de `pnpm preview`
├── e2e/                  560 pruebas de Playwright en cuatro anchuras
└── netlify.toml          redirecciones, cabeceras y reparto por idioma
```

### El blog se escribe en Markdown, y se compila en build

Un articulo es **un fichero** en `content/blog/<idioma>/<slug>.md`; el nombre del
fichero es la URL. `content:build` valida la cabecera con zod, convierte el
Markdown a HTML y emite `src/generated/blog.json`, que es lo unico que leen las
paginas. Hoy hay **23 articulos publicados en cada idioma**.

El conversor (`markdown-it`) **se queda en el build**: no viaja al navegador, asi
que publicar veinte articulos mas no mueve el presupuesto de `check:js`. El mismo
patron que `images:build`: fuente en `content/`, salida en `src/generated/`.

`content:build` falla el build si una cabecera esta mal, si una imagen del cuerpo
no sale de `assets/images/`, si queda un shortcode de Hugo sin convertir o si un
enlace interno apunta a un articulo que no existe. El flujo completo de autoria
esta en `site/content/blog/README.md`.

### Lo que ya no existe

- **`web/`** - la SPA de Vite. Eliminada: su texto legal esta portado palabra por
  palabra (98 de 101 cadenas identicas; las 3 restantes eran los enlaces «volver
  al inicio», sustituidos por migas de pan) y su inventario de URLs quedo
  recogido en las redirecciones de `netlify.toml`. Sigue en el commit de baseline
  `dba82ef` si hace falta consultarla.
- **`gateway/`** - el Web Gateway publico con Fastify. Cancelado por
  ISNLA-DOC-0008-MIG-02: EspoCRM no se expone, y la ingestion pasa por correo
  cifrado con un importador local. El motor se movio a `site/pbcg/`.
  ⚠️ `site/pbcg/README.md` sigue redactado como si fuera aquel repositorio
  aparte: esta desactualizado, no lo tomes como estado actual.

## Comandos

Todo se instala y compila desde `site/` con **pnpm 11.5.0** (Node 24.18.0, ambos
fijados en `packageManager`/`engines`). No hay CI todavia.

```bash
cd site
pnpm install --frozen-lockfile

pnpm dev              # content:build → next dev
pnpm build            # clean → images:build → content:build → seo:build → next build → verify:export
pnpm preview          # sirve out/ con scripts/static-server.mjs (no existe `next start`: output es 'export')

pnpm lint             # eslint . --max-warnings=0 (`next lint` no existe en Next 16)
pnpm typecheck        # tsc --noEmit
pnpm test             # content:build → vitest run · 155 pruebas en 9 ficheros
pnpm test:e2e         # playwright test · 560 pruebas en cuatro anchuras, contra out/

pnpm check:i18n       # es.json y en.json, misma estructura de claves
pnpm check:routes     # ningun RouteId sin registrar, ningun slug duplicado por idioma
pnpm check:js         # presupuesto de JavaScript por pagina (techo 157 KB gzip)
pnpm check:age        # antiguedad de las dependencias
pnpm verify:architecture  # sin codigo de servidor y sin imports de pbcg/ ni netlify/ desde src/
pnpm verify:export        # inspecciona out/: artefacto completo y sin filtraciones

pnpm correos:preview  # escribe las plantillas de correo en .correos/ sin enviar nada
pnpm calcular         # CLI del motor PBCG
pnpm vectores         # regenera los vectores de oro de contracts/
```

`pnpm build` esta encadenado: no llames a `next build` directamente si quieres el
artefacto completo. Las pruebas e2e necesitan un `out/` recien construido.

## Arquitectura de `site/` (Next.js 16, `output: 'export'`)

**Una sola ruta fisica resuelve las 15 paginas del sitio.**
`src/app/[locale]/[[...slug]]/page.tsx` es un atrapatodo con
`generateStaticParams()` y `dynamicParams = false` (obligatorio con exportacion
estatica). No hay un `page.tsx` por seccion: el contenido real vive en
`src/paginas/` (Home, Mssp, Catalogos, Grc, Software, Sectores, Compania,
Contacto, Blog, Articulo, Calculadora, Legales, NoEncontrada) y
`src/paginas/registro.tsx` mapea cada `RouteId` a su renderizador. El
`Record<RouteId, …>` no es decorativo: anadir un `RouteId` sin escribir su
renderizador **no compila**.

El artefacto son **79 paginas HTML**: 15 rutas x 2 idiomas, 23 articulos x 2
idiomas, `/`, `/404` y `/_not-found`.

**`src/config/routes.ts` es el manifiesto central de rutas** - unica fuente de
verdad, consumida por navegacion, pie, selector de idioma, `generateStaticParams`,
metadatos, sitemap, migas de pan, JSON-LD y las pruebas e2e. Declara 16 `RouteId`
(home, mssp, msspIt, msspOt, grc, grcCatalog, software, sectors, blog, company,
contact, calculator, privacy, legal, cookies, notFound) con slugs **traducidos**
por idioma (`/es/soluciones/mssp/` ↔ `/en/solutions/mssp/`) y anclas traducidas
(`#idi` ↔ `#rdi`). No anadas una ruta sin registrarla aqui; `check:routes` falla.

`enabled: false` retira una ruta de la navegacion, del pie, del sitemap, del
build y de las pruebas de una sola vez, y hace que su URL responda 404. Es el
interruptor que usan `BLOG_ENABLED` y `CALCULADORA_ACTIVA`.

**La calculadora del PBCG esta implementada y retirada, no pendiente.** La
pagina, `CalculadoraCliente`, el motor y la funcion `quote` existen y pasan sus
pruebas; `CALCULADORA_ACTIVA = false` en `routes.ts` la deja fuera del sitio
mientras Direccion cierra como se calcula el presupuesto (29/07/2026). Todos los
CTA que apuntaban a ella llevan al formulario de contacto. Para reactivarla:
poner `true` y devolver esos CTA (barra, Home, MSSP IT, catalogo IT y articulos),
la entrada de `check:js` y las pruebas retiradas de `e2e/contexto-no-seguro.spec.ts`
y `e2e/movil.spec.ts`.

**i18n vive bajo `/es/` y `/en/`, nunca en `/`.** `src/i18n/mensajes.ts` +
`request.ts` (next-intl) importan `messages/es.json` y `messages/en.json` en
build; los dos arboles de claves deben coincidir (`check:i18n`). No se monta
ningun provider global de traduccion: las paginas son componentes de build y los
componentes de cliente reciben solo las cadenas que necesitan, como props.

**La raiz reparte por idioma del navegador** (decision de Direccion del
29/07/2026, que sustituye a la regla original de «no se detecta
`Accept-Language`»). Dentro del sitio el idioma **solo** cambia con accion
explicita del usuario; el reparto es unicamente para quien escribe el dominio a
secas. Ocurre en tres sitios que tienen que decir lo mismo, y hay pruebas que lo
comprueban:

1. `netlify.toml` - dos reglas **302** (no 301: un 301 lo cachean navegadores y
   CDN sin volver a mirar la cabecera) con la lista de variantes de castellano.
   Es lo que manda en produccion, sin JavaScript y en el borde.
2. `public/reparto-idioma.js` - fichero estatico, **no** pasa por el compilador.
   Lo carga un `<script src>` sin `async` ni `defer` como primer hijo del `<body>`
   de `/`, asi que se ejecuta antes del primer pintado. Antes esto era un
   `useEffect`, que corre despues de pintar: la pagina de eleccion de idioma
   parpadeaba y se confundia con un 404.
3. `scripts/idioma-preferido.mjs` - la copia del servidor de `pnpm preview`, que
   lee las variantes del propio `netlify.toml` para que no puedan divergir.

**La analitica son etiquetas en el HTML, no un componente de cliente.**
`src/components/seo/Analitica.tsx` emite GTM y GA4 como `<script>` en el layout
de idioma; no usa `@next/third-parties` a proposito, porque eso mete
`next/script` -codigo de cliente- en las 15 paginas a la vez. La CSP de
`netlify.toml` esta abierta a `googletagmanager.com` y lleva `'unsafe-inline'`
en `script-src`, obligado por los fragmentos de arranque: con `output: 'export'`
no hay servidor que genere un nonce. ⚠️ **Sin banner de consentimiento, esas
cookies se escriben antes de tener permiso**; el interruptor esta en GTM.

**La regla dura de arquitectura, con enforcement automatico.**
`scripts/assert-static-architecture.mjs` (`verify:architecture`) falla el build
por dos motivos distintos:

- **Codigo de servidor en `site/`**: `'use server'`, `cookies()`, `draftMode()`,
  `revalidatePath/Tag()`, `runtime = 'nodejs'|'edge'`, `output: 'standalone'`,
  `import 'server-only'`, `from 'next/headers'`, `src/app/api/`, `route.ts`,
  `middleware.ts`, `proxy.ts` o `.netlify/edge-functions`.
- **Cualquier fichero de `src/` que importe de `pbcg/` o de `netlify/`.** Es lo
  unico que impide que las tarifas del modelo economico acaben en el navegador
  (bloqueante B01), y sustituye a la garantia que daba tener el motor en otro
  repositorio.

`verify:export` cierra la misma puerta desde el otro lado: inspecciona `out/`
buscando tarifas, nombres de clientes, `.env`, source maps o restos de servidor,
y comprueba que cada ruta activa tenga su HTML con un solo `h1`, `lang` correcto,
canonica y hreflang.

**La regla de componentes es la inversa de la intuicion comun:** el minimo de
Client Components (`'use client'` solo para interaccion real - menu movil,
formularios, calculadora, filtro del blog), y ningun runtime desplegado. Los
Server Components de build no son «mas peligrosos»: son los que generan HTML sin
enviar JavaScript. `check:js` pone el techo en 157 KB gzip por pagina, y como las
15 paginas se resuelven con una sola ruta atrapatodo, **todas cargan los mismos
chunks**: dividir por pagina no sirve.

## El motor PBCG y las funciones de ingestion

**Variante hibrida** (decision de Direccion del 28/07/2026, MIG-02 §0.4): el
motor se ejecuta en servidor, dentro de una Netlify Function del propio proyecto,
para poder devolver el precio al momento. Las tarifas no viajan al navegador -el
codigo de una funcion no se descarga-, pero el modelo si vive en el repositorio
que Netlify clona. Es el coste asumido, documentado en ISNLA-DOC-0008-REQ-01 §0.1.

| Pieza | Estado |
|---|---|
| Motor PBCG (`site/pbcg/src/`: `calculate.ts`, `config.ts`, `schemas.ts`, `types.ts`, `contrato.ts`) | ✅ Implementado y probado contra el «caso de oro» del Excel (37 pruebas) |
| `POST /api/quote` y `POST /api/contact` (`site/netlify/functions/`) | ✅ Validacion, antispam, calculo, respuesta y registro sin datos personales |
| Envio del aviso de contacto a `info@` por Resend | ✅ `_correo.ts` (API REST con `fetch`, sin SDK) y `_plantillas/aviso-contacto.ts` (ES y EN). Necesita `RESEND_API_KEY`, `RESEND_FROM` y `CONTACT_MAILBOX_TO` |
| Entrega del lead de la calculadora: firma JWS Ed25519, cifrado JWE RSA-OAEP-256 y envio al buzon de ingestion | ⬜ **Pendiente** - hay un `TODO` en `quote.ts`. Bloqueado por el buzon `leads-ingest@` y las claves (REQ-01, bloques B y C) |
| Ingestion en EspoCRM | Fuera de este repositorio: correo cifrado a un importador local. El contrato esta en `contracts/` |

**Son dos buzones distintos, y el correo que va a cada uno es distinto.**
`CONTACT_MAILBOX_TO` (`info@secnorthlabs.eu`) lo lee una persona: recibe el aviso
maquetado, con los datos en claro y `Reply-To` apuntando al visitante.
`LEAD_MAILBOX_TO` (`leads-ingest@`) lo lee un programa: recibe el sobre cifrado
de MIG-02 §9, sin un solo dato legible. Cifrar el primero lo dejaria inutil para
quien tiene que atender la consulta; maquetar el segundo solo serviria para colar
datos personales donde no deben estar. El coste del primero es que **Resend trata
datos personales en claro**, y por eso el asunto y las trazas siguen sin llevar
ninguno (decision de Direccion del 30/07/2026).

**Reglas que no se negocian:**

1. El sitio no contiene ninguna tarifa ni coeficiente en lo que se publica - ni en
   codigo de `src/`, ni en JSON, comentarios o tests. `verify:export` lo comprueba
   en cada build.
2. La funcion recalcula siempre; no confia en ningun total, horquilla ni numero de
   horas que llegue del navegador.
3. La respuesta al cliente es solo el `PublicQuoteDto` (via `toPublicDto()`) -
   nunca coeficientes, desglose de horas internas, tarifa efectiva ni margen.
4. De la hoja `PARAMETROS` del Excel no se porta coste interno (`B7`, `B8`); de
   `CALCULADORA` no se portan tarifa efectiva (`E29`) ni margen bruto (`E30`).
5. Ningun dato personal en los logs - solo `requestId` y `submission.id`.

## Idioma del proyecto

El codigo, los comentarios, los nombres de componentes y los de fichero estan en
**espanol**. Manten esa convencion al anadir codigo. Los comentarios explican
**por que**, no que hace la linea de al lado: cuando una decision tiene una
alternativa evidente que se descarto, el comentario dice cual y por que.
