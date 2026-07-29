@AGENTS.md

# Trabajar dentro de `site/`

El mapa del repositorio, las reglas de arquitectura y el estado del motor PBCG
estan en el `CLAUDE.md` de la raiz. Esto es lo que hace falta para tocar codigo
aqui sin romper nada.

## Antes de dar por cerrado un cambio

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm check:i18n && pnpm check:routes && pnpm verify:architecture
pnpm build            # incluye verify:export
pnpm check:js         # necesita out/ construido
pnpm test:e2e         # necesita out/ construido
```

Ninguna de estas comprobaciones es opcional cuando el cambio toca rutas,
mensajes, componentes de cliente o el artefacto. `pnpm test:e2e` construye contra
`out/`, no contra `next dev`: si no reconstruyes, pruebas la version anterior.

## Donde va cada cosa

| Quiero… | Toco |
|---|---|
| Anadir o quitar una pagina | `src/config/routes.ts` (manifiesto) + `src/paginas/registro.tsx` + su renderizador en `src/paginas/` + el namespace en `messages/*.json` |
| Retirar una pagina sin borrarla | `enabled: false` en su ruta. Sale de navegacion, pie, sitemap, build y pruebas de golpe, y la URL pasa a 404 |
| Cambiar un texto | `messages/es.json` **y** `messages/en.json`. Nunca cadenas sueltas en el JSX |
| Publicar un articulo | un `.md` en `content/blog/<idioma>/`. El nombre del fichero es la URL. Ver `content/blog/README.md` |
| Anadir una imagen | el original en `assets/images/`; `images:build` genera `public/img/` y `src/generated/images.json` |
| Tocar el modelo economico | `pbcg/`. **Jamas** desde `src/` |
| Redirecciones, cabeceras o CSP | `netlify.toml`. `next.config.ts` no puede hacerlo con `output: 'export'` |

`src/generated/` es **salida de build**: no se edita a mano.

## Reglas que rompen el build si las saltas

- **Nada de `src/` importa de `pbcg/` ni de `netlify/`.** Es lo unico que impide
  que las tarifas acaben en el navegador. Lo comprueba `verify:architecture`.
- **Nada de codigo de servidor**: `'use server'`, `route.ts`, `middleware.ts`,
  `proxy.ts`, `src/app/api/`, `cookies()`, `next/headers`, `runtime = …`,
  `import 'server-only'`. La lista completa esta en
  `scripts/assert-static-architecture.mjs`.
- **Ni una tarifa ni un nombre de cliente en `out/`.** Lo comprueba
  `verify:export` sobre el artefacto ya construido.
- **`es.json` y `en.json` con el mismo arbol de claves** (`check:i18n`).
- **Ninguna ruta sin registrar y ningun slug duplicado por idioma**
  (`check:routes`), que ademas exige que todo `routeId` citado en los mensajes
  exista y este activo.

## Componentes: el minimo de cliente

`'use client'` esta en cinco ficheros y solo donde hay interaccion real: el menu
movil (`layout/NavbarCliente`), los dos formularios (`forms/FormularioContacto`,
`calculadora/CalculadoraCliente`) con sus campos (`forms/campos`) y el filtro del
blog (`blog/ListaFiltrable`). Todo lo demas es componente de build y sale como
HTML sin enviar JavaScript.

Las 15 paginas se resuelven con una sola ruta atrapatodo, asi que **todas cargan
los mismos chunks**: dividir por pagina no reduce nada, y `next/dynamic` sobre
los dos formularios se probo y salio 0,6 KB peor. El techo de `check:js` son
157 KB gzip y esta puesto en la medida real mas un margen minimo, para que
cualquier subida obligue a justificarla.

Los componentes de build leen los mensajes y pasan **solo las cadenas que hacen
falta** como props a los de cliente. No hay provider global de traduccion.

## Trampas conocidas

- **`next lint` no existe en Next 16.** El linter se invoca aparte (`pnpm lint`)
  y `next build` no lo ejecuta.
- **No hay `next start`.** Con `output: 'export'` lo que se sirve es `out/`, y de
  eso se encarga `scripts/static-server.mjs` (`pnpm preview`), que ademas imita a
  Netlify: barra final, 404 por idioma, reparto de la raiz y `/api/*` invocando
  las funciones de verdad.
- **Vitest no resuelve el alias `@/`.** En un fichero que importe **valores** (no
  solo tipos) desde un modulo que las pruebas cargan, usa ruta relativa.
- **`crypto.randomUUID()` no existe fuera de contexto seguro** (HTTP por IP, que
  es como se sirve el servidor de revision). Un `useEffect` que lo llamaba
  desmontaba el arbol entero y dejaba los formularios en blanco. Lo cubre
  `e2e/contexto-no-seguro.spec.ts`.
- **Playwright no tiene proyecto `chromium`.** Las anchuras son `movil-320`,
  `movil-390`, `tablet-768` y `escritorio-1440`, y la matriz existe porque un
  breakpoint no demuestra que el contenido quepa.
- **`public/reparto-idioma.js` no pasa por el compilador.** Se sirve tal cual:
  JavaScript de toda la vida, sin modulos. Lo ejecuta y lo compara con el
  manifiesto y con `netlify.toml` la prueba `src/app/reparto-idioma.test.ts`.
- **Los logos de terceros no se recolorean.** Van en capsula clara y se
  referencian en su version positiva; el motivo completo esta en
  `src/config/logos.ts`.

## Estilo

Codigo, comentarios y nombres de fichero en **espanol**. Los comentarios explican
**por que**, y cuando una decision tenia una alternativa evidente que se
descarto, dicen cual y que la descarto. Sigue la densidad de comentario del
fichero que estas tocando.
