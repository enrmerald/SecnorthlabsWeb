# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estructura del repositorio

Tres zonas con propósitos distintos:

- **`web/`** — la aplicación real (React 19 + TypeScript + Vite 7 + Tailwind CSS 4). Todo el desarrollo ocurre aquí. **No está en git todavía** (aparece como `?? web/` en `git status`).
- **`index.html`** (raíz) — página estática "En Construcción" autocontenida (CSS inline, sin build). Es lo único versionado en el historial de git y lo que sirve actualmente el dominio. No comparte código con `web/`; si se toca el diseño de marca, ambos deben actualizarse a mano.
- **`docs/`** — documentación de especificación con nomenclatura `ISNLA-DOC-XXXX-YY-...` (mockups en `.docx`, dimensionador en `.xlsx`, calculadora PBCG en HTML standalone, y JSON de textos i18n). Es material de referencia, no se compila.

## Comandos

Todos se ejecutan desde `web/` (las dependencias no están instaladas al clonar):

```bash
cd web
npm install
npm run dev       # servidor de desarrollo Vite con HMR
npm run build     # tsc -b (type-check de proyectos referenciados) + vite build
npm run lint      # eslint . (flat config)
npm run preview   # sirve dist/ para verificar el build
```

No hay framework de tests ni CI configurados. El type-check aislado se consigue con `npx tsc -b` o `npx tsc -b --force`.

## Arquitectura de la aplicación

**Single-page con secciones ancladas.** `App.tsx` es el mapa completo de rutas y merece leerse primero:

- `/` renderiza `Hero`, `AboutUs`, `Product` y `Contacto` como cuatro `<section>` con `id` (`home`, `about`, `product`, `contacto`). La navegación interna usa anclas (`/#about`) y `scrollIntoView`, no rutas.
- `/politica-privacidad`, `/aviso-legal`, `/cookies` son páginas legales independientes; `*` cae en `NotFound`.
- El árbol de providers es `HelmetProvider > BrowserRouter > Scroll + Navbar + Routes + Footer`. `Scroll` (`components/ui/Scroll.tsx`) es un componente sin render que resetea el scroll al cambiar de `pathname`.

**Convención de componentes:** exportación nombrada (`export const Hero = ...`), excepto `NotFound` que es `export default`. Nada de barrel files. Reparto en `components/layout/` (Navbar, Footer), `components/sections/` (una por sección/página) y `components/ui/`.

**i18n es la fuente de todo el texto visible.** Ningún literal de copy debe ir hardcodeado en JSX; todo pasa por `useTranslation()` y `t('clave')`.

- Configuración en `src/i18n/locales/Config.ts` (importada por efecto secundario en `main.tsx`). `LanguageDetector` del navegador con `fallbackLng: 'es'`. Un único namespace `translation`.
- `src/i18n/locales/es.json` y `en.json` deben mantener **exactamente el mismo conjunto de claves** (ambos con la misma estructura anidada: `nav`, `hero`, `about`, `product`, `contact`, `footer`, `privacy`, `legal`, `cookies`). Al añadir una clave, añádela en los dos ficheros.
- Las listas se guardan como arrays JSON y se leen con `t('clave', { returnObjects: true }) as string[]`. Las páginas legales están construidas casi enteras con este patrón.
- El selector de idioma vive en `Navbar` y llama `i18n.changeLanguage()`. No cambia la URL: `/en` no existe como ruta (pese a los `hreflang` de `index.html`).
- **No confundir** con los JSON de `docs/ISNLA-DOC-0006/0007`: son la especificación de un sitio mucho más amplio (`mssp`, `grc`, `software`, `sectors`, `blog`, `company`, catálogos) con un esquema de claves distinto al implementado. Sirven como referencia de contenido futuro, no se importan.

**SEO por página.** Los metadatos base están en `web/index.html`; `Hero` los sobreescribe para la home con `<Helmet>` de `react-helmet-async`. Al crear una página nueva, añade su `<Helmet>` y actualiza `public/sitemap.xml` (ojo: ahí figura `/privacidad`, pero la ruta real es `/politica-privacidad`).

## Estilos: tres sistemas de color coexistiendo

Antes de escribir una clase de color, comprueba de dónde sale:

1. **`src/index.css`** — Tailwind 4 con `@theme` (`--color-brand-cyan`, `--color-brand-green`, `--color-bg-dark`, `--font-display` = Space Grotesk, `--font-sans` = Inter) y componentes en `@layer components` (`.title`, `.text-body`, `.tarjeta-redondeada`). Nota el orden deliberado del fichero: `@import` de Google Fonts → `@theme` → `@import "tailwindcss"` al final.
2. **`src/App.css`** — clases CSS planas, **no** tokens de Tailwind: `.nav-glass`, `.nav-link`, `.logo-glow`, `.bg-north-cyan`, `.text-north-cyan`, `.text-color-card`. Son las que se usan de facto para el cian de marca.
3. **Valores literales en JSX** — `bg-[#050505]`, `text-[#00ffff]`, `border-[#00ffff]/30` aparecen por todas las secciones.

Gotcha real: `Navbar.tsx` y `Footer.tsx` usan `bg-accent-cyan` / `text-accent-cyan` / `ring-accent-cyan`, pero **`accent-cyan` no está definido en ningún sitio** — son clases muertas que no pintan nada. El cian que sí funciona es `.bg-north-cyan`/`.text-north-cyan` (App.css) o el literal `#00ffff`.

Tailwind se integra vía el plugin `@tailwindcss/vite` (no hay `tailwind.config.js` ni PostCSS: la configuración va en CSS con `@theme`).

## Estado del código a tener en cuenta

- **Credenciales de EmailJS hardcodeadas** en `components/sections/Contacto.tsx` (`serviceID`, `templateID`, `publicKey`). Son claves públicas de cliente por diseño, pero si tocas ese formulario considera moverlas a variables `VITE_*`.
- **`components/sections/AdminMensajes.tsx`** exporta `AdminMessages` (nombre distinto del fichero), lee de `localStorage['mensajes_contacto']` y **no está enrutado ni importado por nadie**. Nada escribe esa clave de localStorage: es código huérfano de una iteración anterior en la que el formulario guardaba localmente.
- **`components/ui/Botón.tsx`** y **`components/ui/Tarjeta.tsx`** están vacíos (0 bytes). El fichero con tilde en el nombre es una trampa en shells y rutas: cítalo entre comillas.
- **Dependencias declaradas sin uso:** `framer-motion` y `wouter` (el routing lo hace `react-router-dom`). No las introduzcas asumiendo que ya forman parte de la arquitectura.
- `tsconfig.app.json` está en modo estricto con `noUnusedLocals` y `noUnusedParameters`, así que un import olvidado rompe `npm run build` aunque `npm run dev` funcione.

## Idioma del proyecto

El código, comentarios, nombres de componentes y ficheros están en español (`Contacto`, `Privacidad`, `Tarjeta`, `manejarEnvio`, `mostrarExito`). Mantén esa convención al añadir código.
