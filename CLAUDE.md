# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estructura del repositorio

El repositorio contiene **cinco zonas independientes**, sin workspace raíz que las una (no hay `pnpm-workspace.yaml` ni `package.json` en la raíz — cada carpeta se instala y compila por separado):

- **`site/`** — el sitio nuevo en construcción: Next.js 16 (App Router) con `output: 'export'`, sin ningún runtime en producción. Es la reescritura completa de `web/` bajo la marca **ISN Labs**, siguiendo `docs/ISNLA-DOC-0008-01-plan-implementacion-web-270726.md`. **Aquí ocurre casi todo el desarrollo activo.**
- **`gateway/`** — servidor de backend independiente (`isnlabs-web-gateway`) que contiene el motor de cálculo PBCG y, a futuro, el adaptador de EspoCRM, la bandeja de salida y el SMTP. Deliberadamente **sin ninguna dependencia de ni conexión con Netlify**: nada de lo que hay aquí puede acabar en el bundle que descarga un visitante.
- **`web/`** — la SPA Vite + React 19 anterior, marca "North Labs" / SentryN3t. Ya no es donde ocurre el desarrollo nuevo; se conserva como referencia hasta que `site/` porte su texto legal palabra por palabra (Fase 9 del plan). Su CLAUDE.md/documentación previa sigue siendo válida para ese propósito puntual.
- **`index.html`** (raíz) — página estática "En Construcción" autocontenida (CSS inline, sin build). Es lo que sirve actualmente el dominio en producción. No comparte código con ninguna de las carpetas anteriores.
- **`docs/`** — documentación de especificación (`ISNLA-DOC-XXXX-YY-...`): mockups, dimensionador Excel, calculadora HTML de referencia, JSON i18n del brief, y el **plan de implementación** (`ISNLA-DOC-0008-01`, ~3400 líneas) que rige todo lo que se construye en `site/` y `gateway/`. Material de referencia, no se compila. **`docs/*.xlsx` está en `.gitignore`**: contiene tarifas y datos reales de clientes que no pueden entrar en ningún repo que Netlify clone.

`site/` tiene su propio `CLAUDE.md` (que importa `site/AGENTS.md`, con advertencias sobre roturas de API de esta versión de Next frente al conocimiento de entrenamiento del modelo — léelo antes de tocar código ahí). Consúltalo al trabajar dentro de `site/`.

> **Deuda técnica reconocida** (ver `gateway/README.md`): `site/` y `gateway/` conviven hoy en el mismo repo git. El plan lo permite como paso intermedio, pero hay que dividirlos antes de producción — en esta forma Netlify tiene acceso técnico al código del gateway durante el checkout, aunque no lo use en el build.

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

**`src/config/routes.ts` es el manifiesto central de rutas** — única fuente de verdad, consumida por navegación, pie, selector de idioma, `generateStaticParams`, metadatos, sitemap y breadcrumbs. Define 15 `RouteId` (home, mssp, msspIt, msspOt, grc, grcCatalog, software, sectors, company, contact, calculator, blog, privacy, legal, cookies, notFound) con slugs **traducidos** por idioma (`/es/soluciones/mssp/` ↔ `/en/solutions/mssp/`). No añadas una ruta sin registrarla aquí; `check:routes` falla si no coincide.

**i18n vive bajo `/es/` y `/en/`, nunca en `/`.** No hay detección de `Accept-Language`, ni cookie de idioma, ni redirección por ubicación — el idioma solo cambia con acción explícita del usuario. `src/i18n/mensajes.ts` + `request.ts` (next-intl) cargan `messages/es.json` y `messages/en.json`; ambos deben mantener el mismo árbol de claves (verificado por `check:i18n`).

**La calculadora PBCG (ruta `calculator`) está registrada pero sin implementar.** En `registro.tsx` apunta al renderer genérico `EnConstruccion` (placeholder). El motor de cálculo ya existe y está probado en `gateway/`, pero la UI cliente en `site/` es la pieza pendiente de la Fase 5.

**Regla dura de arquitectura, con enforcement automático:** nada de `'use server'`, `app/api/`, `route.ts`, `middleware.ts`, `proxy.ts`, `runtime = 'nodejs'|'edge'`, `output: 'standalone'`, `cookies()`, `revalidatePath/Tag()`, ni `import 'server-only'` en `site/`. `scripts/assert-static-architecture.mjs` (invocado como `verify:architecture`) falla el build si encuentra cualquiera de estos. La regla de componentes es la inversa de la intuición común: usar el mínimo de Client Components (`'use client'` solo para interacción real — menú móvil, formularios, calculadora), y no desplegar ningún runtime en producción; Server Components de build no son "más peligrosos", son los que generan HTML sin enviar JS.

**`netlify.toml` todavía no existe** en ningún sitio del repo, pese a que `next.config.ts` ya delega ahí `redirects`/`rewrites`/`headers` (no soportados con `output: 'export'`). Es un hueco pendiente antes de poder desplegar.

## Arquitectura de `gateway/`

**Motivo de existir:** si el modelo económico del PBCG viviera en `site/`, Netlify lo compilaría dentro del JavaScript público — tarifas, coeficientes y el algoritmo completo quedarían legibles por cualquier visitante, y la puerta de captación de leads sería evitable abriendo las devtools. La separación en un repositorio/servidor sin conexión a Netlify es la mitigación (bloqueante B01 del plan).

**Estado real (no confundir con el plan aspiracional):**

| Pieza | Estado |
|---|---|
| Motor PBCG (`src/domain/pbcg/`: `calculate.ts`, `config.ts`, `schemas.ts`, `types.ts`) | ✅ Implementado y probado contra el "caso de oro" del Excel |
| Bandeja de salida (`submission` + `delivery_job`, SQLite) | ⬜ Pendiente — sin código ni dependencia todavía |
| Servidor Fastify + verificación de firma de Netlify | ⬜ Pendiente — **no hay Fastify instalado ni ningún endpoint HTTP** |
| Adaptador de EspoCRM | ⛔ Bloqueado por pendientes de negocio (rol/equipo, campos, duplicados) |

**Reglas que no se negocian** (de `gateway/README.md`):
1. El repositorio del sitio no contiene ninguna tarifa ni coeficiente — ni en código, JSON, comentarios o tests. `site/`'s `verify:export` lo comprueba en cada build.
2. El gateway recalcula siempre; no confía en ningún total, horquilla ni número de horas que llegue del navegador.
3. La respuesta al cliente es solo el `PublicQuoteDto` (vía `toPublicDto()`) — nunca coeficientes, desglose de horas internas, tarifa efectiva ni margen.
4. De la hoja `PARAMETROS` del Excel no se porta coste interno (`B7`, `B8`); de `CALCULADORA` no se portan tarifa efectiva (`E29`) ni margen bruto (`E30`).
5. Ningún dato personal en los logs — solo `requestId` y `submission.id`.

## Idioma del proyecto

El código, comentarios, nombres de componentes y ficheros están en español. Mantén esa convención al añadir código, en cualquiera de las carpetas.
