# ISNLA-DOC-0008-01 · Plan de implementación de la web ISN Labs

| Campo | Valor |
|---|---|
| Documento | ISNLA-DOC-0008-01 |
| Título | Plan de implementación de la web ISN Labs |
| Versión | 01 |
| Fecha | 27/07/2026 |
| Estado | **Aprobado para implementación por fases**, con la **arquitectura estática** de la revisión 01-d. La integración con EspoCRM y la publicación quedan condicionadas a los pendientes de negocio aplicables. Ver [readiness por fase](#33-readiness-por-fase) |
| Audiencia | Equipo de desarrollo (perfil junior incluido), sistemas, ciberseguridad, marketing y cumplimiento |
| Documentos de entrada | ISNLA-DOC-0004-04 (mockups y especificaciones) · ISNLA-DOC-0006-01 (i18n ES) · ISNLA-DOC-0007-01 (i18n EN) · ISNLA-DOC-0001-01 (Dimensionador PBCG, Excel) · ISNLA-DOC-0001-01 (calculadora web, HTML) · Indicación de dirección de 27/07/2026 sobre captación de leads y EspoCRM · Dos revisiones técnicas del plan (27/07/2026) · **ISNLA-DOC-0008-MIG-01** (plan de migración a arquitectura estática, Netlify y gateway) |

### Historial de revisiones

| Rev. | Fecha | Cambios |
|---|---|---|
| 01 | 27/07/2026 | Versión inicial a partir de los cinco documentos de marketing |
| 01-a | 27/07/2026 | Incorporada la indicación de dirección sobre formularios y EspoCRM: [Fase 6](#fase-6--formularios-gateway-e-integración-con-espocrm) reescrita por completo, con validación técnica del consejo recibido (ver [Anexo A](#anexo-a--validación-del-consejo-recibido-sobre-espocrm)). Corregido el antispam: reCAPTCHA descartado |
| 01-b | 27/07/2026 | Primera revisión técnica aplicada. **Cambios de fondo:** el motor de la calculadora pasa a ser exclusivamente de servidor (B01); el respaldo de leads pasa de JSONL a bandeja de salida transaccional (B03); se corrige la base jurídica de los formularios separando información de consentimiento (B04); todo el plan se actualiza a Next.js 16 (B05); la incoherencia de CPD pasa a error bloqueante (B06); se añaden las fases 10, 11 y 12 de seguridad HTTP, despliegue y pruebas E2E (B07). Corregido un error propio sobre el prefijo `c` de EspoCRM. Ver [Anexo B](#anexo-b--trazabilidad-de-la-revisión-técnica) |
| **01-d** | 27/07/2026 | **Migración a arquitectura estática** (ISNLA-DOC-0008-MIG-01). El sitio pasa a `output: 'export'` publicado en Netlify, **sin ningún runtime Next.js en producción**. Todo el código de servidor —motor PBCG, acceso a EspoCRM, SMTP y bandeja de salida— se traslada a un **Web Gateway** independiente, en repositorio propio y desplegado junto a EspoCRM en red privada. Los formularios llegan al gateway por un **proxy firmado de Netlify** (`x-nf-sign`). La i18n pasa a `/es/` y `/en/` con slugs traducidos y manifiesto central de rutas. Migración a pnpm y Node fijados, Dependabot con espera mínima de 24 h, y diseño mobile-first desde 320 px. **Esto resuelve estructuralmente B01 y el pendiente P26 (CSP).** Corregidos dos errores del documento de migración: `allowBuilds` no existe en pnpm 10 y el `window_size` de Netlify no admite 600 s. Ver [Anexo C](#anexo-c--migración-a-arquitectura-estática) |
| 01-c | 27/07/2026 | Segunda revisión técnica aplicada. **Cambios de fondo:** la bandeja de salida se divide en `submission` + `delivery_job` para poder representar estados por destino (B08); las recotizaciones pasan a un endpoint propio que **no** toca el CRM ni envía correo (B09); el modelo de permisos de EspoCRM pasa a basarse en equipo y se define la estrategia ante duplicados (B10). Se elige una estrategia concreta de CSP, se escalona el HSTS, se corrige el despliegue `standalone`, se elimina el campo de renting (con lo que **P21 deja de bloquear**), se separan resultado interno y DTO público, se versiona el modelo económico y se define el orden exacto de redondeo. Barrido de contradicciones residuales sobre privacidad, breadcrumbs, GRC, blog y CMP. Ver [Anexo B.7](#b7-segunda-revisión-técnica-b08b10) |

---

## Índice

1. [Contexto y objetivo](#1--contexto-y-objetivo)
2. [Decisiones tomadas](#2--decisiones-tomadas)
3. [Bloqueantes B01–B07](#3--bloqueantes-b01b10)
4. [Inventario de documentos analizados](#4--inventario-de-documentos-analizados)
5. [Datos confidenciales que no pueden salir del Excel](#5--datos-confidenciales-que-no-pueden-salir-del-excel)
6. [Fase 0 · Preparación](#fase-0--preparación)
7. [Fase 1 · Sistema de diseño](#fase-1--sistema-de-diseño)
8. [Fase 2 · i18n y contenido](#fase-2--i18n-y-contenido)
9. [Fase 3 · Layout común](#fase-3--layout-común)
10. [Fase 4 · Las páginas](#fase-4--las-páginas)
11. [Fase 5 · Calculadora PBCG](#fase-5--calculadora-pbcg)
12. [Fase 6 · Formularios, gateway e integración con EspoCRM](#fase-6--formularios-gateway-e-integración-con-espocrm)
13. [Fase 7 · SEO técnico](#fase-7--seo-técnico)
14. [Fase 8 · Legales y consentimiento (CMP)](#fase-8--legales-y-consentimiento-cmp)
15. [Fase 9 · Accesibilidad, rendimiento y limpieza](#fase-9--accesibilidad-rendimiento-y-limpieza)
16. [Fase 10 · Cabeceras, caché y endurecimiento](#fase-10--cabeceras-caché-y-endurecimiento)
17. [Fase 11 · Despliegue y operación](#fase-11--despliegue-y-operación)
18. [Fase 12 · Pruebas, CI y E2E](#fase-12--pruebas-ci-y-e2e)
19. [Orden de ejecución recomendado](#orden-de-ejecución-recomendado)
20. [Verificación](#verificación)
21. [Pendientes de negocio](#pendientes-de-negocio)
22. [Anexo A · Validación del consejo recibido sobre EspoCRM](#anexo-a--validación-del-consejo-recibido-sobre-espocrm)
23. [Anexo B · Trazabilidad de la revisión técnica](#anexo-b--trazabilidad-de-la-revisión-técnica)
24. [Anexo C · Migración a arquitectura estática](#anexo-c--migración-a-arquitectura-estática)

---

## 1 · Contexto y objetivo

La web actual (`web/`, SPA Vite + React 19) es un *one-pager* de una marca llamada **North Labs** que vende **SentryN3t** como si fuera producto propio. Tiene cuatro secciones ancladas (Hero, About, Product, Contacto) y tres páginas legales.

Los cinco documentos de `docs/`, creados por dirección como plan de marketing, describen una web **completamente distinta**:

- Otra marca: **ISN Labs** (razón social *Innovation and Security North Labs SL*, siglas ISNOL).
- Otro posicionamiento: **MSSP + GRC bajo un mismo techo**, en IT y OT. SentryN3t pasa a ser *tecnología de partner* (marca de Ewala), no producto propio.
- Otra paleta: verde + cian sobre `#0D0F11`, en lugar del cian único sobre `#050505`.
- Otras fuentes: Space Mono + Noto Sans, en lugar de Space Grotesk + Inter.
- **15 páginas** en lugar de cuatro secciones.
- Una **calculadora de presupuesto** del Plan Base de Ciberseguridad Gestionada (PBCG) que hoy no existe.

**Objetivo.** Web ISN Labs completa, bilingüe (ES/EN), con SEO real por página, la calculadora PBCG funcionando con el modelo económico aprobado, y las páginas legales propias conservadas.

Se ha decidido **migrar a Next.js** (App Router, generación estática). Es una reescritura, no un retoque: la SPA actual no puede entregar los metadatos por página ni el HTML pre-renderizado que exige un brief con ocho páginas de prioridad SEO alta.

---

## 2 · Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Stack | **Next.js App Router exportado por completo con `output: 'export'`.** Netlify publica exclusivamente `out/`. **No existe runtime Next.js en producción.** | La SPA actual se renderiza solo en cliente y sus metadatos no llegan a rastreadores ni a las previsualizaciones de enlaces. Next da HTML pre-renderizado por página; exportarlo entero elimina además toda la superficie de ataque de un servidor. Ver [Anexo C](#anexo-c--migración-a-arquitectura-estática) |
| Hosting | **Netlify** como CDN y hosting de estáticos. **Sin Functions ni Edge Functions.** | El artefacto publicado contiene solo HTML, CSS, JS, imágenes, fuentes y ficheros públicos. Cualquier cómputo vive fuera |
| Código de servidor | **Web Gateway independiente** (Fastify + Node), en repositorio propio y desplegado junto a EspoCRM en red privada. | Contiene el motor PBCG, el adaptador de EspoCRM, la bandeja de salida y el SMTP. Nada de eso puede estar en el repositorio que Netlify compila |
| Formularios | El navegador llama a `/api/*`; Netlify lo **proxifica firmado** (`x-nf-sign`) hacia el gateway. | La URL visible sigue siendo del propio dominio: sin CORS, sin secretos en el navegador, y el gateway rechaza lo que no venga firmado por Netlify. Ver [6.3](#63-el-proxy-firmado-de-netlify) |
| Rutas e idioma | **Todas las páginas bajo `/es/` y `/en/`**, con slugs traducidos y manifiesto central. `/` redirige 301 fijo a `/es/`. | Sin detección de `Accept-Language`, sin cookie de idioma y sin redirección por ubicación: URLs deterministas, caché simple y ninguna sorpresa para el visitante |
| Páginas legales | **Conservar las propias.** La **política de cookies se mantiene siempre**; el CMP y el botón «Configurar cookies» solo se implementan **si las tecnologías finalmente elegidas requieren consentimiento** (P12). | Contienen datos jurídicos reales de ISNOL. Ewala es otra sociedad: alojar ahí la privacidad de ISNOL sería incorrecto. Y montar un CMP antes de decidir la analítica es añadir una cookie que quizá no haga falta. |
| Parámetros de la calculadora | **El Excel v2** (`ISNLA-DOC-0001-01-Dimensionador_PBCG_1.xlsx`). | Es el documento más reciente (v2, julio 2026), incluye la hoja VALIDACION contra la cartera real y el propio HTML se declara «espejo» del Excel. |
| Datos de contacto | **Los reales actuales**: `info@secnorthlabs.eu`, `+34 634 651 312`, Calle Peña Brava 21, Of. 1B, PI de Silvota, Llanera, CP 33192. | El brief los da como marcadores («hola@isnlabs.eu», «+34 9XX XX XX XX»). No se publican datos que no existen. El nombre público sí pasa a ISN Labs. |
| Destino de los leads | **EspoCRM autoalojado en VPS propio en la UE**, alcanzable **solo** desde el Web Gateway por red privada. | Indicación de dirección (27/07/2026). Ni la web ni Netlify hablan nunca con EspoCRM. Detalle en la [Fase 6](#fase-6--formularios-gateway-e-integración-con-espocrm) |
| Antispam | **Honeypot + comprobación de tiempo + rate limiting** (en el edge de Netlify y en el gateway); Altcha autoalojado si hace falta más. **reCAPTCHA descartado.** | reCAPTCHA envía datos del visitante a un responsable estadounidense, lo que contradice el propio argumento de soberanía. Ver [6.9](#612-captcha-recaptcha-contradice-el-argumento-de-soberanía) |
| Motor de la calculadora | **Exclusivamente en el Web Gateway**, en otro repositorio. El navegador envía parámetros y recibe solo el DTO público. | Más fuerte que `server-only`: el modelo de precios ya no está en el repositorio que Netlify compila, así que no puede filtrarse por descuido. Ver [Fase 5](#fase-5--calculadora-pbcg) |
| Respaldo de leads | **Bandeja de salida transaccional** (SQLite WAL o PostgreSQL) **en el gateway**, con clave de idempotencia y reintentos. | Un fichero JSONL no aguanta escrituras concurrentes, no permite actualizar estados y complica el borrado por retención. Ver [6.7](#610-bandeja-de-salida-submission--delivery_job) |
| Casilla de los formularios | **Acredita que se ha facilitado la información** de protección de datos, no es un consentimiento genérico. El consentimiento de marketing va aparte, opcional y sin premarcar. | La AEPD distingue expresamente informar de consentir, y desaconseja las casillas del tipo «He leído y acepto la política de privacidad» cuando lo que se necesita es consentimiento. Ver [6.11](#614-base-jurídica-y-deberes-de-rgpd) |
| Versiones | **Node 24.18.0 · pnpm 10.34.5 · Next 16.2.12**, fijadas de forma exacta. Migración de npm a pnpm. | Reproducibilidad, y `minimumReleaseAge` de pnpm como primera barrera de suministro. Ver [Fase 0](#fase-0--preparación) |
| Actualizaciones | **Dependabot + espera mínima real de 24 h**, con auto-merge solo para parches, menores y seguridad que pasen todo el CI. | Una versión recién publicada es el vector clásico de ataque de cadena de suministro. Ver [12.4](#124-dependabot-y-espera-mínima-de-24-h) |
| Diseño | **Mobile-first**, probado desde 320 px. | El brief lo pedía y el plan anterior lo trataba como un añadido al final. Ver [1.6](#16-mobile-first) |

---

### 2.1 Arquitectura objetivo

```text
Visitante
   │
   ├── GET /es/…  o  /en/…
   │        │
   │        ▼
   │   Netlify CDN
   │   Solo HTML + CSS + JS + imágenes + fuentes.  Sin cómputo.
   │
   └── POST /api/…
            │
            ▼
       Proxy firmado de Netlify
       · firma JWS HS256 en la cabecera x-nf-sign
       · rate limiting en el edge
       · la URL que ve el navegador sigue siendo /api/… → sin CORS
            │
            ▼
       https://api.secnorthlabs.eu/web/v1/…
       Nginx  · publica SOLO /web/v1/ ; el resto devuelve 404
            │
            ▼
       Web Gateway (Fastify, repositorio propio)
       · verifica la firma de Netlify
       · valida Origin, método, Content-Type y tamaño
       · honeypot, tiempo mínimo, rate limiting e idempotencia
       · CALCULA el PBCG              ← el modelo de precios vive aquí
       · persiste submission + delivery_job
       · llama a EspoCRM por red privada
       · envía correo por SMTP
            │
            ├── EspoCRM   http://espocrm/api/v1/   (red privada, sin puerto público)
            ├── Bandeja de salida (SQLite WAL / PostgreSQL)
            └── SMTP
```

#### Qué queda expuesto a Internet

**Solo dos cosas:**

1. El dominio web servido por Netlify.
2. El *virtual host* del gateway, con TLS, **únicamente bajo `/web/v1/`**, rechazando lo que no lleve firma válida de Netlify, sin Swagger público, sin panel y sin endpoints genéricos de EspoCRM.

**Nada de esto es accesible desde Internet:** el puerto de EspoCRM, su `/api/v1/`, su panel de administración, la base de datos, la bandeja de salida, el worker, el SMTP, los endpoints de salud detallados, los secretos de firma y el modelo de precios PBCG.

#### Por qué exportar del todo, y no solo generar estáticamente

Un runtime de React/Next en producción es superficie que hay que parchear. No es una preocupación teórica: en diciembre de 2025 se publicó **CVE-2025-55182 (CVSS 10.0)**, una ejecución remota de código sin autenticación contra los endpoints de Server Functions de React, presente en `react-server-dom-*` 19.0–19.2.0. El propio aviso de React es explícito:

> *«Si el código React de tu aplicación no usa un servidor, tu aplicación no está afectada por esta vulnerabilidad.»*

Con `output: 'export'` los Server Components **se ejecutan durante `next build`**: generan HTML y el payload estático de navegación, y en producción no queda ningún proceso Next, ningún endpoint de Server Functions y ninguna función remota que atacar.

> ⚠️ **Conviene deshacer un malentendido**, porque afecta a cómo se escribe el código: **un Server Component no es más vulnerable que un Client Component.** Lo peligroso es el *runtime que atiende peticiones*, no el componente. Por eso la regla **no** es «usar pocos Server Components», sino la contraria:
>
> **Usar el mínimo posible de Client Components y no desplegar ningún runtime en producción.**
>
> Los Server Components de build son justamente lo que permite enviar menos JavaScript al navegador: componen el contenido en el build y el visitante recibe HTML.

---

## 3 · Bloqueantes B01–B10

Dos revisiones técnicas del 27/07/2026 identificaron diez bloqueantes. Todos están resueltos en el cuerpo de este documento; estas tablas existen para poder auditar la resolución sin releerlo entero.

### 3.1 Primera revisión (B01–B07)

| ID | Problema | Severidad | Resuelto en |
|---|---|---|---|
| **B01** | La calculadora y sus tarifas acabarían en el navegador, y la puerta de captación sería evitable | **Crítico** | [5.1](#51-arquitectura-el-cálculo-vive-en-otro-repositorio), [5.2](#52-parámetros--gatewaysrcdomainpbcgconfigts) |
| **B02** | El segundo envío confiaba en un ID de EspoCRM guardado en React, y exigía permisos que contradicen el rol «solo crear» | **Crítico** | [6.5](#69-el-navegador-nunca-ve-un-id-de-espocrm), [6.9](#613-checklist-de-seguridad-de-espocrm) |
| **B03** | El respaldo en JSONL no es fiable como cola de producción | **Crítico** | [6.6](#610-bandeja-de-salida-submission--delivery_job) |
| **B04** | El tratamiento RGPD confundía información de privacidad con consentimiento | **Alto** | [6.1](#61-campos-y-validación--componentsformscontactformtsx), [6.10](#614-base-jurídica-y-deberes-de-rgpd) |
| **B05** | Varias instrucciones correspondían a Next.js anterior a la 16 | **Alto** | [Fase 0](#fase-0--preparación), [2.1](#21-estrategia-de-rutas-es-y-en-con-slugs-traducidos), [3.3](#33-metadatos) |
| **B06** | La incoherencia de CPD se normalizaba en silencio y podía abaratar el presupuesto | **Alto** | [5.4](#54-validación-de-entrada-y-errores-bloqueantes) |
| **B07** | Faltaban despliegue, observabilidad, seguridad HTTP y pruebas E2E | **Alto** | [Fase 10](#fase-10--cabeceras-caché-y-endurecimiento), [Fase 11](#fase-11--despliegue-y-operación), [Fase 12](#fase-12--pruebas-ci-y-e2e) |

### 3.2 Segunda revisión (B08–B10)

| ID | Problema | Severidad | Resuelto en |
|---|---|---|---|
| **B08** | La bandeja de salida tenía un solo `status` por envío, así que no podía representar «CRM sincronizado, correo fallido» ni reintentar un único destino | **Crítico** | [6.6](#610-bandeja-de-salida-submission--delivery_job) |
| **B09** | Cada recotización llamaba al endpoint que persiste y sincroniza con el CRM: mover un campo habría generado actualizaciones de Lead y trabajos de cola cada 400 ms | **Crítico** | [5.7](#57-los-tres-endpoints-de-la-calculadora), [6.3](#67-contrato-de-la-petición--post-apicontact) |
| **B10** | Asignar el Lead a un comercial puede hacer que el usuario de API pierda el permiso de edición «own», y no había estrategia definida ante duplicados | **Alto** | [6.9](#613-checklist-de-seguridad-de-espocrm) |

Además se cerraron tres decisiones que estaban implícitas o incompatibles entre sí: la **estrategia de CSP** ([10.1](#101-content-security-policy-la-migración-resuelve-el-problema)), el **escalonado del HSTS** ([10.2](#102-cabeceras-del-sitio-en-netlifytoml)) y el **despliegue `standalone`** ([11.1](#111-despliegue-del-sitio-en-netlify)).

### 3.3 Readiness por fase

Qué se puede empezar ya y qué está bloqueado, tras la migración:

| Fase | Repositorio | Estado |
|---|---|---|
| 0 · Baseline, pnpm, Next 16, CI | site | ✅ **Lista para empezar** |
| 1 · Sistema de diseño y mobile-first | site | ✅ Lista |
| 2 · i18n `/es` `/en` y manifiesto | site | ✅ Lista |
| 3–4 · Layout y páginas estáticas | site | ✅ Lista, salvo blog y CMP condicionales |
| 5 · Motor PBCG | **gateway** | ✅ Lista. Al eliminar el campo de renting, **P21 ya no bloquea** |
| 6.10 · Bandeja de salida | **gateway** | ✅ Lista con el modelo de dos tablas |
| 6.4–6.6 · Web Gateway | **gateway** | ✅ Lista |
| 5.6 · Interfaz de la calculadora | site | ✅ Lista, con el flujo de tres endpoints de [5.7](#57-los-tres-endpoints-de-la-calculadora) |
| 6.3 · Proxy firmado de Netlify | ambos | ⚠️ Requiere P28 (plan), P29 (subdominio) y el secreto de firma |
| 6.11–6.13 · Integración real con EspoCRM | gateway | ⛔ **Bloqueada** por P14 (rol y equipo), P15 (campos) y P25 (duplicados) |
| 8 · CMP | site | ⛔ **Bloqueada** por P12 (analítica) |
| 7 · SEO y redirecciones | site | ⚠️ Parcial: bloqueado por P4 (dominio), P23 (inventario de URLs) y P24 (blog) |
| 10 · Cabeceras y CSP | site | ✅ **Desbloqueada por la migración**: P26 cerrado |
| 11 · Producción | ambos | ⚠️ Requiere P29–P32 y la auditoría de subdominios del HSTS |

---

## 4 · Inventario de documentos analizados

| Documento | Qué aporta | Cómo se usa |
|---|---|---|
| `ISNLA-DOC-0004-04-Mockups-y-especificaciones-web-090726.docx` | Brief maestro: sistema de diseño, arquitectura de 8+3 páginas, estructura sección a sección, SEO por página, especificación del formulario, notas técnicas y 13 mockups PNG de alta fidelidad embebidos | Fuente de verdad de **estructura, diseño y SEO** |
| `ISNLA-DOC-0006-01-i18n-textos-web-es-090726.json` | 282 claves con **todo el copy en español**, 12 namespaces | Se convierte en `site/messages/es.json` |
| `ISNLA-DOC-0007-01-i18n-textos-web-en-090726.json` | El mismo árbol en inglés — verificado: **282 claves idénticas, 33 arrays con la misma longitud, cero divergencias** | Se convierte en `site/messages/en.json` |
| `ISNLA-DOC-0001-01-Dimensionador_PBCG_1.xlsx` | Cinco hojas: PORTADA, PARAMETROS, AUDITORIAS, CALCULADORA, VALIDACION. El modelo económico completo con fórmulas | Fuente de verdad del **cálculo** |
| `ISNLA-DOC-0001-01-calculadora_web_1.html` | Prototipo funcional autocontenido: interfaz, puerta de captación de lead y JavaScript del cálculo | Referencia de **flujo y experiencia de usuario**, no de cifras |

**Cómo consultar los mockups.** Los 13 PNG están embebidos en el `.docx`. Para extraerlos, descomprimirlo como ZIP y abrir `word/media/image1..13.png`. El orden es: 1 portada, 2 sistema de diseño, 3 Home, 4 MSSP, 5 GRC, 6 Software, 7 Sectores, 8 Blog, 9 Compañía, 10 Contacto, 11-13 catálogos IT/OT/GRC.

---

## 5 · Datos confidenciales que no pueden salir del Excel

> **Leer esta sección antes de tocar la calculadora.**

La hoja `VALIDACION` contiene datos reales de la cartera de clientes: nombres, horas contratadas y PVP mensual de cada contrato. La hoja `CALCULADORA` contiene además tarifa efectiva y margen bruto.

**Nada de lo siguiente puede acabar en el repositorio, en un JSON, en el bundle de JavaScript ni en un comentario:**

- Ningún nombre de cliente ni cifra de la hoja VALIDACION.
- Coste interno técnico (`PARAMETROS!B7`) ni coste interno de auditoría (`PARAMETROS!B8`).
- Tarifa efectiva del contrato (`CALCULADORA!E29`) ni margen bruto (`CALCULADORA!E30`).

Solo se portan los parámetros necesarios para calcular el PVP que ve el cliente. **El bundle de una web es público: cualquiera puede leerlo.** Es el error más fácil de cometer al trasladar un Excel a código.

### Otras restricciones que impone el brief

- **Página `/software`: los precios NO se muestran.** Las tarjetas de nivel usan «Según alcance». Textual del brief: *«No publicar tarifas sin aprobación»*.
- **Sectores**: no inventar cifras ni casos de cliente.
- **Compañía**: no publicar cifras financieras del one-pager de inversión (documento confidencial).
- **Home**: los datos del panel son ilustrativos; no exponer datos reales de clientes.
- Las cifras que hoy muestra el Hero actual (`100%`, `24/7`, `AES-256`) **desaparecen**: no están en el brief y son afirmaciones sin respaldo.

---

## Fase 0 · Preparación

1. **Commit de baseline.** `web/` y `docs/` están sin versionar (`?? web/`, `?? docs/` en `git status`). Antes de reescribir nada:

   ```bash
   git add docs web
   git commit -m "Baseline: web Vite actual y documentación de marketing"
   ```

   Sin esto no hay a dónde volver si algo se rompe.

2. **Rama de trabajo.**

   ```bash
   git switch -c feat/web-isn-labs
   ```

3. **Separar los repositorios.** Es la decisión estructural de la que dependen las demás:

   | Repositorio | Contiene | Netlify |
   |---|---|---|
   | **`isnlabs-site`** | `site/`, `netlify.toml`, `.github/`, `docs-public/`, `contracts/` | ✅ Único al que tiene acceso |
   | **`isnlabs-web-gateway`** | Motor PBCG y configuración económica, gateway, adaptador de EspoCRM, bandeja de salida, worker, SMTP, migraciones, `deploy/` | ❌ Sin conexión con Netlify |

   `isnlabs-site` **no contiene**: el Excel de validación, nombres de clientes, tarifas internas, credenciales, el código del gateway ni scripts de administración.

   > **Si dividir en dos repositorios no es viable de inmediato**, se permite temporalmente un monorepo `site/` + `gateway/` + `packages/contracts/`, publicando `site/out`. **Pero hay que abrir un pendiente técnico para dividirlo antes de producción**, porque en esa forma Netlify tiene acceso al código del gateway durante el build, y se pierde justo la compartimentación que motiva la migración.

   **Contrato entre ambos: OpenAPI.** El gateway genera y valida `openapi/web-gateway-v1.yaml`; en cada versión estable se copia a `isnlabs-site/contracts/web-gateway-v1.yaml` y el sitio genera **solo tipos de desarrollo** (`pnpm generate:api-types`). **El sitio no importa ningún paquete en runtime del gateway**, para que una dependencia de backend no acabe en el bundle.

4. **Crear el proyecto Next** en `site/`. No se toca `web/` todavía: se conserva como referencia hasta la Fase 9, sobre todo por el texto legal, que hay que portar palabra por palabra.

   ```bash
   npx create-next-app@latest site      --ts --app --tailwind --eslint --src-dir --import-alias "@/*"
   ```

   > **Sin `--no-turbopack`.** Turbopack es el empaquetador por defecto y no debe desactivarse preventivamente. Si apareciera una incompatibilidad real y demostrada, la salida es `--webpack`, documentando el motivo.

5. **Fijar las versiones de forma exacta**, sin `^` ni `~`. Un plan que no fija versiones deja de ser reproducible en tres meses, y con auto-merge activado además deja de ser auditable:

   | Elemento | Versión | Dónde se fija |
   |---|---|---|
   | Node.js | **24.18.0** | `.nvmrc`, `engines.node`, `NODE_VERSION` de Netlify y `setup-node` de CI |
   | pnpm | **10.34.5** | `packageManager`, `engines.pnpm`, `PNPM_VERSION` de Netlify |
   | Next.js | **16.2.12** | `package.json`, sin rango |
   | `next-intl` | Exacta, compatible con Next 16 | `package.json` |

6. **Migrar de npm a pnpm**, en una rama exclusiva y sin mezclar con ningún cambio funcional:

   ```bash
   git switch -c chore/migrate-npm-to-pnpm
   corepack enable
   corepack prepare pnpm@10.34.5 --activate
   pnpm --version                 # debe decir 10.34.5

   pnpm import                    # convierte package-lock.json en pnpm-lock.yaml
   pnpm install --frozen-lockfile
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```

   Solo si todo pasa:

   ```bash
   git rm package-lock.json
   git add package.json pnpm-lock.yaml pnpm-workspace.yaml .nvmrc
   git commit -m "chore: migrate package management from npm to pnpm"
   ```

   **Endurecimiento de la instalación** en `pnpm-workspace.yaml`:

   ```yaml
   packages:
     - '.'

   # Barrera de cadena de suministro: no resolver versiones publicadas
   # hace menos de 24 h (1440 minutos).
   minimumReleaseAge: 1440

   engineStrict: true
   nodeVersion: 24.18.0

   # Los scripts de instalación son ejecución de código: se aprueban de uno en uno.
   # ⚠️ En pnpm 10 la clave es onlyBuiltDependencies (lista).
   #    NO usar allowBuilds: es la clave de pnpm 11 y aquí no tendría efecto.
   onlyBuiltDependencies:
     - esbuild
     - sharp
   ```

   > ⚠️ **Corrección al documento de migración.** Proponía `allowBuilds` (mapa) junto con pnpm 10.34.5, y son incompatibles: `allowBuilds` **sustituyó** a `onlyBuiltDependencies` **en pnpm 11**. Con la versión 10 fijada hay que usar `onlyBuiltDependencies`. Si algún día se sube a pnpm 11, la migración es mecánica (`pnpx codemod run pnpm-v10-to-v11`), pero conviene comprobar antes que Dependabot declara soporte para pnpm 11.
   >
   > Los demás ajustes que proponía el documento —`strictDepBuilds`, `blockExoticSubdeps`, `trustPolicy: no-downgrade`, `dangerouslyAllowAllBuilds: false`— **hay que verificar uno por uno contra la documentación de la versión instalada** antes de escribirlos: varios son adiciones recientes y un ajuste que no existe se ignora en silencio, dando una falsa sensación de protección. La lista de `onlyBuiltDependencies` se genera tras una instalación limpia y se revisa a mano.
   >
   > **No añadir `shamefullyHoist: true`** salvo incompatibilidad reproducible y documentada.

7. **Dependencias del sitio.** Mucho más corta que antes, porque todo lo de servidor se ha ido al gateway:

   | Paquete | Para qué |
   |---|---|
   | `next-intl` | Mensajes y metadatos por idioma **en build** |
   | `lucide-react` | Iconos, con imports individuales |
   | `zod` | Validación de formularios **en cliente** (la del servidor vive en el gateway) |
   | `sharp` *(dev)* | Pipeline de imágenes en build |
   | `vitest` *(dev)* | Tests unitarios |
   | `@playwright/test` *(dev)* | E2E |
   | `@axe-core/playwright` *(dev)* | Accesibilidad automatizada |

   **Ya no se instalan en el sitio**: `server-only`, `better-sqlite3` y `nodemailer` — son del gateway. Tampoco `framer-motion` ni `wouter`, que estaban declarados sin uso en el proyecto actual.

8. **Scripts del `package.json`.** `next lint` **se eliminó en Next 16** y `next build` ya no ejecuta el linter: hay que invocar ESLint directamente, o el proyecto se queda sin lint sin que nadie lo note.

   ```json
   {
     "scripts": {
       "dev": "next dev",
       "clean": "node scripts/clean.mjs",
       "images:build": "node scripts/images-build.mjs",
       "build:next": "next build",
       "build": "pnpm clean && pnpm images:build && pnpm build:next && pnpm verify:export",
       "preview": "node scripts/static-server.mjs out",
       "lint": "eslint . --max-warnings=0",
       "typecheck": "tsc --noEmit",
       "test": "vitest run",
       "test:e2e": "playwright test",
       "check:i18n": "node scripts/check-i18n.mjs",
       "check:routes": "node scripts/check-routes.mjs",
       "check:age": "node scripts/check-package-age.mjs",
       "verify:architecture": "node scripts/assert-static-architecture.mjs",
       "verify:export": "node scripts/assert-static-output.mjs"
     }
   }
   ```

   > **Sin `next start` ni `start:standalone`**: no hay servidor. Para revisar el artefacto en local se sirve `out/` con `pnpm preview`.
   >
   > **Cuidado con los scripts recursivos**: `build` llama a `build:next`, nunca a un `verify` que a su vez llame a `build`. Por eso están separados.

9. **CI desde el primer día** (Fase 12). Un pipeline que solo se monta al final no se monta nunca.

10. **Configurar `next.config.ts` para exportación estática:**

    ```ts
    import type { NextConfig } from 'next'

    const nextConfig: NextConfig = {
      output: 'export',        // obligatorio: genera out/ sin runtime
      trailingSlash: true,     // /es/contacto/ → index.html, encaja con hosting estático
      poweredByHeader: false,
      images: { unoptimized: true },   // no hay optimizador en runtime; ver 11.3
      typescript: { ignoreBuildErrors: false },
    }

    export default nextConfig
    ```

    > **`redirects`, `rewrites` y `headers` de `next.config` no funcionan con `output: 'export'`.** Están en la lista oficial de funciones no soportadas. Todo eso pasa a `netlify.toml` ([Fase 10](#fase-10--cabeceras-caché-y-endurecimiento)).

11. **Un commit por paso.** No mezclar en el mismo commit la migración a pnpm, el cambio de rutas, la exportación estática y la integración con EspoCRM. Si algo se rompe, la diferencia entre revisar 40 líneas y revisar 2.000 es exactamente esta regla.

---

## Fase 1 · Sistema de diseño

Es la fuente de verdad de todo lo demás. Sale del `.docx` §1 y del mockup `image2.png`.

### 1.1 Tokens de color

En `site/src/app/globals.css`, con Tailwind 4 (`@theme`, igual que ya se hace en el proyecto actual):

```css
@import "tailwindcss";

@theme {
  --color-bg:        #0D0F11;  /* fondo base de todas las páginas */
  --color-panel:     #121518;  /* bandas y secciones destacadas */
  --color-card:      #161A1E;  /* tarjetas de servicio, precio, artículo */
  --color-border:    #262D33;  /* bordes de 1px de tarjetas y campos */
  --color-text:      #E9EDF0;  /* texto principal */
  --color-text-dim:  #8C969E;  /* texto secundario / descripciones */
  --color-cyan:      #5BD8E8;  /* destacados, enlaces, MSSP, datos */
  --color-green:     #00E48D;  /* botón primario, positivos, GRC/SentryN3t */
  --color-alert:     #E87878;  /* estados de error o incidente */
}
```

**Regla que hay que respetar:** los acentos (cian y verde) son para titulares destacados, kickers, etiquetas, iconos y botones. **Nunca para párrafos.** El cuerpo va en `--color-text` y el secundario en `--color-text-dim`. Lo pide el brief en §12 (accesibilidad) y es lo que hace que la paleta funcione.

Contrastes verificados sobre `#0D0F11` — todos pasan WCAG 2.1 AA:

| Color | Ratio aprox. | Uso permitido |
|---|---|---|
| `#E9EDF0` texto | ~17:1 | Todo, incluido cuerpo pequeño |
| `#8C969E` texto secundario | ~6:1 | Cuerpo secundario (AA normal) |
| `#5BD8E8` cian | ~12:1 | Titulares, enlaces, etiquetas |
| `#00E48D` verde | ~11:1 | Titulares, etiquetas; y como **fondo** de botón con texto `#0D0F11` |

> **No repetir el error del proyecto actual.** Hoy `Navbar.tsx` y `Footer.tsx` usan `bg-accent-cyan` / `text-accent-cyan` / `ring-accent-cyan`, clases que **no están definidas en ninguna parte** y por tanto no pintan nada. Todo color debe salir de un token de `@theme`. Prohibido el literal suelto tipo `text-[#00ffff]`, que es como está hoy medio código.

### 1.2 Tipografía

Space Mono (display/interfaz) + Noto Sans (cuerpo), vía `next/font/google` — se auto-alojan en el build y aplican `display: swap` sin configuración extra:

```ts
// site/src/app/[locale]/layout.tsx
import { Space_Mono, Noto_Sans } from 'next/font/google'

const mono = Space_Mono({
  subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono',
})
const sans = Noto_Sans({
  subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-noto-sans',
})
```

**La variable de `next/font` y el token de Tailwind no deben ser la misma.** `next/font` genera su propia variable CSS con el nombre de la fuente; el token semántico se define aparte y apunta a ella. Si se colapsan las dos, cambiar de fuente obliga a tocar todos los usos:

```css
@theme inline {
  --font-display: var(--font-space-mono);
  --font-sans:    var(--font-noto-sans);
}
```

`@theme inline` es necesario aquí (en lugar de `@theme`) porque el valor es una referencia a otra variable, no un literal.

> **Contradicción en el brief.** §1 y el mockup del sistema de diseño dicen **Space Mono + Noto Sans**; §12 («Notas técnicas») dice *«JetBrains Mono / IBM Plex Mono»*. Manda §1, porque el propio documento declara el sistema de diseño como *«fuente de verdad»* y es lo que se ve renderizado en los 13 mockups. Confirmar con dirección, pero no bloquea el desarrollo.

Escala (§1). Definirla como clases utilitarias en `globals.css` para no repetir tamaños por toda la web:

| Rol | Tamaño | Familia | Notas |
|---|---|---|---|
| Display | 44–58 px | Space Mono Bold | H1. `clamp(2.75rem, 5vw, 3.625rem)` |
| Título de sección | 28–30 px | Space Mono Bold | H2 |
| Subtítulo | 18 px | Space Mono Bold | H3 |
| Cuerpo | 15–16 px | Noto Sans Regular | Párrafos, interlineado cómodo |
| Kicker / etiqueta | 11–13 px | Space Mono Bold | MAYÚSCULAS, `letter-spacing` amplio |

### 1.3 Layout

Del mockup `image2.png`, recuadro «LAYOUT»: contenedor máximo **1440 px**, margen lateral **56 px**, rejilla de **12 columnas**, *gutter* **24 px**, radio de esquinas **8–14 px**, modo oscuro por defecto.

Breakpoints: base 0–639 · `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1440. Menú hamburguesa por debajo de 1024. Rejillas de 4 columnas → 2 en tablet → 1 en móvil.

**El margen lateral de 56 px es el de escritorio, no el de móvil.** Contenedor fluido:

```css
.site-container {
  width: min(100% - 2rem, 90rem);   /* móvil: 16 px por lado */
  margin-inline: auto;
}
@media (min-width: 48rem) { .site-container { width: min(100% - 4rem, 90rem); } }
@media (min-width: 64rem) { .site-container { width: min(100% - 7rem, 90rem); } }
```

> Un breakpoint no sustituye a mirar el contenido real. Que el layout «cambie» en 768 px no significa que quepa.

### 1.4 Componentes reutilizables (`site/src/components/ui/`)

| Componente | Especificación |
|---|---|
| `Button.tsx` | Tres variantes: **primario** (fondo verde, texto `#0D0F11`), **secundario** (fondo cian, texto oscuro), **ghost** (borde 1 px sobre transparente). Regla del brief: **un solo primario por vista**. Debe renderizar `<button>` o `<Link>` según reciba `href`. |
| `Tag.tsx` | Píldora con borde 1 px, radio completo y punto ◆ de color a la izquierda. Variantes cian / verde / neutro. Para normativa (`NIS2`) y estados (`OK`). |
| `Card.tsx` | Fondo `--color-card`, borde 1 px `--color-border`, radio 8–14 px. Prop `accent` = `'top' \| 'left' \| 'none'` para la barra de acento, y `accentColor` = cian/verde. |
| `Kicker.tsx` | `/01` o `>_` + texto en mayúsculas en color de acento. Abre cada sección. |
| `SectionHeading.tsx` | Kicker + H2. Compone los dos anteriores. |
| `CheckList.tsx` | Lista con ✓ verde. Se usa en las tarjetas de servicio destacado y en los niveles de SentryN3t. |
| `Breadcrumbs.tsx` | Migas de pan de las páginas interiores. Recibe el **array estructurado** de [2.4](#24-breadcrumbs-array-estructurado-no-una-frase-con-barras), con `label` y `href` por tramo. **No se parte ninguna cadena por `/`.** |

### 1.4.1 Server Component de build por defecto, Client Component solo por interacción

Esta regla decide cuánto JavaScript acaba en el navegador, así que se aplica desde el primer componente.

**Son Server Components de build** (sin `'use client'`): páginas, layouts, breadcrumbs, bloques de contenido, tarjetas no interactivas, el pie, la construcción de metadatos, el JSON-LD, la lectura de los JSON de traducción, la generación de sitemap y manifest, y todo el contenido legal.

**Llevan `'use client'` únicamente**: el menú móvil, el selector de idioma si necesita estado visual, el desplegable de navegación accesible, los formularios, la calculadora, el modal del CMP si finalmente existe, los filtros del blog cuando haya artículos reales, y cualquier cosa que dependa de `window`, `localStorage`, `matchMedia` o eventos.

**Los componentes de build pasan las cadenas que hace falta como props.** No se monta un provider global de traducción ni se envía `es.json` completo al navegador si el componente cliente necesita veinte cadenas:

```tsx
// Componente de build: lee los mensajes y pasa solo lo necesario
<CalculatorClient labels={calculatorLabels} locale={locale} />
```

### 1.4.2 Lo que no puede existir en el repositorio del sitio

Con `output: 'export'` estas construcciones **no funcionan**, y varias fallarían en el build en lugar de avisar antes:

```text
'use server'          Server Actions       cookies()
app/api/              draftMode()          revalidatePath()
proxy.ts              middleware.ts        revalidateTag()
runtime = 'nodejs'    runtime = 'edge'     output: 'standalone'
```

Se añade a la lista, aunque técnicamente funcionen, todo lo que señale que alguien ha vuelto a meter lógica de servidor en el sitio: **`route.ts` e `import 'server-only'`**.

> **Matiz honesto sobre `route.ts`:** con `output: 'export'` los Route Handlers **sí funcionan**, pero solo `GET` y solo resolviéndose a un fichero estático en el build. Prohibirlos por completo es una decisión de endurecimiento, no una imposición técnica: evita que alguien empiece con un `GET` inocente y acabe necesitando leer la petición. Si algún día hace falta generar un JSON estático, se hace con un script de build.
>
> Y `server-only` **no es malo** —su función es precisamente evitar filtraciones—; se prohíbe porque en esta arquitectura ya no hay código de servidor en el sitio, así que su presencia significa que alguien lo ha reintroducido.

**Control automático** — `site/scripts/assert-static-architecture.mjs`, que se ejecuta en CI **antes** del build y falla si encuentra cualquiera de lo anterior, más Netlify Functions o Edge Functions. Es la red que impide que la arquitectura se degrade sin que nadie se dé cuenta.

### 1.5 Bloques de página (`site/src/components/blocks/`)

`Hero`, `CoveragePanel` (el panel del hero de Home), `FrameworkBand`, `PillarCard`, `SentryBand`, `CtaBand`, `FeaturedServiceCard`, `DiscoverBox`, `ModelBand`, `TierCard`, `LicenseCard`, `SectorCard`, `StepList`, `TeamRoleCard`, `ArticleCard`, `Newsletter`, `CatalogBlock`.

Todos reciben su contenido por props. **Ninguno lee del JSON de traducciones directamente.** Así se pueden reutilizar entre páginas: `SentryBand` sale en Home y en Software, `CtaBand` en casi todas, `DiscoverBox` en MSSP y GRC, `CatalogBlock` en los tres catálogos.

### 1.6 Mobile-first

El diseño se implementa **primero para móvil** y se amplía después. No se maqueta escritorio y se apila al final: es lo que produce webs que técnicamente responden pero no se pueden usar con una mano.

**Anchuras de prueba obligatorias:** 320 · 360 · 375 · 390 · 414 · 768 · 820 · 1024 · 1280 · 1440 px.

**Reglas de móvil:**

| Regla | Motivo |
|---|---|
| Anchura mínima soportada **320 px**, sin scroll horizontal | Es el suelo real del mercado |
| **Inputs con fuente ≥ 16 px** | Por debajo, iOS hace zoom automático al enfocar y descoloca la página |
| Objetivos táctiles **≥ 44 × 44 px** con separación suficiente | Evita pulsaciones erróneas entre acciones contiguas |
| `env(safe-area-inset-*)` | Dispositivos con notch o barra inferior |
| **No depender de `hover`** | En táctil no existe. Los desplegables se abren por pulsación y por teclado |
| No esconder información crítica en tooltips | Inaccesible en táctil |
| Tablas legales con scroll contenido, o como tarjetas | Una tabla ancha rompe el ancho de la página |
| `tel:` en teléfonos y `mailto:` en correos | |
| `autocomplete` e `inputmode` en todos los campos | El teclado correcto y el autorrelleno del sistema |
| **El teclado virtual no debe tapar el botón principal** | Se comprueba con el foco puesto en el último campo |
| Estados de carga con espacio reservado | Evita CLS al aparecer el resultado |
| CTA principal visible **sin ocupar media pantalla** de forma permanente | |

**Tipografía fluida** — el Display de 44–58 px del sistema de diseño es el tamaño de escritorio, y **no puede ser el mínimo en 320 px**:

```css
.heading-display { font-size: clamp(2.1rem, 8vw, 3.625rem); line-height: 1.05; }
.section-title   { font-size: clamp(1.75rem, 5vw, 2rem); }
```

**Tablets (768–1024 px):** probar vertical **y** horizontal, no dar por hecho que una tablet es un escritorio, evitar rejillas de cuatro columnas, mantener el tamaño táctil y no usar `hover` para desplegables.

**Calculadora en móvil** — orden vertical: parámetros → resumen compacto → puerta → resultado → CTA. **Sin panel *sticky* y sin dos columnas por debajo de 1024 px.** El panel lateral fijo del mockup es de escritorio.

---

## Fase 2 · i18n y contenido

### 2.1 Estrategia de rutas: `/es/` y `/en/` con slugs traducidos

**Todas las páginas visibles llevan prefijo de idioma.** No hay contenido de marketing en `/`:

```text
/            → 301 fijo a /es/     (redirección en netlify.toml)
/es/…        español
/en/…        inglés
```

**No se detecta `Accept-Language`, no se guarda cookie de idioma, no se redirige por ubicación y el idioma no cambia sin acción del usuario.** Esto da URLs deterministas, caché trivial, comportamiento reproducible, una cookie menos que declarar y ninguna sorpresa para el visitante.

> **Cambio respecto a la versión anterior del plan.** Antes se usaba `localePrefix: 'as-needed'` con español en la raíz. Se sustituye porque, además de necesitar `proxy.ts` —que **no existe con `output: 'export'`**—, mezclaba dos formas de URL para el mismo contenido.

**Los slugs sí se traducen.** Es la decisión contraria a la de la versión anterior, y es la correcta para SEO en inglés:

| ES | EN |
|---|---|
| `/es/soluciones/mssp/` | `/en/solutions/mssp/` |
| `/es/soluciones/grc/` | `/en/solutions/grc/` |
| `/es/sectores/` | `/en/sectors/` |
| `/es/compania/` | `/en/company/` |
| `/es/contacto/` | `/en/contact/` |
| `/es/calculadora/` | `/en/calculator/` |
| `/es/politica-privacidad/` | `/en/privacy-policy/` |

Las marcas y siglas técnicas no se traducen: `mssp`, `grc`, `sentryn3t`, `nis2`.

### 2.1.1 Manifiesto central de rutas

Con slugs distintos por idioma, una lista escrita a mano en cada sitio es una garantía de incoherencia. Todo sale de **un único fichero**, `site/src/config/routes.ts`:

```ts
export type Locale = 'es' | 'en'

export type RouteId =
  | 'home' | 'mssp' | 'msspIt' | 'msspOt' | 'grc' | 'grcCatalog'
  | 'software' | 'sectors' | 'company' | 'contact' | 'calculator'
  | 'privacy' | 'legal' | 'cookies' | 'blog'

interface RouteDefinition {
  id: RouteId
  enabled: boolean          // false → no existe en ninguna parte
  indexable: boolean        // false → noindex y fuera del sitemap
  namespace: string         // namespace de mensajes
  paths: Record<Locale, string>
}

export const ROUTES: readonly RouteDefinition[] = [
  { id: 'home', enabled: true, indexable: true, namespace: 'home',
    paths: { es: '/es/', en: '/en/' } },
  { id: 'mssp', enabled: true, indexable: true, namespace: 'mssp',
    paths: { es: '/es/soluciones/mssp/', en: '/en/solutions/mssp/' } },
  { id: 'blog', enabled: BLOG_ENABLED, indexable: BLOG_INDEXABLE, namespace: 'blog',
    paths: { es: '/es/blog/', en: '/en/blog/' } },
  // … resto de rutas
]
```

**Lo consumen todos, sin listas paralelas:** navegación, pie, selector de idioma, `generateStaticParams`, metadatos, `sitemap.xml`, breadcrumbs, JSON-LD y las pruebas E2E. Un `check:routes` en CI verifica que no falta ningún `RouteId` y que ningún slug está duplicado dentro del mismo idioma.

### 2.1.2 Implementación en App Router

Una sola ruta atrapa todo y se resuelve por manifiesto:

```text
site/src/app/[locale]/[[...slug]]/page.tsx
```

```ts
export const dynamicParams = false     // obligatorio con output: 'export'

export function generateStaticParams() {
  return ROUTES
    .filter(r => r.enabled)
    .flatMap(r => (['es', 'en'] as const).map(locale => ({
      locale,
      slug: pathToSegments(r.paths[locale], locale),
    })))
}
```

La página valida el locale, resuelve `locale + slug` a un `RouteId`, y delega en el *renderer* correspondiente:

```ts
const PAGE_RENDERERS: Record<RouteId, PageRenderer> = {
  home: renderHome,  mssp: renderMssp,  msspIt: renderMsspIt,
  msspOt: renderMsspOt,  grc: renderGrc,  grcCatalog: renderGrcCatalog,
  software: renderSoftware,  sectors: renderSectors,  company: renderCompany,
  contact: renderContact,  calculator: renderCalculator,
  privacy: renderPrivacy,  legal: renderLegal,  cookies: renderCookies,
  blog: renderBlog,
}
```

> **No se duplican componentes de página para ES y EN.** Un renderer por página, que recibe el locale.

**`dynamicParams = false` no es opcional aquí:** las rutas dinámicas con `dynamicParams: true` y las que no tienen `generateStaticParams()` están en la lista oficial de funciones **no soportadas** por `output: 'export'`.

### 2.1.3 Selector de idioma

Recibe el `RouteId`, **nunca manipula cadenas de URL**:

```ts
getLocalizedPath(routeId, targetLocale)

// /es/soluciones/grc/#idi  →  /en/solutions/grc/#rdi
```

Debe conservar la página lógica y los fragmentos conocidos (traduciendo también el ancla), y **nunca** arrastrar datos de formularios. Si el usuario cambia de idioma con medio formulario relleno, se le avisa antes de perderlo.

### 2.1.4 Ficheros de i18n

| Fichero | Contenido |
|---|---|
| `site/src/config/routes.ts` | El manifiesto de arriba. Única fuente de rutas |
| `site/src/i18n/messages.ts` | Carga de `messages/{es,en}.json` **en build** |
| `site/messages/es.json` · `en.json` | Los mensajes |
| ~~`src/proxy.ts`~~ | **No existe.** `proxy` está en la lista de funciones no soportadas por `output: 'export'`, y la redirección de `/` la hace Netlify |


### 2.2 Ficheros de mensajes

`site/messages/es.json` y `site/messages/en.json` se construyen así:

1. **Copiar tal cual** el contenido de los dos JSON de `docs/` (282 claves, 12 namespaces: `common`, `home`, `mssp`, `grc`, `software`, `sectors`, `blog`, `company`, `contact`, `msspItCatalog`, `msspOtCatalog`, `grcCatalog`).
2. **Añadir los namespaces legales que el brief no incluye**, portados desde `web/src/i18n/locales/{es,en}.json`: `privacy`, `legal`, `cookies`. Ese texto es jurídico real de ISNOL — se copia **palabra por palabra**, sin reescribir ni «mejorar».
3. **Añadir el namespace nuevo `calculator`** con todas las etiquetas de la calculadora (Fase 5).
4. **Añadir el namespace nuevo `consent`** con los textos del banner de cookies (Fase 8).

#### Ajustes de contenido sobre el JSON del brief

Derivados de las decisiones de la sección 2:

| Clave | Cambio | Motivo |
|---|---|---|
| `common.footer.columns.legal.links[*].href` | Cambiar los tres `https://ewala.es/...` por las rutas internas `/politica-privacidad`, `/aviso-legal`, `/cookies` | Ewala es otra sociedad; la privacidad de ISNOL no puede vivir en su dominio. **Confirmado por dirección el 27/07/2026**: «los enlaces a las políticas son de ewala, están mal, hay que cambiarlos» |
| `contact.rail.contactDirect.items` | Sustituir los marcadores por `info@secnorthlabs.eu`, `+34 634 651 312`, `Calle Peña Brava 21, Of. 1B · PI de Silvota, Llanera (Asturias)`. Mantener el horario `L–V · 9:00–18:00 (CET)` | Datos reales |
| `contact.rail.incident.phone` | Dejar el bloque maquetado pero renderizarlo solo si existe `INCIDENT_PHONE` (leída en el componente de build y pasada como prop) | **No hay línea 24/7 real.** Publicar un teléfono de emergencia que nadie atiende es peor que no publicarlo |

> **Invariante permanente:** `es.json` y `en.json` deben tener el mismo conjunto de claves y los arrays la misma longitud. Se verifica con el script de la sección [Verificación](#verificación).

### 2.3 Cómo se leen los arrays de objetos

El brief guarda estructuras ricas en arrays (`home.pillars.items`, `software.tiers.items`, `sectors.items`, `common.footer.columns.*.links`…). Con `next-intl` en un componente de servidor:

```tsx
const t = await getTranslations('home.pillars')
const items = t.raw('items')
```

`t.raw()` devuelve la estructura sin interpolar. Es el equivalente del `{ returnObjects: true }` que ya se usa hoy en `Privacidad.tsx`.

**No usar `as Array<…>` para tiparlo.** Una aserción de tipo desactiva la comprobación del compilador justo donde más falta hace: si mañana alguien renombra `title` a `label` en el JSON, el `as` sigue compilando y la página revienta en producción. Dos medidas:

1. **Aumentar los tipos de mensajes de `next-intl`**, que deriva el tipado del propio `es.json` y hace que una clave inexistente sea error de compilación:

   ```ts
   // site/global.d.ts
   import type messages from './messages/es.json'

   declare module 'next-intl' {
     interface AppConfig {
       Messages: typeof messages
     }
   }
   ```

2. **Validar la forma con `zod`** al leer estructuras complejas, en `site/src/lib/content/schemas.ts`. Si el JSON no cumple, falla el build y no la página del cliente.

### 2.4 Breadcrumbs: array estructurado, no una frase con barras

La primera versión de este plan proponía coger la clave `hero.breadcrumb` («Inicio / Soluciones / MSSP») y partirla por `/`. **Es un error**: no hay destinos, se rompe con cualquier texto que contenga una barra, y el inglés no tiene por qué usar el mismo separador.

Se sustituye por un array de objetos en los ficheros de mensajes:

```json
"breadcrumb": [
  { "label": "Inicio",    "href": "/" },
  { "label": "Soluciones", "href": "/soluciones/mssp" },
  { "label": "MSSP",       "href": null }
]
```

El último elemento lleva `href: null` porque es la página actual y no se enlaza. La misma estructura alimenta el componente visual **y** el `BreadcrumbList` de datos estructurados (Fase 7), sin duplicar información.

### 2.5 Paridad estructural ES/EN

Con dos idiomas y slugs distintos, una divergencia de estructura entre `es.json` y `en.json` se manifiesta como una página inglesa reventada en producción. El script de la primera versión del plan solo comparaba nombres de clave y **longitud** de los arrays, sin mirar dentro, así que esto pasaba la prueba:

```json
// es.json                                  // en.json
[{ "title": "…", "description": "…" }]      [{ "label": "…", "text": "…" }]
```

Mismo número de elementos, estructura incompatible. Versión que **recorre también el interior de los arrays** — `site/scripts/check-i18n.mjs`:

```js
import es from '../messages/es.json' with { type: 'json' }
import en from '../messages/en.json' with { type: 'json' }

/** Firma estructural: recorre objetos Y elementos de array. */
function shape(value, path = '') {
  if (Array.isArray(value)) {
    return [
      `${path}:array(${value.length})`,
      ...value.flatMap((item, i) => shape(item, `${path}[${i}]`)),
    ]
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
  }
  return [`${path}:${typeof value}`]
}

const a = shape(es), b = shape(en)
const sa = new Set(a), sb = new Set(b)
const soloEs = a.filter(k => !sb.has(k))
const soloEn = b.filter(k => !sa.has(k))

if (soloEs.length || soloEn.length) {
  if (soloEs.length) console.error('Solo en ES:', soloEs)
  if (soloEn.length) console.error('Solo en EN:', soloEn)
  process.exit(1)
}
console.log(`OK · ${a.length} nodos con estructura idéntica`)
```

Compara nombre de clave, tipo del valor y forma de cada elemento de array. Complementa —no sustituye— la validación con `zod` de [2.3](#23-cómo-se-leen-los-arrays-de-objetos), que es la que garantiza que la estructura sea además *la que espera el componente*.

**Y una regla de contenido, no de estructura:** el inglés **no se genera automáticamente en producción**. El copy legal y de consentimiento lo traduce un profesional o lo valida jurídicamente; una traducción automática de una cláusula de privacidad es un riesgo, no un ahorro.

---

## Fase 3 · Layout común

### 3.1 Navbar (`components/layout/Navbar.tsx`)

Fija arriba, fondo `--color-bg` con borde inferior de 1 px. De izquierda a derecha:

- **Logotipo** `ISN_Labs` (wordmark blanco sobre oscuro). Enlaza a `/`.
- **Menú**: Soluciones (desplegable) · Sectores · Software · Compañía · Blog · Contacto. Claves `common.nav.*`. La página activa se subraya en cian (se ve en los mockups).
- **Desplegable «Soluciones»** — claves `common.solutionsMenu.*`, con estos destinos, deducidos de los `href` del pie del brief y de las anclas de la página MSSP:

  | Entrada | Destino |
  |---|---|
  | Ciberseguridad IT | `/soluciones/mssp#it` |
  | Ciberseguridad OT | `/soluciones/mssp#ot` |
  | GRC | `/soluciones/grc` |
  | I+D+i | `/soluciones/grc#idi` |

- **Selector de idioma** ES/EN (`common.nav.languageToggle`). Debe navegar a la misma página en el otro idioma, no a la home: usar `usePathname` de `@/i18n/navigation`.
- **CTA persistente verde**: `common.nav.cta` («Descubre qué plan de seguridad necesitas»). El brief lo deja como *«a definir»* → **apunta a `/calculadora`**. Es exactamente el diagnóstico/selector de plan que describe, y ya lo vamos a construir.
- **Menú hamburguesa** por debajo de 1024 px, con panel lateral y overlay. El comportamiento actual de `web/src/components/layout/Navbar.tsx` sirve de referencia.

### 3.2 Footer (`components/layout/Footer.tsx`)

Cuatro zonas: marca (wordmark + `common.brand.claim` + `common.footer.legalLine`) y tres columnas (`common.footer.columns.solutions | company | legal`), todas leídas del array de `links`.

Debajo: `common.footer.copyright` y, a la derecha, `common.footer.ewalaNotice` («SentryN3t® es una marca de Ewala») — **es obligatorio y no se omite**.

En la columna Legal, los tres enlaces legales. El botón **«Configurar cookies»** (`common.footer.columns.legal.cookieSettings.label`) se renderiza **de forma condicional**: solo si el CMP está activo, es decir, solo en el escenario B de la [Fase 8](#fase-8--legales-y-consentimiento-cmp). Un botón que abre un gestor de consentimiento inexistente es peor que no tenerlo.

### 3.3 Metadatos

Un helper `site/src/lib/metadata.ts` que fabrique el objeto `Metadata` de cada página a partir de su namespace SEO:

```ts
export async function buildMetadata(
  locale: string, ns: string, path: string,
): Promise<Metadata>
```

Debe producir: `title`, `description` (de `<ns>.seo.title` / `.description`), `alternates.canonical`, `alternates.languages` (`es` y `en` → `hreflang`) y Open Graph.

**No se usa `export const metadata`.** Con contenido traducido hace falta la versión asíncrona, porque hay que esperar a `params` y resolver las traducciones:

```ts
export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { locale } = await params
  return buildMetadata(locale, 'home', '/')
}
```

Dentro del helper, **pasar el `locale` explícitamente a `getTranslations`** (`getTranslations({ locale, namespace })`), no confiar en el contexto de la petición: es lo que recomienda `next-intl` para que `generateMetadata` no fuerce renderizado dinámico y la página siga siendo estática.

**Todas las páginas lo usan; nadie escribe metadatos a mano.**

### 3.4 Breadcrumbs

`components/ui/Breadcrumbs.tsx` recibe el array de [2.4](#24-breadcrumbs-array-estructurado-no-una-frase-con-barras) y renderiza `<nav aria-label="…">` con una lista ordenada. El último elemento (`href: null`) se marca con `aria-current="page"` y no se enlaza. El mismo array se pasa a `JsonLd` para el `BreadcrumbList`.

---

## Fase 4 · Las páginas

Todas siguen el mismo patrón: componente de servidor, `await params`, `setRequestLocale(locale)`, `generateMetadata` vía el helper de [3.3](#33-metadatos), y composición de bloques de la Fase 1.5. **Un solo `<h1>` por página** y jerarquía H2/H3 coherente con las secciones.

### Mapa de rutas

| # | Ruta | Namespace | Prioridad SEO |
|---|---|---|---|
| 1 | `/` | `home` | Alta |
| 2 | `/soluciones/mssp` | `mssp` | Alta |
| 3 | `/soluciones/mssp/it` | `msspItCatalog` | Media-alta |
| 4 | `/soluciones/mssp/ot` | `msspOtCatalog` | Media-alta |
| 5 | `/soluciones/grc` | `grc` | Alta |
| 6 | `/soluciones/grc/catalogo` | `grcCatalog` | Media-alta |
| 7 | `/software` | `software` | Media-alta |
| 8 | `/sectores` | `sectors` | Media |
| 9 | `/blog` | `blog` | Media |
| 10 | `/compania` | `company` | Media |
| 11 | `/contacto` | `contact` | Alta (conversión) |
| 12 | `/calculadora` | `calculator` | Conversión |
| 13 | `/politica-privacidad` | `privacy` | Baja |
| 14 | `/aviso-legal` | `legal` | Baja |
| 15 | `/cookies` | `cookies` | Baja |
| — | `not-found` | — | — |

**El número de rutas no es fijo: depende de decisiones pendientes.** El blog puede existir e indexarse, existir con `noindex` o no existir (P24). Afirmar «siempre 15 rutas × 2 idiomas» y a la vez dejar el blog condicional es una contradicción que rompería el sitemap o las pruebas.

Se resuelve con **una única fuente de verdad** en `site/src/lib/routes.ts`:

```ts
export const ROUTES = [
  { path: '/',                        ns: 'home',           enabled: true,  indexable: true },
  { path: '/soluciones/mssp',         ns: 'mssp',           enabled: true,  indexable: true },
  // …
  { path: '/blog',                    ns: 'blog',
    enabled: BLOG_ENABLED, indexable: BLOG_INDEXABLE },
  { path: '/calculadora',             ns: 'calculator',     enabled: true,  indexable: true },
  // …
] as const
```

**La consumen todas estas piezas, sin listas paralelas:** la Navbar, el pie, `sitemap.ts`, los metadatos (`robots: { index: indexable }`), `generateStaticParams` y las pruebas E2E. Cambiar `BLOG_ENABLED` a `false` retira el blog de la navegación, del sitemap y de las pruebas de una sola vez, sin tocar nada más.

Con el blog activo son 15 rutas + 404 en dos idiomas; sin él, 14.

---

### 4.1 Home — `/` · namespace `home`

Mockup `image3.png`. De arriba a abajo:

1. **Hero** a dos columnas.
   - *Izquierda*: fila de cuatro `Tag` (`hero.tags`), H1 con `hero.title` en blanco + `hero.titleHighlight` en **cian**, subtítulo, y dos botones (`ctaPrimary` verde → `/contacto`, `ctaSecondary` ghost → `/contacto`).
   - *Derecha*: **`CoveragePanel`** — tarjeta con cabecera `> servicio gestionado` + indicador `● operativo` en verde, título `panel.title`, cinco filas de `panel.rows` (✓ verde + etiqueta + línea de puntos + valor en cian a la derecha) y pie `panel.footer`.
   - En móvil el panel baja debajo del texto.
2. **`FrameworkBand`** — banda con fondo `--color-panel`: label `common.frameworksLabel` en pequeño y centrado, y los siete marcos de `common.frameworks` en Space Mono grande y espaciado.
3. **`/01 Qué hacemos`** — kicker `pillars.kicker`, H2 `pillars.title`, y cuatro `PillarCard` (rejilla 4→2→1) desde `pillars.items`: barra de acento **superior** (cian los dos MSSP, verde GRC e I+D+i), etiqueta, título, descripción y enlace `Ver servicios →`. Destinos: `/soluciones/mssp/it`, `/soluciones/mssp/ot`, `/soluciones/grc`, `/soluciones/grc#idi`.
4. **`SentryBand`** — tarjeta ancha: kicker `sentry.kicker`, H2 `sentry.title`, descripción, cuatro `Tag` de `sentry.chips`, y botón verde `sentry.cta` → `sentry.ctaUrl` (`https://www.ewala.es`) con `target="_blank" rel="noopener noreferrer"`, más la nota `sentry.note` debajo.
5. **`CtaBand`** — centrada, fondo `--color-panel`: `ctaBand.title` + `ctaBand.titleHighlight` en **verde**, subtítulo, botón primario `Descubre tu plan` → `/calculadora` y ghost `Contactar` → `/contacto`.

> **Nota crítica del brief:** *«SentryN3t NO aparece en el hero (es tecnología de partner): se destaca en su banda inferior y en la página Software»*. La web actual hace justo lo contrario.

**JSON-LD**: `Organization` + `LocalBusiness` (Asturias) — ver Fase 7.

---

### 4.2 MSSP — `/soluciones/mssp` · namespace `mssp`

Mockup `image4.png`. Breadcrumbs + Hero interior (`hero.title` blanco + `hero.titleHighlight` cian + subtítulo).

- **`/01` sección IT** (`id="it"`): kicker `it.kicker`, H2 `it.title`, y **`FeaturedServiceCard`** con **barra de acento izquierda y borde cian**: label `it.featured.label`, título, descripción, `CheckList` de cuatro ítems en dos columnas (`it.featured.includes`), y botón cian **`Calcula tu presupuesto`** → `/calculadora`.
- **`DiscoverBox` IT**: label `it.discover.label`, texto y enlace `it.discover.link` → `/soluciones/mssp/it`.
- **`/02` sección OT** (`id="ot"`): idéntico pero con **acento verde**; botón `Contáctanos` → `/contacto`; `DiscoverBox` → `/soluciones/mssp/ot`.
- **`ModelBand`**: label `model.label`, H2 `model.title`, tres ítems de `model.items` (título en cian + descripción).
- **`CtaBand`**: `cta.title`, primario `cta.ctaPrimary` → `/contacto`, ghost `cta.ctaSecondary` → `/software`.

> El JSON dice `cta.ctaSecondary: "Ver software"` y el mockup pinta «Ver licencias». **Manda el JSON**, que es el entregable de copy.

---

### 4.3 Catálogo IT — `/soluciones/mssp/it` · namespace `msspItCatalog`

Breadcrumbs + Hero. Después, recorrer `categories` (**7 bloques C1–C7, 23 servicios**) con `CatalogBlock`: código (`C1`) en cian + título + descripción del bloque, y debajo las tarjetas de `services` (título + descripción).

`CtaBand` final con `Contáctanos` → `/contacto` y `Calcula tu presupuesto` → `/calculadora`.

### 4.4 Catálogo OT — `/soluciones/mssp/ot` · namespace `msspOtCatalog`

Idéntico al anterior con acento verde. **5 bloques B1–B5, 14 servicios.** CTA secundaria → `/soluciones/mssp/it`.

---

### 4.5 GRC — `/soluciones/grc` · namespace `grc`

- **`/01` Marcos principales**: cuatro `Card` de `consulting.cards` (ENS, ISO 42001, ISO 27001, NIS2), cada una con `Tag`, título grande, descripción y `Saber más`. El brief marca cada marco como *landing SEO propia en fase 2*. Hasta que existan esas landings, **las cuatro tarjetas se renderizan sin enlace** — no apuntan a `/contacto`, según la regla general de [4.9](#49-blog--blog--namespace-blog).
- **`DiscoverBox`** → `/soluciones/grc/catalogo`.
- **`/02` I+D+i** (`id="idi"`): dos ítems de `idi.items` con etiquetas D1/D2.
- **`why`** (tres ítems) + `CtaBand` (`Hablar con GRC` → `/contacto`, `Ver servicios MSSP` → `/soluciones/mssp`).

> **Nota del brief:** no prometer plazos concretos de certificación en el copy.

### 4.6 Catálogo GRC — `/soluciones/grc/catalogo` · namespace `grcCatalog`

Rejilla plana de **11 servicios A1–A11** (`services`), cada uno con código + título + descripción. Nota `idiNote` al final y `CtaBand`.

---

### 4.7 Software — `/software` · namespace `software`

Página marcada como **clave** en el brief.

1. Hero interior.
2. **`/01` SentryN3t destacado**: nombre, `tagline`, descripción larga, cinco `Tag` de `chips`, bloque `licenseModel` (título + cuatro ítems), enlace `learnMore` → `learnMoreUrl` en pestaña nueva con `rel="noopener noreferrer"`, y las dos `notes` (incluye «SentryN3t® es una marca de Ewala»).
3. **Tres `TierCard`** de `tiers.items`: nombre, descripción, `features` con ✓, precio = **`tiers.priceLabel` («Según alcance»)** y botón `tiers.cta`. La que tiene `recommended: true` lleva **borde verde y badge `tiers.recommendedLabel`** en la esquina superior derecha (ver mockup del sistema de diseño).
4. **`/02` Licencias**: kicker, H2, subtítulo y cuatro `LicenseCard` de `licenses.cards` (Microsoft, Huntress, OPNsense, Fortinet), cada una con nombre, `subtitle`, descripción y pie `licenses.cardFooter`.
5. **`others`**: label + seis `Tag`.
6. **`how`**: cuatro pasos numerados (`StepList`).
7. **`CtaBand`**: `Pedir propuesta` → `/contacto`, `Hablar con un experto` → `/contacto`.

> **Restricciones.** Cero precios en toda la página. Y sobre los logos de Microsoft, Huntress, OPNsense, Fortinet y Ewala, el brief es explícito: *«usar según sus normas de marca (no recolorear)»*. **Hasta que Marketing entregue los ficheros oficiales, usar solo el nombre en texto.** No descargar logos de Internet.

---

### 4.8 Sectores — `/sectores` · namespace `sectors`

Hero + rejilla de **siete `SectorCard`** (`items`: título, descripción, `Tag` con el driver regulatorio) en tres columnas en escritorio y una en móvil. Debajo, la nota `note` sobre el RGPD transversal. `CtaBand` con `Contactar`.

Los siete sectores y su driver: Industria y fabricación (NIS2 · IEC 62443), Agroalimentario (NIS2), Energía (NIS2), Sanidad (NIS2), Cadena de suministro (NIS2 · responsabilidad delegada), Administración pública (ENS) y Finanzas y seguros (DORA).

---

### 4.9 Blog — `/blog` · namespace `blog`

**No hay CMS ni contenido real todavía** (el brief lo deja como *«definir CMS»*, y sus seis artículos están declarados como placeholders).

> ⚠️ **No se publica un blog ficticio.** La primera versión de este plan proponía maquetar los seis artículos de ejemplo y ocultar solo el aviso `articlesNote` en producción. Eso deja publicados seis titulares inventados con tiempos de lectura inventados, en tarjetas que no llevan a ninguna parte o que redirigen a `/contacto`. Para una consultora que vende criterio técnico es un daño de credibilidad mayor que no tener blog, y las tarjetas sin destino son una experiencia engañosa.

**Qué se hace en su lugar** — una de estas tres, a decidir con Marketing (pendiente P8):

| Opción | Implementación |
|---|---|
| **A · Página «Próximamente»** *(recomendada)* | Hero + explicación de la línea editorial + bloque de newsletter funcional. Sin tarjetas de artículos. `/blog` indexable, porque el contenido es real |
| **B · `noindex`** | Se maqueta la rejilla completa pero la página lleva `robots: { index: false }`, no entra en el sitemap y no se enlaza desde la navegación |
| **C · Ruta desactivada** | `/blog` no existe todavía: fuera de la navegación, fuera del sitemap y fuera del pie |

En las tres opciones el **bloque de newsletter sí es real y funcional** (`newsletter.*`), porque captar suscriptores antes de tener artículos es legítimo y útil.

Cuando haya contenido real: filtros por categoría (`categories`), artículo destacado (`featured`), rejilla de `ArticleCard` y plantilla de detalle con `BlogPosting`.

**Regla general que aplica a todo el sitio:** ningún enlace apunta a `/contacto` como sustituto de una página que aún no existe. O el destino es real, o el elemento no se enlaza. Esto afecta también a las cuatro tarjetas de marco de la [página GRC](#45-grc--solucionesgrc--namespace-grc) y a las tarjetas de sector: se renderizan sin enlace hasta que existan sus landings.

---

### 4.10 Compañía — `/compania` · namespace `company`

Hero + fila de cuatro `stats` + `/01 mission` (kicker, `line1` y `line2` como dos líneas destacadas, `body`) + `/02 values` (cuatro ítems) + `/03 team` (ocho `TeamRoleCard` de `team.roles`) + `CtaBand`.

Se muestran **roles, no nombres**. El brief pide fotos reales en fase 2; por ahora, placeholder con la inicial.

---

### 4.11 Contacto — `/contacto` · namespace `contact`

Mockup `image10.png`. Página **clave**. Dos columnas: formulario a la izquierda (Fase 6) y raíl derecho con tres tarjetas:

- **`rail.contactDirect`** — cuatro pares label/valor. Email como `mailto:`, teléfono como `tel:`.
- **`rail.whatNext`** — tres pasos numerados en círculos verdes.
- **`rail.incident`** — tarjeta con **borde y título en `--color-alert`**. El teléfono debe ser enlace `tel:` en móvil. Solo se renderiza si existe `INCIDENT_PHONE`, que se lee en build y llega como prop.

### 4.12 Calculadora — `/calculadora` · namespace `calculator`

Ver [Fase 5](#fase-5--calculadora-pbcg) completa.

---

### 4.13–4.15 Legales — `/politica-privacidad`, `/aviso-legal`, `/cookies`

Se **portan desde `web/src/components/sections/{Privacidad,Aviso,Cookies}.tsx`**:

1. El texto sale de los namespaces `privacy`, `legal`, `cookies` de los mensajes (Fase 2.2), leyendo los arrays con `t.raw()` igual que hoy se hace con `returnObjects: true`.
2. Los datos del responsable **están hoy incrustados en el JSX**, no en el JSON (`Privacidad.tsx:18-21`: `Innovation & NORTH LABS SL`, `Calle Peña Brava 21...`, `B22966139`, `info@secnorthlabs.eu`). Al portar, **moverlos a claves de traducción** y **corregir la razón social** al valor correcto: **`Innovation and Security North Labs SL`**. Hoy dice «Innovation & NORTH LABS SL», que no es la denominación registrada según `common.brand.legalName`.
3. Reestilizar con los tokens nuevos. **No reescribir ni resumir el texto jurídico.**
4. Añadir a la página de cookies la tabla de categorías del CMP (Fase 8).
5. `NotFound` se porta a `app/[locale]/not-found.tsx`. La lluvia binaria actual usa `Math.random()` en render, lo que rompe la hidratación en SSR → **generar los valores en un `useEffect`** tras el montaje, o sustituir la animación por un gradiente CSS, más acorde con el objetivo de LCP del brief.

> ⚠️ **`app/[locale]/not-found.tsx` no captura por sí solo todas las rutas desconocidas.** Es una limitación documentada de `next-intl`: una URL que no encaja con ningún segmento conocido nunca llega al layout del idioma, así que no ve la 404 traducida. Hacen falta tres piezas:
>
> | Fichero | Función |
> |---|---|
> | `app/[locale]/not-found.tsx` | 404 traducida, para `notFound()` lanzado dentro de una ruta con idioma válido |
> | `app/[locale]/[...rest]/page.tsx` | Ruta comodín que solo llama a `notFound()`. Es la que atrapa `/soluciones/inventado` |
> | `app/not-found.tsx` (raíz) | Último recurso, sin traducciones, para lo que no lleva idioma reconocible |
>
> Hay que probar las tres: `/inventado`, `/en/inventado` y `/soluciones/mssp/inventado`.

---

## Fase 5 · Calculadora PBCG

La pieza con más riesgo de error, y la que tiene el bloqueante más grave del plan original.

### 5.1 Arquitectura: el cálculo vive en otro repositorio

> **Esta fase se implementa en `isnlabs-web-gateway`, no en el sitio.** La calculadora del sitio es solo formulario y presentación.

**B01.** La primera versión de este plan ponía `config.ts` y `calc.ts` en `src/lib/` y los importaba desde el componente de la calculadora. Como ese componente es de cliente, el resultado real habría sido:

- Las tarifas (57 €/h, 65 €/h, 3 €, 6,58 €) y **todos** los coeficientes, publicados en el JavaScript del navegador.
- El algoritmo económico completo, legible y reproducible por cualquiera.
- **La puerta de captación de leads, evitable**: abrir DevTools, llamar a la función y obtener el precio sin dejar ni el nombre.
- Si el servidor aceptara la horquilla calculada por el navegador, se podría manipular el importe enviado al CRM.

Es decir: el plan decía «modelo protegido con captación obligatoria» y montaba «modelo público sin puerta». Hay que elegir una de las dos, y **la elegida es la protegida**.

La migración a arquitectura estática lo resuelve de forma **más fuerte que `server-only`**: el motor no está en el repositorio que Netlify compila, así que no puede filtrarse ni por descuido ni por un `import` mal puesto.

```text
[Navegador — sitio estático]
  Datos de contacto + parámetros técnicos
        │
        ▼  POST /api/quote/initial   (proxy firmado de Netlify)
[Web Gateway — otro repositorio, otra máquina]
  1. Verifica la firma de Netlify
  2. Valida el lead
  3. Valida los parámetros técnicos (zod)
  4. Calcula la oferta   ← única vez que se calcula, y aquí
  5. Persiste la submission
  6. Encola la sincronización con EspoCRM
        │
        ▼
Devuelve solo: submissionToken + PublicQuoteDto
```

**Reparto de ficheros entre los dos repositorios:**

```text
isnlabs-site/src/
├── lib/pbcg/
│   ├── types.ts        ← tipos del formulario y DTO público (generados del OpenAPI)
│   ├── schemas.ts      ← zod de validación de UX en cliente
│   └── format.ts       ← formateo de importes para pantalla
└── components/calculadora/    ← formulario y presentación

isnlabs-web-gateway/src/domain/pbcg/     ← NADA de esto llega a Netlify
├── config.ts           tarifas, coeficientes, umbrales
├── calculate.ts        la lógica
├── schemas.ts          validación de servidor
├── types.ts            InternalCalculationResult
├── model-version.ts    PBCG_MODEL_VERSION
└── calculate.test.ts   el caso de oro y la batería
```

**Reglas no negociables:**

1. **El repositorio del sitio no contiene ninguna tarifa ni coeficiente.** Ni en código, ni en JSON, ni en comentarios, ni en tests.
2. El gateway **recalcula siempre**. No acepta como fiable ningún `total`, `horquilla`, `tamaño` ni `horas` que llegue del navegador: si viene en el cuerpo de la petición, se ignora.
3. La respuesta contiene solo el `PublicQuoteDto`, con lo que el usuario va a ver en pantalla. Nada de coeficientes ni de desglose de horas internas.
4. `assert-static-architecture.mjs` y `assert-static-output.mjs` comprueban en cada build que no hay rastro del modelo en `out/` ([Fase 12](#fase-12--pruebas-ci-y-e2e)).

### 5.2 Parámetros — `gateway/src/domain/pbcg/config.ts`

Espejo literal de la hoja `PARAMETROS` y de los dos bloques editables de `AUDITORIAS`. Un único fichero, comentado con la celda de origen para que quien actualice tarifas sepa exactamente qué tocar.

```ts
// gateway/src/domain/pbcg/config.ts
// Este fichero vive en el repositorio del gateway. No existe en el del sitio,
// y por tanto nunca puede acabar en el bundle que publica Netlify.

export type Size = 'S' | 'M' | 'L'

export const PBCG = {
  // ── PARAMETROS · tarifas y precio ──
  tarifaTecnica: 57,        // B5  €/h PVP
  tarifaAuditoria: 65,      // B6  €/h PVP perfil auditor/ofensivo
  redondeo: 5,              // B9  el PVP final se redondea a este múltiplo
  horquillaAbajo: 0.05,     // B10 solo sobre el servicio gestionado
  horquillaArriba: 0.15,    // B11

  // ── PARAMETROS · coeficientes de horas técnicas (h/mes) ──
  coef: {
    edrBase: 1,             // B14 gestión de consola y políticas
    edrUsuario: 0.05,       // B15 revisión semanal de alertas
    backupBase: 1,          // B16 supervisión semanal de jobs
    backupServidor: 0.25,   // B17 incluye prorrateo de la restauración semestral
    firewallPorEquipo: 1,   // B18 revisión de alertas, logs y reglas
    siemBase: 4,            // B19 revisión semanal de eventos
    siemUsuario: 0.02,      // B20
    parcheoServidor: 0.4,   // B21 ventanas de despliegue y verificación
    parcheoUsuario: 0.03,   // B22 puestos de trabajo
    otPorInstalacion: 2,    // B23 supervisión pasiva de entorno OT
    cpdPropioOHibrido: 1,   // B24 revisiones adicionales de infraestructura propia
    sedeAdicional: 0.5,     // B25 coordinación y elementos de red por sede
    servidorFisico: 0.1,    // B26 vigilancia de hardware/firmware
  },

  // ── PARAMETROS · licencias (€/usuario/mes) ──
  // TODO(negocio): MARCADORES DE POSICIÓN. Confirmar con el distribuidor
  // antes de usar estas cifras en ofertas reales (ver PORTADA del Excel).
  licencias: {
    edrDefender: 3,         // B29
    mdrHuntress: 6.58,      // B30
  },

  // ── PARAMETROS · umbrales de tamaño ──
  umbrales: { usuariosS: 25, usuariosM: 75, sedesS: 1, sedesM: 3 },  // B33..B36

  // ── AUDITORIAS · horas por ejecución y tamaño ──
  // Claves explícitas S/M/L, NO arrays posicionales: un array [8,12,20]
  // se puede reordenar sin que nada falle, y el error sería invisible.
  auditoriaHoras: {
    vulnerabilidades:     { S: 8,  M: 12, L: 20 },
    pentest:              { S: 24, M: 40, L: 64 },
    hardening:            { S: 12, M: 16, L: 24 },
    firewallArquitectura: { S: 6,  M: 8,  L: 12 },
    identidades:          { S: 8,  M: 10, L: 14 },
    retest:               { S: 4,  M: 6,  L: 8  },
  },

  // ── AUDITORIAS · ejecuciones/año por variante ──
  // Igual: nombre de la prueba, no posición en un array.
  auditoriaEjecuciones: {
    nis2:     { vulnerabilidades: 2, pentest: 1, hardening: 0,
                firewallArquitectura: 1, identidades: 0, retest: 1 },  // 50/78/124 h año
    ensMedia: { vulnerabilidades: 2, pentest: 1, hardening: 1,
                firewallArquitectura: 1, identidades: 0, retest: 1 },  // 62/94/148 h año
    ensAlta:  { vulnerabilidades: 4, pentest: 1, hardening: 1,
                firewallArquitectura: 1, identidades: 1, retest: 2 },  // 90/134/210 h año
  },
} as const

// Tipado que impide olvidar un tamaño o inventarse una prueba
type Prueba = keyof typeof PBCG.auditoriaHoras
const _horas: Record<Prueba, Record<Size, number>> = PBCG.auditoriaHoras
const _ejec: Record<'nis2'|'ensMedia'|'ensAlta', Record<Prueba, number>> =
  PBCG.auditoriaEjecuciones
```

Se calculan las horas de auditoría a partir de los dos bloques editables (como hace el Excel con `SUMPRODUCT`) en lugar de copiar los totales ya prorrateados. Así, si dirección cambia una periodicidad, se toca un número y todo cuadra.

> **Por qué no arrays.** La versión anterior usaba `[8, 12, 20]` para S/M/L y `[2, 1, 0, 1, 0, 1]` para las ejecuciones, con la nota «mismo orden que arriba». Basta con que alguien inserte una prueba nueva en medio de un bloque y no del otro para que todos los presupuestos salgan mal, sin ningún error visible: los números siguen siendo números. Con claves nombradas, ese fallo es un error de compilación.

### 5.3 Lógica de cálculo — `gateway/src/domain/pbcg/calculate.ts`

Sin React, sin DOM, sin traducciones. Entrada → salida. **Solo de servidor.**

Los tipos van en `src/lib/pbcg/types.ts`, que **sí** puede importar el cliente: son la forma del formulario, no el modelo económico.

```ts
export type Cpd = 'externo' | 'propio' | 'hibrido'
export type Edr = 'ninguno' | 'edr' | 'mdr'
export type Modulo = 'ninguno' | 'nis2' | 'ensMedia' | 'ensAlta'

export interface CalcInput {
  sedes: number
  usuarios: number
  cpd: Cpd
  srvFisPropio: number
  srvVirPropio: number
  srvFisExt: number
  srvVirExt: number
  instalacionesOT: number
  edr: Edr
  licenciasIncluidas: boolean
  backup: boolean
  firewalls: number
  siem: boolean
  parcheo: boolean
  horasConsultoria: number
  modulo: Modulo
}
```

> ⚠️ **El campo de renting de firewall se elimina por completo de esta versión.** No aparece en `CalcInput`, ni en la fórmula, ni en el resultado, ni en el desglose visual. La versión anterior lo dejaba «a cero», que es peor que quitarlo: un campo fijo a cero que nadie sabe si algún día se rellena es una trampa esperando.
>
> **Motivo.** El diseño original lo dejaba como un importe en euros que **escribía el visitante** y se sumaba a su propia cotización: cualquiera podía poner 0 €, 1 € o 10.000 €. Hay tres lecturas posibles y ninguna funciona sin decidirla antes:
>
> | Interpretación | Consecuencia si se elige |
> |---|---|
> | Coste de un contrato de renting que el cliente ya tiene | Dato informativo: **no se suma al PVP de ISN Labs** |
> | Precio de renting que **ofrece** ISN Labs | La entrada pasa a ser `numeroFirewallsRenting: number` + `tipoFirewall: 'pequeno' \| 'medio' \| 'avanzado'`, y **el precio sale de la configuración de servidor**, nunca del formulario |
> | Campo interno para el equipo comercial | No aparece en la calculadora pública |
>
> **Consecuencia práctica: el pendiente P21 deja de bloquear el desarrollo.** Solo bloquearía una futura versión que incluya renting, que se tratará como ampliación con su propio `PBCG_MODEL_VERSION`.

#### Paso 0 · Validar (no normalizar)

**B06.** La versión anterior ponía a cero en silencio los servidores incompatibles con el CPD elegido y seguía calculando. Eso puede producir una cotización **más barata que la real**: quien marque «CPD propio» y rellene los servidores externos verá un precio que no incluye esos servidores. Se corrige en [5.4](#54-validación-de-entrada-y-errores-bloqueantes): es un **error bloqueante**, no un aviso.

Cuando el cálculo se ejecuta, la entrada ya está validada y es coherente:

```
srvTotal   = srvFisPropio + srvVirPropio + srvFisExt + srvVirExt
srvFisicos = srvFisPropio + srvFisExt
```

#### Paso 2 · Tamaño del cliente (S/M/L) — `CALCULADORA!E6`

```
uN = usuarios <= 25 ? 1 : usuarios <= 75 ? 2 : 3
sN = sedes    <= 1  ? 1 : sedes    <= 3  ? 2 : 3
n  = max(uN, sN)
si (instalacionesOT > 0 || cpd !== 'externo')  n = min(3, n + 1)
tamano = ['S', 'M', 'L'][n - 1]
```

Regla textual del Excel: *«el tamaño lo marca el peor de los dos criterios; tener OT, CPD propio o híbrido sube un escalón (máx. L)»*.

#### Paso 3 · Horas técnicas mensuales — `E7:E16` → `E17`

```
h = 0
si edr !== 'ninguno'  → h += edrBase + usuarios * edrUsuario
si backup             → h += backupBase + srvTotal * backupServidor
                        h += firewalls * firewallPorEquipo
si siem               → h += siemBase + usuarios * siemUsuario
si parcheo            → h += srvTotal * parcheoServidor + usuarios * parcheoUsuario
                        h += srvFisicos * servidorFisico
                        h += instalacionesOT * otPorInstalacion
si cpd !== 'externo'  → h += cpdPropioOHibrido
                        h += max(0, sedes - 1) * sedeAdicional
                        h += horasConsultoria

h = Math.round(h * 2) / 2        // bloques de 0,5 h, como el contrato
```

#### Paso 4 · Horas de auditoría mensuales — `E18`

```
si modulo === 'ninguno' → hAud = 0
si no → hAud = Σ_prueba ( auditoriaHoras[prueba][tamano]
                          × auditoriaEjecuciones[modulo][prueba] ) / 12
```

Se recorre por **nombre de prueba**, no por índice.

#### Paso 5 · Resultado económico — `E22:E28`

**Los factores de la horquilla salen de la configuración, no escritos a mano.** La versión anterior definía `horquillaAbajo: 0.05` / `horquillaArriba: 0.15` y luego usaba `0.95` y `1.15` literales: dos fuentes de verdad para el mismo número, de modo que cambiar la configuración no habría cambiado el resultado.

```ts
const factorBajo = 1 - PBCG.horquillaAbajo    // 0.95
const factorAlto = 1 + PBCG.horquillaArriba   // 1.15
```

```
servicioGestionado = h * tarifaTecnica
moduloAuditoria    = hAud * tarifaAuditoria
licencias          = (licenciasIncluidas && edr !== 'ninguno')
                       ? usuarios * (edr === 'edr' ? licencias.edrDefender
                                                   : licencias.mdrHuntress)
                       : 0
fijos              = moduloAuditoria + licencias

total               = mroundCents(servicioGestionado + fijos)
horquillaGestionado = [ mroundCents(servicioGestionado * factorBajo),
                        mroundCents(servicioGestionado * factorAlto) ]
horquillaTotal      = [ mroundCents(servicioGestionado * factorBajo + fijos),
                        mroundCents(servicioGestionado * factorAlto + fijos) ]
```

La horquilla **se aplica solo al servicio gestionado**, porque ahí está la incertidumbre de horas; licencias y módulo se suman como importe fijo. Está dicho literalmente en el Excel (`CALCULADORA!D33`).

> **No calcular ni devolver** tarifa efectiva ni margen bruto.

#### Paso 6 · Orden exacto de redondeo

Decir «todo en céntimos» no resuelve el problema por sí solo, porque el módulo de auditoría produce decimales periódicos: `62 h/año ÷ 12 × 65 € = 335,8333…`. Hay que fijar **en qué momento exacto se redondea**, o dos implementaciones igual de razonables darán importes distintos.

**El Excel no redondea ningún componente intermedio.** Mantiene precisión completa en `E22`, `E23` y `E24`, y aplica `MROUND` una sola vez, al final, sobre la suma (`E26`). Se replica ese comportamiento exactamente:

```
1. horasAnuales   = Σ (horas por ejecución × ejecuciones/año)     ← entero
2. costeAnual     = horasAnuales × tarifaAuditoria                ← entero
3. moduloMensual  = costeAnual / 12                               ← SIN redondear
4. servicioGestionado = horasTecnicas × tarifaTecnica             ← SIN redondear
5. licencias      = usuarios × precioLicencia                     ← SIN redondear
6. Sumar los componentes                                          ← SIN redondear
7. mroundCents(...) UNA SOLA VEZ sobre cada importe final          ← aquí se redondea
```

`mroundCents` recibe el valor en céntimos y redondea al múltiplo comercial:

```ts
const REDONDEO_CENTS = PBCG.redondeo * 100   // 5 € → 500 céntimos

/** Convierte euros con decimales a céntimos enteros sin arrastrar error de coma flotante. */
const toCents = (euros: number): number => Math.round(euros * 100)

function mroundCents(cents: number): number {
  return Math.round(cents / REDONDEO_CENTS) * REDONDEO_CENTS
}
```

> ⚠️ **No redondear el componente mensual de auditoría al céntimo antes de sumar.** En el caso de oro da el mismo resultado, pero no en todos: introduce una desviación respecto al Excel que aparecería más adelante en un caso cualquiera, y entonces nadie sabría cuál de los dos está mal. **El Excel es la referencia** y el caso de oro fija este comportamiento.
>
> Hay que **contrastarlo con el Excel** en los nueve casos de módulo × tamaño, no solo en el de oro. Está en la batería de [5.5](#55-batería-de-tests--gatewaysrcdomainpbcgcalculatetestts).

#### Paso 7 · Dos resultados: interno y público

El resultado interno tiene lo que necesitan los tests, el CRM y los logs técnicos. El DTO público tiene **solo lo que se ve en pantalla**. Mezclarlos fue una incoherencia de la versión anterior: el caso de oro comprueba horas técnicas y el total exacto de 840 €, que no estaban en el tipo devuelto.

```ts
// ── src/server/pbcg/types.ts · SOLO SERVIDOR ──
export interface InternalCalculationResult {
  modelVersion: string
  size: Size
  technicalHours: number
  auditHoursAnnual: number
  managedServiceCents: number
  auditCents: number
  licenceCents: number
  exactTotalCents: number          // sin redondeo comercial
  managedRangeCents: [number, number]
  totalRangeCents: [number, number]
}

// ── src/lib/pbcg/types.ts · lo que viaja al navegador ──
export interface PublicQuoteDto {
  size: Size
  licenceCents: number
  auditCents: number
  managedRangeCents: [number, number]
  totalRangeCents: [number, number]
  currency: 'EUR'
}
```

- **El test de oro trabaja con `InternalCalculationResult`.**
- **La API devuelve exclusivamente `PublicQuoteDto`.**
- La conversión vive en una única función `toPublicDto()`, para que nadie devuelva el objeto interno por descuido.

#### Paso 8 · Versión del modelo económico

```ts
export const PBCG_MODEL_VERSION = '2026-07-v2'
```

Se sube a mano cada vez que cambie una tarifa, un coeficiente o una periodicidad, y se guarda en:

- El registro `submission` de la bandeja de salida.
- El `quote_snapshot` que se congela al pedir la propuesta.
- El Lead de EspoCRM (campo `quoteModelVersion`).
- Los logs técnicos, sin datos personales.

Sin esto, cuando alguien pregunte en octubre por qué una oferta de julio decía 815 € no habrá forma de saber con qué tarifas se calculó. Y como las tarifas están marcadas como pendientes de confirmar (P1), va a pasar.

#### Diferencias respecto al prototipo HTML

El HTML es un espejo desactualizado del Excel. Se implementa la columna de la derecha:

| Concepto | Prototipo HTML | Excel v2 → **se implementa** |
|---|---|---|
| Tarifa técnica | 50 €/h | **57 €/h** |
| SIEM-XDR base | 2 h/mes | **4 h/mes** |
| Licencia EDR | 4,50 €/usuario | **3,00 €/usuario** |
| Licencia MDR | 7,00 €/usuario | **6,58 €/usuario** |
| Horquilla inferior | −10 % | **−5 %** |


### 5.4 Validación de entrada y errores bloqueantes

`src/lib/pbcg/schemas.ts` define el esquema `zod` que usan **el cliente y el servidor**, para que los mensajes sean idénticos y no haya dos verdades.

**Reglas por campo:**

| Campo | Regla |
|---|---|
| `sedes` | Entero, 1–50 |
| `usuarios` | Entero, 1–2000 |
| `srv*` | Entero, ≥ 0. Físicos ≤ 200, virtuales ≤ 500 |
| `instalacionesOT` | Entero, 0–20 |
| `firewalls` | Entero, 0–50 |
| `horasConsultoria` | Uno de 0, 2, 4, 6 |
| `cpd`, `edr`, `modulo` | Solo los valores del enum |

Se rechazan explícitamente: **negativos, decimales donde se espera entero, `NaN`, `Infinity`, notación científica y valores por encima del máximo**. Un formulario numérico sin estas comprobaciones es la vía más fácil de sacar un presupuesto absurdo.

**Error bloqueante de coherencia CPD ↔ servidores (B06):**

| Situación | Comportamiento |
|---|---|
| `cpd === 'propio'` y hay servidores externos (`srvFisExt + srvVirExt > 0`) | **No se genera presupuesto.** Mensaje: «Has indicado CPD propio pero hay servidores externos. Selecciona CPD híbrido o elimina los servidores externos» |
| `cpd === 'externo'` y hay servidores propios (`srvFisPropio + srvVirPropio > 0`) | **No se genera presupuesto.** Mensaje equivalente |

El servidor devuelve `400` con el código de error, y el botón de la calculadora queda deshabilitado mientras exista la incoherencia. **No se pone nada a cero en silencio.**

> **Caso concreto a probar:** el usuario elige «Híbrido», rellena los cuatro campos de servidores, y luego cambia a «Propio». Los valores externos siguen en el estado del formulario aunque sus campos estén ocultos. Debe saltar el error, no calcularse un presupuesto barato. Está en la batería de tests de [5.5](#55-batería-de-tests--gatewaysrcdomainpbcgcalculatetestts).

### 5.5 Batería de tests — `gateway/src/domain/pbcg/calculate.test.ts`

#### Test de oro

El propio Excel trae un caso resuelto (columna B de `CALCULADORA`). Debe pasar antes de tocar la interfaz.

**Entrada:** 1 sede · 25 usuarios · CPD externo · 1 servidor físico externo + 3 virtuales externos · 0 OT · EDR Defender con licencias incluidas · backup sí · 1 firewall · SIEM no · parcheo no · 2 h de consultoría · módulo `ensMedia`.

**Salida esperada:**

| Magnitud | Valor |
|---|---|
| Tamaño | `S` |
| Horas técnicas/mes | `7.5` |
| Horas auditoría/mes | `5.1666…` |
| Servicio gestionado | `427,50 €` |
| Módulo auditoría | `335,83 €` |
| Licencias | `75 €` |
| **Total redondeado** | **`840 €`** |
| Horquilla gestionado | `405 – 490 €` |
| **Horquilla total** | **`815 – 900 €`** |

#### Un solo test de oro no basta

Cuadrar un caso no demuestra que el modelo esté bien: demuestra que ese caso está bien. Batería mínima:

**Fronteras de tamaño** — es donde vive el error típico de `<` frente a `<=`:

- Usuarios **25, 26, 75 y 76** → S, M, M, L.
- Sedes **1, 2, 3 y 4** → S, M, M, L.
- Los dos criterios en conflicto (10 usuarios y 5 sedes) → manda el peor.

**Escalón por OT y CPD:**

- 0 vs 1 instalación OT, todo lo demás igual → sube un escalón.
- CPD externo / propio / híbrido → propio e híbrido suben escalón.
- Un caso ya en `L` con OT → **se queda en `L`**, no desborda.

**Módulos de auditoría:**

- Los 3 módulos × los 3 tamaños = 9 casos, comprobados contra las horas anuales del Excel (50/78/124, 62/94/148, 90/134/210).
- `modulo: 'ninguno'` → `moduloAuditoria === 0`.

**Licencias:**

- `edr: 'edr'` con licencias → 3 €/usuario.
- `edr: 'mdr'` con licencias → 6,58 €/usuario.
- `edr: 'ninguno'` con `licenciasIncluidas: true` → **licencias = 0**.
- `edr: 'edr'` sin licencias → 0.

**Extremos:**

- Todos los servicios desactivados y 0 h de consultoría.
- Valores mínimos de todos los campos.
- Valores máximos de todos los campos.
- Importes que caen **justo en el punto medio del redondeo** (múltiplos de 2,50 €).

**Validación (deben fallar):**

- Números negativos, decimales donde se espera entero, `NaN`, `Infinity`, cadenas.
- Valores por encima del máximo.
- Incoherencia CPD ↔ servidores, en los dos sentidos.
- **Cambio de híbrido a propio conservando los valores antiguos** — el caso descrito en [5.4](#54-validación-de-entrada-y-errores-bloqueantes).

**Invariantes** — se comprueban sobre entradas generadas, no sobre casos escritos a mano:

```ts
// 1. El total siempre cae dentro de la horquilla
expect(horquillaTotal[0]).toBeLessThanOrEqual(total)
expect(total).toBeLessThanOrEqual(horquillaTotal[1])

// 2. Monotonía: añadir usuarios o activar un servicio nunca abarata
//    Si algún día una regla comercial rompe esto, debe estar
//    documentada aquí y el test cambiarse a propósito.
expect(precio({...base, usuarios: 50})).toBeGreaterThanOrEqual(
  precio({...base, usuarios: 49}))
```

La segunda invariante es la más valiosa: detecta errores de signo y de redondeo que ningún caso concreto revela.

#### Que el modelo no se filtre: ahora es una propiedad de la estructura

Con los dos repositorios separados, la comprobación ya no es «que ningún componente cliente importe el motor», sino **que el motor no exista en el repositorio del sitio**. Lo verifica `assert-static-output.mjs` sobre el artefacto ([12.3](#123-verifyexport--inspeccionar-el-artefacto)):

```bash
# En el repositorio del sitio: ni el código ni el artefacto contienen tarifas
grep -rE "\b6\.58\b|edrUsuario|tarifaTecnica|auditoriaEjecuciones" src/ out/   # sin resultados
```

Es más fuerte que la versión anterior: antes dependía de que nadie borrara un `import 'server-only'`; ahora **no hay nada que borrar**, porque el fichero no está en ese repositorio.

### 5.6 Interfaz — `site/src/components/calculadora/`

Rediseñada con el sistema de diseño ISN Labs. **El prototipo HTML es blanco y monoespaciado a propósito** (parece una hoja de cálculo); no se replica su aspecto, solo su flujo. Dos columnas, con el panel derecho *sticky*.

El flujo completo está en [5.7](#57-los-tres-endpoints-de-la-calculadora), porque es la parte donde la primera versión se equivocó.

**Descarte de respuestas fuera de orden.** Las recotizaciones son asíncronas, así que una petición lenta con 25 usuarios puede llegar **después** de otra con 50 y sobrescribir el resultado nuevo con el viejo. El usuario vería un precio que no corresponde a lo que tiene en pantalla. Se resuelve con `AbortController` —cancelar la anterior al lanzar la siguiente— y además un contador secuencial: se descarta cualquier respuesta cuyo número sea menor que el último aplicado. Hacen falta las dos cosas: `AbortController` no garantiza que la cancelación llegue antes de que el servidor responda.

#### Columna izquierda — tres bloques (`fieldset` con `legend`)

1. **Tu organización**: sedes (1–50), usuarios de IT (1–2000), CPD (select externo/propio/híbrido), servidores, instalaciones OT (0–20).
   Los campos de servidores **se muestran u ocultan según el CPD**: `propio` y `externo` enseñan cada uno su par; `híbrido`, los cuatro.
2. **Servicios gestionados**: EDR/MDR (`Ya lo tengo cubierto` / `EDR gestionado (Defender)` / `MDR gestionado (Huntress)`), licencias incluidas Sí/No, supervisión de backup Sí/No, número de firewalls, SIEM-XDR Sí/No, parcheo Sí/No, horas de consultoría (0/2/4/6).
   > El campo de renting de firewall **no existe en esta versión** — ver [5.3](#53-lógica-de-cálculo--gatewaysrcdomainpbcgcalculatets).
3. **Cumplimiento normativo**: módulo de auditorías (Sin auditorías / NIS2 Ready / ENS Media / ENS Alta).

#### Columna derecha — dos estados

**`LeadGate`** (estado inicial): *«Dinos quién eres y te mostramos la cuota orientativa al momento. Sin llamadas comerciales no solicitadas.»* Campos: nombre\*, apellidos\*, email profesional\*, teléfono. Validación en cliente (formato de email) y **casilla obligatoria que acredita que se ha mostrado y leído la información básica sobre protección de datos**, con enlace a `/politica-privacidad`. Misma redacción y mismo tratamiento que en [6.1](#61-campos-y-validación--componentsformscontactformtsx): no es un consentimiento genérico.

> El prototipo no lleva el checkbox de consentimiento. **Es imprescindible** y se añade.

**`CalcResult`** (tras la puerta): «Cotización preparada para {nombre}», etiqueta `Servicio gestionado`, la **horquilla en grande**, `€/mes · impuestos no incluidos`, y desglose con Licencias / Auditorías NIS2-ENS / **TOTAL** (horquilla). Botón `Recibir propuesta detallada`.

Nota legal obligatoria: *«Estimación orientativa, no vinculante. La cuota final depende del alcance validado en una sesión técnica gratuita de 30 minutos.»*

#### Textos legales del pie de la calculadora

Se conservan del prototipo y del Excel:

- *«Las auditorías técnicas incluyen informe con severidad CVSS y retest, aptos como evidencia para la auditoría de certificación del ENS; la Certificación de Conformidad la emite una entidad acreditada por ENAC.»*
- Exclusiones: no incluye impuestos, desplazamientos, remediación de hallazgos, pruebas extraordinarias ni honorarios de la entidad certificadora ENS.

#### Coherencia CPD ↔ servidores

Error bloqueante, no aviso. Ver [5.4](#54-validación-de-entrada-y-errores-bloqueantes).

#### Accesibilidad

**Los toggles Sí/No se hacen con radios nativos**, no con `<button>` y `role="radiogroup"`. Reimplementar a mano un patrón que el HTML ya resuelve obliga a gestionar flechas, `aria-checked`, `tabindex` y foco, y casi siempre sale peor que el original:

```tsx
<fieldset>
  <legend>Supervisión de backup</legend>
  <label><input type="radio" name="backup" value="si" /> Sí</label>
  <label><input type="radio" name="backup" value="no" /> No</label>
</fieldset>
```

El estilo se aplica con `appearance: none` sobre el `input` y selectores `:checked`, `:focus-visible`. Se conserva toda la semántica y el manejo por teclado sin escribir una línea de JavaScript.

**Sobre `aria-live` en el resultado:** no anunciar cada recálculo mientras el usuario está modificando campos, porque un lector de pantalla estaría interrumpiendo continuamente. Anunciar solo cuando el valor se ha estabilizado (después del *debounce*) y con `aria-live="polite"`. Los errores de validación sí van con `role="alert"`.

> **Todos los textos van al namespace `calculator`** de `es.json`/`en.json`. Ni una cadena en el JSX.

### 5.7 Los tres endpoints de la calculadora

**B09.** La versión anterior tenía un único endpoint `/api/presupuesto/cotizar` para todo, y decía que cada cambio de parámetro lo volvía a llamar con *debounce* de 400 ms. Pero ese endpoint, según su propio orden de operaciones, **persiste el envío y sincroniza con EspoCRM**. El resultado real habría sido: mover el número de usuarios de 25 a 60 arrastrando el campo genera decenas de actualizaciones del Lead, decenas de trabajos en la cola y posiblemente correos intermedios. El comercial vería el Lead cambiando solo mientras el visitante juega con el formulario.

Se separa en tres endpoints con responsabilidades distintas:

| Endpoint | Calcula | Persiste | Toca EspoCRM | Envía correo |
|---|---|---|---|---|
| `POST /api/presupuesto/cotizar` | Sí | Crea la `submission` | **Sí**, crea el Lead | No |
| `POST /api/presupuesto/recalcular` | Sí | Solo `latest_quote` | **No** | **No** |
| `POST /api/presupuesto/propuesta` | Sí, y **congela** | `quote_snapshot` | **Sí**, una actualización | **Sí** |

#### 1 · Primera cotización — `cotizar`

Se invoca **una sola vez**, al enviar la puerta:

1. Valida los datos de contacto y los parámetros técnicos.
2. Crea **una única** `submission` con su clave de idempotencia.
3. Calcula.
4. Encola la creación del Lead.
5. Devuelve `submissionToken` + `PublicQuoteDto`.

#### 2 · Recotizaciones — `recalcular`

Se invoca cada vez que el usuario ajusta un parámetro, con *debounce* de 400 ms:

1. Exige `submissionToken` válido y no caducado.
2. Recalcula **exclusivamente en servidor**.
3. Actualiza **como máximo** el campo `latest_quote` de la `submission` local.
4. **No crea trabajos de entrega. No toca EspoCRM. No envía correo.**
5. Devuelve el `PublicQuoteDto` nuevo.

#### 3 · Propuesta detallada — `propuesta`

Se invoca al pulsar «Recibir propuesta detallada»:

1. Recalcula una última vez con los parámetros definitivos.
2. **Congela un `quote_snapshot`** con el resultado interno y `PBCG_MODEL_VERSION`. Es el importe que se comunica y sobre el que se responde: no puede cambiar después.
3. Encola **una única** actualización del Lead en EspoCRM.
4. Encola el correo comercial y la confirmación al usuario.
5. Es **idempotente por versión final de cotización**: pulsar dos veces no encola dos veces.

#### Límites por endpoint

Distintos porque el uso legítimo es distinto:

| Endpoint | Límite |
|---|---|
| `cotizar` | 5 por IP cada 10 min |
| `recalcular` | 30 por `submissionToken` cada 10 min |
| `propuesta` | Una operación idempotente por versión final de cotización |

Las recotizaciones se limitan por token y no por IP, porque son la parte legítima del flujo: quien está ajustando parámetros no debe topar con un 429.

---

## Fase 6 · Formularios, gateway e integración con EspoCRM

Migrar a Next da servidor propio, así que los formularios se implementan como pide el brief §11 y se conectan a **EspoCRM autoalojado** como destino de los leads, según indicación de dirección (27/07/2026).

> **El `publicKey` de EmailJS que hoy está incrustado en `web/src/components/sections/Contacto.tsx:23-25` deja de usarse.**

### 6.0 Inventario de formularios

Dirección pide *«un formulario o varios donde los clientes saquen precios o pregunten cosas»*. Son **cuatro puntos de captación**, y no todos son el mismo tipo de dato:

| # | Formulario | Página | Endpoint | ¿Crea Lead en EspoCRM? | Base jurídica |
|---|---|---|---|---|---|
| 1 | Contacto general | `/contacto` | `POST /api/contacto` | Sí | Atender una solicitud del interesado — **a validar (P22)** |
| 2 | Puerta de la calculadora | `/calculadora` | `POST /api/presupuesto/cotizar` | Sí, con los parámetros y la horquilla | Medidas precontractuales solicitadas por el interesado — **a validar (P22)** |
| 3 | «Recibir propuesta detallada» | `/calculadora` | `POST /api/presupuesto/propuesta` | Actualiza el Lead del paso 2 | Igual que el 2 |
| 4 | Newsletter | `/blog` | `POST /api/newsletter` | **No** | Consentimiento de marketing |

> **La base jurídica de los formularios 1 a 3 no es «consentimiento».** Atender una consulta o preparar un presupuesto que el propio interesado ha pedido encaja mejor en la ejecución de medidas precontractuales solicitadas por él. Quien lleve cumplimiento debe validarlo (pendiente **P22**), pero el plan **no debe presuponer consentimiento**, porque eso arrastra consecuencias: si la base fuera el consentimiento, el interesado podría retirarlo y habría que dejar de tratar los datos, incluida la propia respuesta a su consulta.

> **El formulario 4 es distinto de los demás.** Una suscripción a newsletter sí tiene el consentimiento como base jurídica, y es un tratamiento con finalidad distinta. Meterlo en la misma tubería que los leads mezcla dos tratamientos, que es exactamente lo que la AEPD revisa. Va a la lista de distribución (Target List de EspoCRM o el proveedor de email marketing), **no** a la cola de leads comerciales.
>
> El **doble opt-in** se implementa porque es una excelente medida probatoria y antiabuso, no porque sea una obligación legal universal: eso último requeriría validación jurídica específica y este documento no la afirma. Lo que sí es obligatorio es que el consentimiento de marketing sea **separado, opcional, sin premarcar y revocable**, y que exista un mecanismo de baja en cada envío.

Los formularios 2 y 3 son el mismo prospecto: el 3 **actualiza** el registro creado por el 2, no crea otro. Cómo se relacionan sin exponer identificadores internos: [6.5](#69-el-navegador-nunca-ve-un-id-de-espocrm).

### 6.1 Campos y validación — `components/forms/ContactForm.tsx`

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| **Nombre** | text | Sí | 2–40 caracteres |
| **Apellidos** | text | Sí | 2–60 caracteres |
| Empresa | text | Sí | 2–80 caracteres |
| Email corporativo | email | Sí | Formato email. Aviso **suave** (no bloqueo) si el dominio es genérico: gmail, hotmail, outlook, yahoo |
| Teléfono | tel | No | Validación laxa, admite prefijo internacional |
| Cargo / rol | text | No | Libre |
| ¿Qué necesitas? | select | Sí | Seis opciones de `contact.form.needOptions` |
| Mensaje | textarea | No | Máx. 1000 caracteres, con contador |
| Información de privacidad | checkbox | **Sí** | Ver redacción abajo. Enlaza a `/politica-privacidad` |
| Marketing (opt-in) | checkbox | No | Consentimiento **separado, sin premarcar** |

> ⚠️ **Nombre y apellidos van en dos campos separados**, no en uno solo. El brief y la primera versión de este plan usaban un único campo «Nombre y apellidos», y la integración con EspoCRM lo partía tomando la primera palabra como `firstName`. Eso falla con «María José García Pérez», con «Van der Berg» y con cualquier nombre o apellido compuesto — es decir, con una parte grande de los nombres españoles. Dos campos: `firstName` y `lastName`. La clave `contact.form.fields.name` se desdobla en `firstName` y `lastName` en los ficheros de mensajes.

**Redacción de la casilla obligatoria (B04).** La AEPD distingue expresamente entre *informar* y *obtener consentimiento*, y desaconseja las casillas del tipo «He leído y acepto las condiciones de la política de privacidad» cuando lo que hace falta es consentimiento real. La casilla sí puede usarse para **acreditar que se facilitó la información** (responsabilidad proactiva), que es exactamente su función aquí:

| Antes (incorrecto) | Ahora |
|---|---|
| «He leído y acepto la Política de Privacidad (RGPD)» | **«He leído la información básica sobre protección de datos»** |

Junto al formulario, y visible sin desplegar nada, debe figurar la **información básica en capas**: responsable, finalidad, base jurídica (una vez validada, P22), destinatarios, plazo de conservación, derechos y enlace a la información adicional. Hay que actualizar `contact.form.consent` y `contact.form.privacyNote` en los dos idiomas.

La casilla de marketing se mantiene aparte: **«Deseo recibir comunicaciones comerciales de ISN Labs»**, opcional y sin premarcar.

Validación **en cliente al perder el foco** (`onBlur`), con mensaje bajo el campo, y **de nuevo en el servidor** con el mismo esquema `zod`. Los mensajes de error ya están escritos en `contact.form.errors.*`. Campos con `aria-invalid` + `aria-describedby`, y tras un envío fallido, **un resumen de errores al principio del formulario que recibe el foco** — ver [Fase 9](#fase-9--accesibilidad-rendimiento-y-limpieza).

### 6.2 El sitio no tiene servidor: contrato del frontend

El navegador llama a rutas **del propio dominio**, que Netlify proxifica firmadas hacia el gateway. Para el código del sitio, esto es simplemente `fetch`:

```ts
// site/src/lib/api/client.ts  — sin secretos, sin CORS, mismo origen
const res = await fetch('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
```

**Rutas que consume el sitio** (Netlify las traduce a `/web/v1/…`):

| Ruta que llama el navegador | Uso |
|---|---|
| `POST /api/contact` | Formulario de contacto |
| `POST /api/quote/initial` | Puerta de la calculadora |
| `POST /api/quote/recalculate` | Recotización |
| `POST /api/quote/proposal` | Propuesta detallada |
| `POST /api/newsletter` | Suscripción |

**Lo que el sitio conserva y lo que pierde:**

| Conserva | Ya no tiene |
|---|---|
| El formulario y su UX | El motor PBCG |
| Validación de cliente con `zod` | La validación de servidor |
| Los **tipos DTO públicos**, generados del OpenAPI | Acceso a EspoCRM, SMTP y bandeja de salida |
| La representación del resultado | Cualquier secreto |

> **Los tipos se generan del contrato, no se escriben a mano.** `pnpm generate:api-types` los deriva de `contracts/web-gateway-v1.yaml`, y son de **desarrollo**: el sitio no importa ningún paquete del gateway en runtime, para que una dependencia de backend no acabe en el bundle.
>
> **Se pierde la validación compartida** que tenía la versión anterior con un único esquema `zod`. Es el precio de separar los servicios, y lo que lo sustituye es el contrato OpenAPI versionado: si el gateway cambia un campo, el sitio deja de compilar al regenerar los tipos.

### 6.3 El proxy firmado de Netlify

Es la pieza que permite que el navegador hable con el gateway **sin CORS, sin secretos y sin exponer el gateway a cualquiera**.

```toml
# netlify.toml
[[redirects]]
  from = "/api/contact"
  to = "https://api.secnorthlabs.eu/web/v1/contact"
  status = 200
  force = true
  signed = "NETLIFY_GATEWAY_SIGNING_SECRET"

  [redirects.rate_limit]
    window_limit = 5
    window_size = 180
    aggregate_by = ["ip", "domain"]
```

**Cómo funciona:** Netlify firma cada petición proxificada con un JWS **HMAC HS256** y lo envía en la cabecera **`x-nf-sign`**. El contenido del token es:

```json
{
  "iss": "netlify",
  "exp": 1623876755,
  "netlify_id": "1be0f471-6532-45ff-b1b1-f9c66ea24dc1",
  "site_url": "https://secnorthlabs.eu",
  "deploy_context": "production"
}
```

| Punto | Detalle |
|---|---|
| `signed = "NOMBRE_DE_VARIABLE"` | Se pone el **nombre**, no el valor. El valor va en las variables de entorno de Netlify |
| **Scope `Runtime`** | La variable **debe** tener ese scope, o la firma no se aplica |
| El navegador nunca ve el secreto | Solo ve `/api/contact`, del mismo origen |
| Sin CORS | Al ser mismo origen, no hay preflight ni cabeceras que configurar |
| Staging | **Otro secreto y otro gateway.** El claim `deploy_context` permite además rechazar un *deploy preview* que apunte a producción |

> ⚠️ **Caveat de Netlify:** la firma JWS **solo funciona proxificando a sitios externos**, no entre aplicaciones de Netlify. Aquí no es problema —el gateway está en un VPS propio—, pero conviene saberlo antes de mover algo a Netlify.
>
> ⚠️ **Las cabeceras estáticas de `netlify.toml` no se aplican al contenido proxificado.** El gateway tiene que poner las suyas ([6.6](#66-respuestas-del-gateway)).

**Corrección al documento de migración:** proponía `window_size = 600` para los límites de 10 minutos. **Netlify solo admite ventanas de 60 a 180 segundos**, así que 600 no es un valor válido. El reparto correcto es:

| Capa | Qué hace | Ventana |
|---|---|---|
| **Netlify edge** | Protección gruesa: corta el abuso masivo antes de que llegue al VPS | ≤ **180 s** |
| **Gateway** | Los límites reales del negocio: 5 cotizaciones por IP / 10 min, 30 recotizaciones por `submissionToken` / 10 min, propuesta idempotente | Sin restricción |

Y hay un segundo límite que comprobar **antes** de escribir el fichero: Netlify permite **entre 2 y 5 reglas de rate limiting por proyecto** según el plan (100 solo en Enterprise). Con una regla por endpoint se llega al techo, así que conviene empezar por `/api/*` genérico más las dos rutas críticas, y verificar el plan contratado.

### 6.4 El Web Gateway

Repositorio propio, desplegado junto a EspoCRM. **Es el único componente que habla con el CRM.**

```text
Netlify → Web Gateway → EspoCRM
```

**Tecnología:** Node 24.18.0, TypeScript, **Fastify**, validación con `zod`, SQLite WAL o PostgreSQL, `fetch` nativo y logger estructurado. **Sin panel web, sin Swagger público, sin sesiones, sin cookies y sin CORS para navegadores.**

Fastify porque da límites de cuerpo, hooks, esquemas, timeouts y logging estructurado con una superficie pequeña, siempre que no se instalen plugins que no hagan falta.

**Rutas públicas, exactamente estas cinco:**

```text
POST /web/v1/contact
POST /web/v1/quote/initial
POST /web/v1/quote/recalculate
POST /web/v1/quote/proposal
POST /web/v1/newsletter
```

> **Nunca una ruta genérica** tipo `/web/v1/proxy/*`. Y el cliente **no puede indicar** en ningún caso: entidad de EspoCRM, URL, método, nombre de campo arbitrario, `assignedUserId`, `status`, `source`, precio, total, horquilla ni plantilla de correo. Todo eso lo decide el gateway.

**Rutas internas**, solo en loopback o red privada y **no publicadas por Nginx**:

```text
GET  /internal/live       GET  /internal/ready
POST /internal/jobs/run   GET  /internal/metrics
```

### 6.5 Verificación de la firma y defensa en profundidad

El gateway comprueba, en este orden, y ante cualquier fallo responde **403 o 404 genérico** sin explicar el motivo:

1. La cabecera `x-nf-sign` existe.
2. El algoritmo es **HS256** — rechazar `alg: none` y cualquier otro.
3. La firma valida contra el secreto compartido.
4. `iss === 'netlify'`.
5. `exp` no ha vencido.
6. `netlify_id` coincide **exactamente** con el ID del sitio.
7. `site_url` está en la lista de hosts permitidos.
8. `deploy_context === 'production'` en el gateway de producción.
9. **El token no se registra completo** en ningún log.

Después, cada petición debe superar las quince capas:

TLS → Nginx solo bajo `/web/v1/` → firma de Netlify → método permitido → `Content-Type: application/json` → tamaño ≤ 32 KB → `Origin` permitido cuando esté presente → esquema estricto → honeypot → tiempo mínimo → rate limiting → idempotencia → validación semántica → persistencia local → adaptador de EspoCRM con permisos mínimos.

### 6.6 Respuestas del gateway

Todas llevan:

```http
Cache-Control: no-store
Content-Type: application/json
X-Content-Type-Options: nosniff
```

**Nunca devuelven:** trazas, la respuesta cruda de EspoCRM, identificadores internos del CRM, rutas del servidor, versiones, SQL, credenciales, nombres de tabla ni detalles del SMTP. El cuerpo de error es un **código** más un `requestId`, y el texto que ve el usuario lo pone el sitio a partir de `contact.form.errors.*`.

### 6.7 Contrato de la petición — `POST /api/contact`

**Petición** (`Content-Type: application/json`):

```jsonc
{
  "firstName": "María José",          // requerido, 2-40
  "lastName": "García Pérez",         // requerido, 2-60
  "empresa": "Acme Industrial S.A.",  // requerido, 2-80
  "email": "ana@empresa.com",         // requerido
  "telefono": "+34 6XX XXX XXX",      // opcional
  "cargo": "CISO",                    // opcional
  "necesidad": "MSSP OT",             // requerido, una de needOptions
  "mensaje": "…",                     // opcional, máx 1000
  "privacyAck": true,                 // requerido: acredita que se informó
  "marketingOptIn": false,            // opcional, consentimiento separado
  "locale": "es",
  "utm": { "source": "linkedin", "medium": "social", "campaign": "nis2" },
  "_hp": "",                          // honeypot: debe llegar vacío
  "_t": 1769500000000                 // marca de tiempo de render del formulario
}
```

Las **claves desconocidas se rechazan** (`zod` con `.strict()`), no se ignoran: así un campo mal escrito da error en desarrollo en lugar de perderse silenciosamente.

**Respuestas:**

| Código | Cuerpo | Cuándo |
|---|---|---|
| 200 | `{ "ok": true }` | Recibido y procesado. También cuando se descarta por honeypot (no se informa al bot) |
| 400 | `{ "ok": false, "error": "validation", "fields": { "email": "…" } }` | Validación de servidor fallida |
| 429 | `{ "ok": false, "error": "rateLimited" }` | Límite por IP superado |
| 500 | `{ "ok": false, "error": "generic" }` | Fallo interno. **Nunca** filtrar detalles del CRM ni trazas |

Los textos que ve el usuario salen de `contact.form.errors.*`; el endpoint devuelve **códigos**, no frases. Así el mensaje se traduce en el cliente y no hay que duplicar copy en el servidor.

### 6.8 Orden de operaciones del gateway

1. **Honeypot** (`_hp`): si llega con contenido → responder `200 { ok: true }` y descartar en silencio.
2. **Comprobación de tiempo** (`_t`): si han pasado menos de ~3 segundos desde que se renderizó el formulario, es un bot. Mismo tratamiento silencioso. Cuesta cinco líneas y filtra la mayoría del spam automatizado.
3. **Rate limiting por IP** (`lib/rateLimit.ts`): ventana deslizante en memoria, 5 envíos / 10 min.
   > En un VPS propio con un solo proceso Node, el contador en memoria **es suficiente y correcto**. Solo haría falta un almacén externo (Redis) si algún día se pasa a varias instancias o a *serverless*. Dejarlo comentado en el código.
4. **Captcha** — ver [6.8](#612-captcha-recaptcha-contradice-el-argumento-de-soberanía). **No usar reCAPTCHA.**
5. **Revalidar todos los campos en servidor**, con las mismas reglas que el cliente. No confiar en la validación del navegador ni en el `required` del HTML.
6. **Registrar la evidencia**: `submissionId`, `timestamp` ISO, `locale` y **versión del texto de privacidad mostrado** (constante `PRIVACY_VERSION`, que se sube a mano cada vez que cambie la política). Sin la versión no se puede demostrar *qué* información se facilitó.
   > **La IP completa no es obligatoria.** La primera versión de este plan la daba por necesaria «para probar el consentimiento». No lo es: identificador de solicitud, fecha, versión del texto y acción realizada son evidencia suficiente. Si se guarda la IP, hay que justificarlo por necesidad y minimización — y en ese caso, plantear guardar solo un hash o la IP truncada. Decisión de quien lleve cumplimiento (P22).
7. **Persistir en la bandeja de salida** — ver [6.6](#610-bandeja-de-salida-submission--delivery_job). **Este es el punto en el que el envío se considera aceptado.**
8. **Crear el Lead en EspoCRM** ([6.7](#611-mapeo-a-la-entidad-lead-de-espocrm)), con timeout.
9. **Enviar correo** al buzón comercial + autorespuesta al usuario, con timeout.
10. **Responder** `{ ok: true, submissionToken }`.

### 6.9 El navegador nunca ve un ID de EspoCRM

**B02.** La versión anterior guardaba el `id` devuelto por EspoCRM en el estado de React y lo reenviaba para actualizar el Lead. Cuatro problemas: se pierde al recargar, el usuario puede modificarlo, se podría acabar actualizando el Lead de otra persona, y expone un identificador interno del CRM sin ninguna necesidad.

**Lo que recibe el navegador es un token opaco y firmado:**

```json
{
  "submissionToken": "eyJ…",
  "quote": { }
}
```

- Es un token firmado (HMAC con un secreto de servidor) que contiene solo un `submissionId` interno y su caducidad. **Firmado, no cifrado**: lo importante es que no se pueda falsificar, y dentro no hay nada sensible.
- Caduca (p. ej. 2 horas). Un token caducado devuelve `410` y la calculadora vuelve a pedir los datos.
- **La relación `submissionId → espoLeadId` vive solo en el servidor**, en la bandeja de salida.

Para pedir la propuesta detallada se envía el token, nunca un identificador de EspoCRM. El servidor lo verifica, resuelve el `submissionId` y busca el `espoLeadId` en su propia base.

### 6.10 Bandeja de salida: `submission` + `delivery_job`

**B03.** La versión anterior proponía un fichero `.jsonl` en modo *append-only*. Como contingencia rápida vale, pero como cola de producción tiene problemas reales: escrituras concurrentes que se entrelazan, registros a medias si el proceso muere durante la escritura, imposibilidad de actualizar el estado sin dejar de ser *append-only*, reintentos descontrolados, duplicados, sin índices, borrado selectivo por retención muy incómodo, y pérdida total en un contenedor sin volumen persistente.

**B08.** La primera corrección lo pasó a una tabla SQLite, pero con **un solo `status` por envío**. Eso tampoco sirve, porque cada envío dispara **varias operaciones independientes**: crear el Lead, avisar al buzón comercial, mandar la autorespuesta, dar de alta en la newsletter. Con un único estado no se puede representar ninguno de estos casos, que son los normales:

- CRM sincronizado y correo fallido.
- Correo enviado y CRM pendiente.
- Lead creado, timeout al guardar el `espo_lead_id` y reintento posterior.
- Newsletter confirmada pero correo de doble opt-in fallido.

Y sobre todo: no se puede **reintentar solo el destino que falló** sin repetir los que ya funcionaron.

**Se usa SQLite en modo WAL** (`better-sqlite3`) con **dos tablas**. Si ya existe un PostgreSQL en la infraestructura, mejor ese.

> El nombre `lead_outbox` de la versión anterior era además incorrecto: la newsletter está definida expresamente como algo que **no es un Lead** ([6.0](#60-inventario-de-formularios)). Se llama `submission_outbox`.

```text
submission                          ← qué envió el usuario. Una fila por envío.
├── id                  UUID PK
├── type                contacto | presupuesto | newsletter
├── idempotency_key     UNIQUE
├── payload             JSON (cifrado en reposo si el disco no lo está)
├── latest_quote        JSON, nullable   ← recotizaciones, sin encolar nada
├── quote_snapshot      JSON, nullable   ← congelado al pedir la propuesta
├── pbcg_model_version  TEXT, nullable
├── espo_lead_id        TEXT, nullable
├── created_at          TIMESTAMP
└── delete_after        TIMESTAMP        ← automatiza la retención

delivery_job                        ← qué hay que hacer con él. Varias filas por envío.
├── id                  UUID PK
├── submission_id       FK → submission.id
├── destination         crm | commercial_email | autoresponse | newsletter
├── operation           create | update | send | subscribe
├── status              pending | processing | completed | failed
├── attempts            INTEGER
├── next_attempt_at     TIMESTAMP        ← retroceso exponencial
├── locked_at           TIMESTAMP, nullable
├── last_error_code     TEXT, nullable   ← código sanitizado, NUNCA el cuerpo
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**Reglas de funcionamiento:**

1. **El usuario solo recibe éxito si la escritura de `submission` ha terminado bien.** Si falla, se devuelve error: es la única forma honesta de decirle que su mensaje no ha quedado registrado.
2. **El worker reclama trabajos de forma atómica**: un `UPDATE … SET status='processing', locked_at=now() WHERE id=? AND status='pending'` dentro de una transacción, comprobando que se ha modificado exactamente una fila. Si no, otro worker se lo llevó.
3. **Trabajo zombi**: un `delivery_job` en `processing` con `locked_at` más antiguo que el timeout vuelve a `pending`. Sin esta regla, un proceso que muere a mitad deja el trabajo bloqueado para siempre.
4. **El `espo_lead_id` se persiste inmediatamente después de crear el Lead**, antes de procesar cualquier otro destino. Si no, un fallo posterior deja un Lead creado que la aplicación no sabe encontrar, y la propuesta detallada no tendrá qué actualizar.
5. **Los errores se guardan como códigos sanitizados** (`crm_timeout`, `crm_409_duplicate`, `smtp_auth_failed`), nunca cuerpos de respuesta completos ni datos personales.
6. EspoCRM y el correo se llaman **con timeout** (5 s). Al agotarse, el trabajo queda `pending` con reintento programado.
7. **Cada envío lleva clave de idempotencia**, generada en el cliente y validada en el servidor.
8. **Nunca se escriben datos personales en los logs.** En el log va el `requestId` y el `submission.id`.
9. La retención y el borrado se automatizan con `delete_after`, en cascada sobre `delivery_job`.

**Configuración de SQLite** — no son opcionales:

```sql
PRAGMA journal_mode = WAL;      -- concurrencia lectura/escritura
PRAGMA foreign_keys = ON;       -- SQLite las ignora si no se activa
PRAGMA busy_timeout = 5000;     -- evita "database is locked" bajo carga
```

**Migraciones.** Hace falta un sistema de migraciones versionadas desde el primer día (un directorio `migrations/` numerado y una tabla `schema_version`). Cambiar el esquema a mano en producción con datos personales dentro no es una opción.

> ⚠️ **Copia de seguridad: no copiar el `.db` a ciegas.** En modo WAL, copiar el fichero mientras hay escrituras produce una base **corrupta o incompleta**, porque parte de los datos está en el `-wal`. Hay que usar la **API de backup de SQLite** (`VACUUM INTO 'destino.db'` o el `backup()` de `better-sqlite3`), o detener limpiamente las escrituras antes de copiar. Es un fallo que no se nota hasta el día que hay que restaurar.

> **El correo no es una copia de seguridad.** La versión anterior lo presentaba como «la segunda copia». No lo es: también puede fallar —y ahora tiene su propio `delivery_job` que lo demuestra—, no es consultable ni reprocesable, y crea otra copia de datos personales en un buzón, con su propia retención. La copia buena es la bandeja de salida; el correo es una notificación.

### 6.11 Mapeo a la entidad Lead de EspoCRM

`POST {ESPOCRM_URL}/api/v1/Lead` con cabeceras `X-Api-Key` y `Content-Type: application/json`.

**Campos estándar** (verificados contra la definición de la entidad Lead):

| Formulario | Campo EspoCRM | Nota |
|---|---|---|
| **Nombre** | `firstName` | Campo propio del formulario, sin partir cadenas |
| **Apellidos** | `lastName` | Ídem |
| Empresa | `accountName` | Campo de texto, no un enlace a Account |
| Email | `emailAddress` | |
| Teléfono | `phoneNumber` | |
| **Cargo / rol** | **`title`** | ⚠️ Es un campo **estándar** de Lead. No hace falta el campo personalizado `cRole` que proponía la recomendación recibida |
| Mensaje | `description` | |
| — | `status` | Fijar `"New"` |
| — | `source` | Fijar **`"Web Site"`** — ver aviso abajo |
| — | `assignedUserId` | Opcional, para que el lead caiga asignado a alguien |

> ⚠️ **`source` es un enum con opciones cerradas**, no texto libre. Sus valores por defecto son: `""`, `"Call"`, `"Email"`, `"Existing Customer"`, `"Partner"`, `"Public Relations"`, `"Web Site"`, `"Campaign"`, `"Other"`. Mandar `"calculadora-web"` como propone la recomendación recibida **hará fallar o descartar el campo**. El origen fino va en un campo personalizado.
>
> Igual con `status`, cuyos valores por defecto son `"New"`, `"Assigned"`, `"In Process"`, `"Converted"`, `"Recycled"` y `"Dead"`.
>
> **Estos son los valores por defecto de EspoCRM, y se pueden haber modificado desde Entity Manager.** Hay que comprobarlos contra la instancia real antes de programar, igual que los nombres de los campos personalizados.

**Campos personalizados que hay que crear en EspoCRM antes de programar nada.** Administración → Entity Manager → Lead → Fields. Si se envía un atributo que no existe, EspoCRM lo ignora y el dato se pierde **sin error visible**: es la forma más fácil de perder medio formulario sin enterarse.

Los nombres separan **información de privacidad** de **consentimiento de marketing**, que son dos cosas distintas (B04). Llamar `cConsent` a la casilla obligatoria, como hacía la versión anterior, deja escrito en el CRM que el interesado «consintió» algo que en realidad solo se le informó — y eso es precisamente la confusión que la AEPD señala.

| Campo a crear | Tipo | Contenido |
|---|---|---|
| `need` | Enum | Las seis opciones de `contact.form.needOptions` |
| `origin` | Enum | `contacto-web`, `calculadora-gate`, `calculadora-propuesta` |
| `privacyNoticeAcknowledged` | Bool | Se marcó la casilla de información de privacidad |
| `privacyNoticeAt` | DateTime | Momento en que se marcó |
| `privacyNoticeVersion` | Varchar | Versión del texto informativo mostrado |
| `marketingOptIn` | Bool | Consentimiento de marketing, **separado** |
| `marketingConsentAt` | DateTime | Momento del consentimiento de marketing |
| `marketingConsentVersion` | Varchar | Versión del texto de marketing aceptado |
| `utm` | Text | JSON con `source`/`medium`/`campaign` |
| `quoteParams` | Text | Parámetros de la calculadora (JSON) |
| `quoteRange` | Varchar | Horquilla cotizada, p. ej. `"815 – 900 €/mes"` |

> ⚠️ **Corrección a la primera versión de este documento.** Decía que el prefijo `c` «es solo una convención; EspoCRM no lo añade solo». **Es incorrecto.** La documentación de EspoCRM indica que al crear un tipo de entidad, un campo o una relación desde Entity Manager, **el sistema añade el prefijo `c`** (de *custom*) para evitar conflictos con versiones futuras, y que ese comportamiento solo se desactiva con el parámetro de configuración `customPrefixDisabled`, «a tu propio riesgo».
>
> En la práctica esto significa que el campo que aparece como `need` en la interfaz probablemente se llame **`cNeed`** en la API. **No se deduce: se comprueba.**
>
> **Procedimiento obligatorio antes de programar el endpoint:**
> 1. Crear los 11 campos en Entity Manager.
> 2. Consultar `GET /api/v1/Metadata` (o la ficha del campo) para leer **el nombre real de cada atributo**.
> 3. Anotarlos en un **contrato de integración** versionado en el repositorio (`site/docs/espocrm-contract.md`), con el nombre visible, el nombre de API, el tipo y las opciones del enum.
> 4. Verificar también los valores reales de `source` y `status`, que pueden haberse modificado.
>
> Sin ese contrato, cualquiera que retoque los campos en el CRM rompe la integración sin saberlo, y el síntoma será datos vacíos, no un error.

**Nunca enviar al CRM** el coste interno, el margen ni la tarifa efectiva. Solo lo que el cliente ha visto en pantalla. Es la misma regla de la [sección 4](#5--datos-confidenciales-que-no-pueden-salir-del-excel), aplicada a la salida.

### 6.12 Captcha: reCAPTCHA contradice el argumento de soberanía

Este es el único punto de la recomendación recibida que hay que **cambiar**, no solo matizar.

reCAPTCHA es de Google: envía la IP del visitante y señales de comportamiento a un responsable estadounidense, y funciona en todas las páginas donde se carga, no solo al enviar. Si el argumento de venta de ISN Labs es soberanía del dato y RGPD limpio —y la web es la de una consultora de ciberseguridad—, poner reCAPTCHA en el formulario es una incoherencia que un cliente técnico puede señalar en la primera reunión. Además obliga a declarar la transferencia internacional en la política de privacidad y a bloquearlo tras el banner de cookies, lo que rompe el formulario para quien rechace.

Opciones por orden de preferencia:

| Opción | Valoración |
|---|---|
| **Honeypot + comprobación de tiempo + rate limiting** | **Recomendado para arrancar.** Para un formulario B2B de bajo volumen filtra prácticamente todo el spam automatizado, con cero terceros y cero datos personales fuera. Si aparece spam real, se escala |
| **Altcha** autoalojado | Prueba de trabajo en el navegador, sin cookies, sin datos personales, sin terceros. Encaja perfectamente con el discurso de la casa |
| **Friendly Captcha** | Proveedor europeo (Múnich). Opción de pago, coherente con el argumento de soberanía |
| Cloudflare Turnstile | Mejor que reCAPTCHA en privacidad, pero sigue siendo un tercero no europeo |
| ~~reCAPTCHA v3~~ | **Descartado** por el motivo anterior |

### 6.13 Checklist de seguridad de EspoCRM

Validado y ampliado sobre la lista que llegó de dirección:

- [ ] **Usuario de API dedicado con permisos de equipo, no «own».** Ver [6.9.1](#6131-b10--el-modelo-de-permisos-y-la-asignación-están-acoplados).
- [ ] **API key solo en el servidor**, en variables de entorno. Nunca en `NEXT_PUBLIC_*`: cualquier variable con ese prefijo **acaba en el bundle del navegador**. Es el error más fácil de cometer en Next.
- [ ] **Fichero `.env` con permisos `600`** y propietario el usuario del servicio. Fuera de git.
- [ ] **Llamada por red privada o localhost** si EspoCRM está en el mismo VPS.
- [ ] **HTTPS en todo**, con HSTS. Certificados renovados automáticamente.
- [ ] **Panel de administración de EspoCRM no expuesto a Internet**: VPN o lista blanca de IPs. La API de Lead puede estar accesible solo desde la IP del servidor web.
- [ ] **Firewall / WAF delante** — aquí sí tiene sentido usar OPNsense o Fortinet, que son parte del catálogo propio.
- [ ] **Rate limiting también del lado de EspoCRM**, no solo en el proxy.
- [ ] **Actualizaciones al día.** EspoCRM publica parches de seguridad con regularidad; conviene suscribirse a sus avisos.
- [ ] **Copias de seguridad cifradas** y **probadas restaurando** — no vale con que el job diga «OK». Es literalmente uno de los servicios que ISN Labs vende.
- [ ] **Sin CORS**: el navegador llama a `/api/…` del mismo origen y Netlify proxifica, así que el gateway **no necesita ninguna cabecera `Access-Control-Allow-Origin`**. No añadirla «por si acaso»: abriría el gateway a peticiones desde cualquier página.
- [ ] **Estrategia definida ante duplicados.** Ver [6.9.2](#6132-b10--qué-hacer-cuando-espocrm-devuelve-409).
- [ ] **Registro de accesos** al endpoint y alerta si el rate limiting salta de forma anómala.

#### 6.13.1 B10 · El modelo de permisos y la asignación están acoplados

La primera versión decía «solo crear Leads». La primera corrección lo cambió a «crear + editar los Leads **propios** (`own`)», porque un `PUT` exige permiso de edición. **Sigue sin funcionar**, y el motivo es sutil:

> El plan permite fijar `assignedUserId` al crear el Lead. Si el usuario de API crea el Lead y lo asigna inmediatamente a un comercial, **el Lead deja de ser «propio» del usuario de API**, y el permiso `own` de edición ya no aplica. La actualización posterior de la propuesta detallada fallaría con un error de permisos — y solo se descubriría cuando un cliente real pidiera una propuesta.

EspoCRM distingue permisos de creación, lectura y edición con niveles propio / equipo / todos, y el comportamiento exacto depende de la ACL configurada. **Hay que probarlo contra la instancia real, no suponerlo.**

**Modelo recomendado: por equipo.**

1. Crear un equipo **`Web Leads`** en EspoCRM.
2. Añadir a ese equipo el usuario de API **y** los comerciales que deban ver los leads de la web.
3. Rol del usuario de API:

   | Permiso | Nivel |
   |---|---|
   | Crear Lead | Sí |
   | Leer Lead | **Equipo** |
   | Editar Lead | **Equipo** |
   | Eliminar | No |
   | Exportar | **No** |
   | Resto de entidades | Sin acceso |
   | Campos | Restringir a nivel de campo si la instancia lo permite |

4. **El Lead se asigna al equipo `Web Leads`, no a una persona.** Así el usuario de API conserva el permiso de edición.
5. La **asignación personal** a un comercial la hace un *workflow* o una regla del CRM **después** de recibir la propuesta, ya fuera del alcance del usuario de API.

Sigue sin haber lectura general ni exportación: si la clave se filtra, lo peor que puede pasar es que alguien inyecte leads basura o lea los leads de la web, no que se lleve la base de clientes.

> **Líneas que esto corrige en el resto del documento:** el comentario de `ESPOCRM_API_KEY` en [6.11](#615-variables-de-entorno) y el pendiente **P14**, que hablaban de un rol limitado únicamente a crear Leads.

#### 6.13.2 B10 · Qué hacer cuando EspoCRM devuelve 409

EspoCRM puede responder `409` al detectar un duplicado. El plan incluía ese código en las pruebas E2E pero **no decía qué comportamiento funcional esperar**, que es lo que de verdad importa.

> ⚠️ **Lo que no se puede hacer es dejarlo como error genérico.** Si el `409` se trata como fallo, no se guarda ningún `espo_lead_id`, y la posterior solicitud de propuesta detallada **no sabrá qué Lead actualizar**. El flujo se rompe en silencio justo en el punto de mayor valor comercial.

Tres estrategias válidas. Hay que elegir una (pendiente **P25**):

| Estrategia | Implementación | Cuándo conviene |
|---|---|---|
| **A · Sin comprobación** *(recomendada para empezar)* | No activar la detección de duplicados para este usuario de API. La idempotencia local ya evita los dobles clics | Dos solicitudes distintas del mismo email pueden ser **dos oportunidades legítimas** (una consulta en marzo y un presupuesto en julio). Es lo más simple y no pierde información |
| **B · Consolidación** | Buscar por email y actualizar el Lead existente. Exige permiso de **lectura** y reglas claras sobre cuál se actualiza si hay varios | Si comercial prefiere una ficha por contacto |
| **C · Revisión manual** | Guardar el `409` en el `delivery_job` con `last_error_code = 'crm_409_duplicate'` y marcar la `submission` como `needs_review` | Si se quiere que una persona decida siempre |

En las tres, el envío queda íntegro en la bandeja de salida y el aviso al buzón comercial se envía igual, así que **el lead nunca se pierde** por un duplicado.

### 6.14 Base jurídica y deberes de RGPD

Conectar un CRM no es solo trabajo de desarrollo. Con EspoCRM autoalojado, **ISN Labs es responsable del tratamiento** y hay cuatro cosas que no se resuelven con código:

1. **Validar la base jurídica de cada formulario (P22).** El plan **no presupone consentimiento** para atender consultas y preparar presupuestos; apunta a medidas precontractuales solicitadas por el interesado, pero debe confirmarlo quien lleve cumplimiento. La decisión determina la redacción de la información básica, los campos que se guardan y qué derechos aplican.
2. **La política de privacidad actual puede no cubrir esto.** El texto que se porta de la web actual se copia palabra por palabra (Fase 4.13) y hay que revisar si sus apartados de *destinatarios/comunicaciones* y *conservación* contemplan el alta en un CRM propio.
   > ⚠️ **No modificar el texto legal por iniciativa del equipo de desarrollo.** Se señala el hueco y lo resuelve quien redactó la política. Aquí solo se avisa.
3. **Registro de Actividades de Tratamiento (RAT)**: entrada de «leads de la web», con finalidad, base jurídica, categorías de datos, plazo de conservación y destinatarios. Y entrada separada para «suscriptores de newsletter», que es otro tratamiento.
4. **Plazo de conservación definido** para los leads que no se convierten, con borrado automatizado vía `delete_after` en la bandeja de salida y política equivalente en EspoCRM. Sin plazo, se acumulan datos personales indefinidamente, que es una infracción por sí misma.

### 6.15 Variables de entorno

Documentar en `site/.env.example`, **nunca en el repositorio con valores reales**:

```bash
# ── Sitio ──
SITE_URL=https://secnorthlabs.eu
INCIDENT_PHONE=                  # vacío = no se muestra el bloque de incidente 24/7

# ── Correo ──
CONTACT_TO_EMAIL=                # buzón comercial de destino
SMTP_HOST=                       # o RESEND_API_KEY si se usa proveedor externo
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# ── EspoCRM (self-hosted, UE) ──
ESPOCRM_URL=http://127.0.0.1:8080   # localhost/red privada si está en el mismo VPS
ESPOCRM_API_KEY=                    # usuario de API del equipo Web Leads (ver 6.9.1)
ESPOCRM_TEAM_ID=                    # equipo al que se asignan los Leads
# NO usar ESPOCRM_ASSIGNED_USER_ID: asignar a una persona rompe el permiso de edición

# ── Antispam ──
ALTCHA_HMAC_KEY=                 # solo si se implanta Altcha
# NO usar RECAPTCHA_* — ver 6.8

# ── Firma de tokens ──
SUBMISSION_TOKEN_SECRET=         # HMAC del submissionToken (6.5). Aleatorio, ≥32 bytes
SUBMISSION_TOKEN_TTL=7200        # segundos de validez

# ── Bandeja de salida ──
OUTBOX_DB_PATH=/var/lib/isnlabs/outbox.db   # volumen persistente, NO dentro de site/
OUTBOX_RETENTION_DAYS=           # plazo de conservación, lo fija cumplimiento (P17)

# ── Cumplimiento ──
PRIVACY_VERSION=2026-07-27       # versión del texto informativo mostrado
MARKETING_TEXT_VERSION=2026-07-27
```

> ⚠️ **Ninguna variable lleva el prefijo `NEXT_PUBLIC_`, y es deliberado.** La versión anterior hacía públicas `SITE_URL` y `INCIDENT_PHONE` sin necesidad:
>
> - `SITE_URL` se usa en metadatos, sitemap y canonical, todo ello en servidor.
> - `INCIDENT_PHONE` se lee en el componente de servidor y se pasa como prop al bloque visual.
>
> Y hay una razón operativa además de la de principio: **las variables `NEXT_PUBLIC_*` se incrustan en el bundle durante el build**, así que la misma imagen Docker no se puede promocionar de staging a producción — habría que reconstruir para cambiar la URL. Sin ellas, una única imagen sirve para los dos entornos.

**Validación al arrancar** — `gateway/src/config/env.ts`:

```ts
import 'server-only'
import { z } from 'zod'

const EnvSchema = z.object({
  SITE_URL: z.string().url(),
  INCIDENT_PHONE: z.string().optional(),
  CONTACT_TO_EMAIL: z.string().email(),
  ESPOCRM_URL: z.string().url(),
  ESPOCRM_API_KEY: z.string().min(20),
  ESPOCRM_TEAM_ID: z.string().min(1),
  SUBMISSION_TOKEN_SECRET: z.string().min(43),
  OUTBOX_DB_PATH: z.string().min(1),
  PRIVACY_VERSION: z.string().min(1),
})

export const env = EnvSchema.parse(process.env)
```

Así la aplicación **falla al arrancar** si falta una variable crítica, en lugar de fallar cuando el primer cliente real envía un formulario. Es la diferencia entre un despliegue que no sube y un lead perdido.

Confirmación al usuario: `contact.form.successMessage` («Gracias. Te respondemos en menos de 24 h laborables»).

### 6.16 Sobre el documento de handoff mencionado

La comunicación de dirección menciona un documento de handoff adjunto (contrato del endpoint, ejemplo de proxy en Node/Express y mapeo de campos). **Ese adjunto no ha llegado al equipo de desarrollo.** Las secciones [6.4](#64-el-web-gateway) a [6.11](#611-mapeo-a-la-entidad-lead-de-espocrm) cumplen esa función; si el handoff aparece, hay que contrastarlo con ellas. Su ejemplo de proxy en Express **sí encaja ahora conceptualmente** —el Web Gateway es exactamente eso—, aunque este plan usa Fastify y añade la verificación de la firma de Netlify, que el handoff no contemplaba.

Del mismo modo, las notas de i18n de esa comunicación describen la carga con **i18next + react-helmet**, que era lo correcto para la SPA Vite. Con Next.js se usa `next-intl` (Fase 2) y los metadatos nativos de Next (Fase 3.3). **El contenido de los dos JSON se reutiliza íntegro**: lo único que cambia es el mecanismo de carga, no el copy ni la estructura de claves.

---

## Fase 7 · SEO técnico

1. **Metadatos por página** con `lib/metadata.ts` (Fase 3.3), tomando `title` y `description` de la clave `seo` de cada namespace. Ya vienen redactados y con la longitud medida en el brief §13.
2. **`app/sitemap.ts`** — se genera **iterando `ROUTES`** ([4 · mapa de rutas](#mapa-de-rutas)), incluyendo solo las que tengan `enabled: true` **y** `indexable: true`, con sus `alternates.languages`. Nunca una lista escrita a mano en paralelo.
   > **Corregir el error del sitemap actual**, que lista `/privacidad` cuando la ruta real es `/politica-privacidad`, y actualizar los `lastmod` (hoy ponen `2024-03-20`).
3. **`app/robots.ts`** — `Allow: /` y referencia al sitemap.
4. **`hreflang` y canonical.** Cada versión lleva **canonical hacia sí misma, en su propio idioma**: la página ES apunta a la URL ES y la EN a la URL EN. **No canonicalizar todo al español**, que anularía la versión inglesa. Y `x-default` → **la versión ES**.

   ```html
   <!-- /es/soluciones/mssp/ -->
   <link rel="canonical"                 href="https://secnorthlabs.eu/es/soluciones/mssp/" />
   <link rel="alternate" hreflang="es"   href="https://secnorthlabs.eu/es/soluciones/mssp/" />
   <link rel="alternate" hreflang="en"   href="https://secnorthlabs.eu/en/solutions/mssp/" />
   <link rel="alternate" hreflang="x-default" href="https://secnorthlabs.eu/es/soluciones/mssp/" />

   <!-- /en/solutions/mssp/ : mismos alternates, canonical a sí misma -->
   <link rel="canonical"                 href="https://secnorthlabs.eu/en/solutions/mssp/" />
   ```

   `<html lang="es">` y `<html lang="en">`. **No usar `en-GB` ni `en-US`** salvo que Marketing elija una variante concreta; el copy del brief debe mantener una única norma de inglés.

5. **Datos estructurados** (`components/seo/JsonLd.tsx`), desde una **única fuente de datos de empresa** (`site/src/lib/company.ts`) que alimenta también el pie y la página de contacto, para que no haya tres direcciones distintas en el sitio:
   - *Home*: `Organization` (nombre ISN Labs, `legalName`, logo, `sameAs` a LinkedIn) + `LocalBusiness` con la dirección real de Llanera.
   - *Páginas interiores*: `BreadcrumbList`, construido del array de [2.4](#24-breadcrumbs-array-estructurado-no-una-frase-con-barras).
   - *Blog*: `BlogPosting` **solo cuando existan artículos reales**.
   > El marcado debe representar contenido **realmente visible en la página**. Nada de datos ficticios, ni de valoraciones, ni de horarios o teléfonos que no estén publicados. Validar cada tipo con el Rich Results Test antes de dar la fase por cerrada.
6. **Un solo `<h1>` por página**, con `hero.title + hero.titleHighlight` como contenido.
7. **Enlazado interno** que pide el brief: la Home enlaza a los cuatro pilares; cada artículo del blog enlazará a su página de servicio cuando haya artículos.

### 7.1 Redirecciones desde la web anterior

El plan borra `web/` en la Fase 9, y las URLs que hoy existen y están indexadas **no pueden devolver 404**. Mapa en `next.config.ts`, con `permanent: true` (301):

```ts
async redirects() {
  return [
    { source: '/privacidad', destination: '/politica-privacidad', permanent: true },
    // Anclas de la SPA actual → páginas nuevas
    { source: '/about',    destination: '/compania',  permanent: true },
    { source: '/product',  destination: '/software',  permanent: true },
    { source: '/contact',  destination: '/contacto',  permanent: true },
  ]
}
```

**Antes de desplegar hay que hacer el inventario real de URLs**, no adivinarlo: exportar las páginas indexadas desde Search Console y el `sitemap.xml` actual, y comprobar que cada una tiene destino. Las anclas del tipo `/#about` no generan URL propia y no necesitan redirección, pero conviene revisarlo por si se han enlazado desde fuera.

**Si además cambia el dominio** (pendiente P4), es una mudanza de sitio en toda regla: redirección 301 individual desde cada URL antigua a su equivalente, ambas propiedades dadas de alta en Search Console, uso de la herramienta de cambio de dirección, y mantener las redirecciones **al menos un año**. Un dominio nuevo sin este trabajo pierde el posicionamiento acumulado.

### 7.2 Recursos de marca y compartición social

Faltaban por completo en la primera versión, y son lo que se ve al compartir un enlace:

| Recurso | Ubicación |
|---|---|
| `opengraph-image` | `app/[locale]/opengraph-image.tsx`, con versión ES y EN |
| `twitter-image` | Ídem, o reutilizando el anterior |
| Favicon | `app/icon.svg` + `app/favicon.ico` |
| Apple touch icon | `app/apple-icon.png` |
| `manifest.webmanifest` | `app/manifest.ts` |
| Logo rastreable | PNG/SVG en URL estable, el mismo que se declara en `Organization` |

> El `index.html` actual tiene `<meta property="og:image" content="" />` — vacío. Hoy, cualquier enlace del sitio compartido en LinkedIn o WhatsApp sale sin imagen.

### 7.3 SEM y conversiones por idioma

Con dos idiomas y slugs distintos, mezclar las conversiones de ES y EN en un nombre ambiguo hace que los informes no sirvan. Se crea `site/src/config/sem.ts` y, **por `RouteId` e idioma**, se define: intención de búsqueda, CTA principal, nombre de conversión, landing recomendada, copy de anuncio compatible, UTM permitidas, idioma de la campaña, mercado objetivo y evento de conversión.

```ts
{ routeId: 'mssp', locale: 'es', conversion: 'es_mssp_contact_submit' }
{ routeId: 'mssp', locale: 'en', conversion: 'en_mssp_contact_submit' }
```

**No traducir literalmente las campañas de ES a EN sin revisión**: la intención de búsqueda no es la misma en los dos mercados.

#### Plan de eventos

El plan solo hablaba de instalar analítica, no de qué medir. Sin esto no se puede saber si la web funciona. Plan de eventos:

| Evento | Tipo |
|---|---|
| `contact_form_started` | Secundario |
| `contact_form_submitted` | **Conversión principal** |
| `calculator_started` | Secundario |
| `calculator_gate_submitted` | **Conversión principal** |
| `quote_generated` | Secundario |
| `proposal_requested` | **Conversión principal** |
| `newsletter_subscribed` | Conversión secundaria |
| `language_changed` | Diagnóstico |
| `outbound_sentry_clicked` | Diagnóstico |

Para cada evento hay que documentar: plataforma de destino, **condición de consentimiento** que lo habilita, parámetros permitidos, y si es conversión principal o secundaria.

> ⚠️ **Prohibido enviar a analítica el nombre, el email, el teléfono, la empresa o el mensaje.** Solo eventos y parámetros no identificativos (por ejemplo, la opción elegida en «¿Qué necesitas?», o el tamaño calculado S/M/L). Enviar datos personales a una herramienta de analítica es un tratamiento no declarado y, si la herramienta no es europea, además una transferencia internacional.

Verificar la implementación con Tag Assistant o el depurador de la plataforma elegida, no dando por hecho que el evento salta.

---

## Fase 8 · Legales y consentimiento (CMP)

> ⚠️ **Esta fase no se puede ejecutar antes de decidir la analítica (pendiente P12).** Lo que hay que construir depende por completo de esa decisión, y montar un CMP «por si acaso» significa añadir una cookie y un banner que quizá no sean necesarios.

**Y hay que retirar una afirmación de la primera versión de este documento.** Decía «la analítica recomendada por el brief (Plausible/Matomo) es sin cookies». Eso es una simplificación que no se sostiene: depende de la configuración concreta, del alojamiento, de cómo se trate la IP y de si se usa almacenamiento en el dispositivo. La redacción correcta es:

> Plausible o Matomo podrán utilizarse únicamente tras verificar su configuración efectiva, su alojamiento, el tratamiento de la dirección IP, el uso de almacenamiento local y, a partir de ahí, si requieren consentimiento o no.

### Escenario A · Sin cookies ni almacenamiento no necesarios

Si la analítica elegida está **verificadamente** exenta —sin identificadores, sin escribir en el dispositivo, correctamente configurada y con la IP tratada de forma que no permita identificar— puede no ser necesario mostrar banner. Seguirían siendo obligatorias la **política de cookies** y la información sobre los elementos técnicos utilizados.

### Escenario B · GA4, publicidad o cookies analíticas

Entonces sí hace falta CMP completo:

| Componente | Función |
|---|---|
| `ConsentProvider` | Contexto React. Guarda la decisión en una cookie de primera parte `isnl_consent` con la forma `{ necesarias: true, analiticas: bool, marketing: bool, ts, version }`. Atributos: **`Secure`, `SameSite=Lax`, `Path=/`** y duración documentada en la política |
| `CookieBanner` | Aparece si no hay decisión previa. **«Aceptar» y «Rechazar» en la misma capa, con la misma visibilidad y el mismo peso visual**, más «Configurar» |
| `CookiePreferences` | Modal con las categorías y su descripción, con control granular. Se abre también desde «Configurar cookies» del pie |
| `Analytics` | **No carga ningún script hasta que la categoría correspondiente esté aceptada** |

Requisitos que la AEPD exige y que hay que poder demostrar:

- Rechazar **al mismo nivel y con visibilidad equivalente** a aceptar. Un «Rechazar» en gris claro, en un submenú o solo como «Configurar» no cumple.
- **Ningún script de terceros antes del consentimiento**, incluidas fuentes, mapas y vídeos incrustados.
- **Retirar el consentimiento tan fácil como darlo**: el acceso desde el pie debe estar siempre disponible.
- Configuración **granular** por categoría, no todo o nada.
- **Registro de versión y fecha** de la decisión, para poder acreditarla.

**Página `/cookies`** — el texto actual (ocho párrafos) más una **tabla de cookies y tecnologías utilizadas**: nombre, finalidad, categoría, duración y titular. Es lo que exige la AEPD y hoy no está. La tabla debe reflejar lo que el sitio usa **de verdad**, así que se rellena al final, cuando esté decidida la analítica.

---

## Fase 9 · Accesibilidad, rendimiento y limpieza

### Accesibilidad (WCAG 2.1 AA)

**Base:**

- **Enlace «Saltar al contenido»** como primer elemento enfocable de la página. Sin él, quien navega por teclado tiene que recorrer la navegación entera en cada página.
- Foco visible en todo elemento interactivo. **No eliminar el `outline` sin sustituto.**
- Orden lógico de tabulación y navegación completa por teclado.
- `alt` en imágenes informativas y `aria-hidden` en las decorativas.
- *Landmarks* (`header` / `main` / `nav` / `footer`) y jerarquía de encabezados sin saltos.
- Preferir **HTML nativo** antes que recrear patrones con `div` y ARIA. Ver los radios de la calculadora en [5.6](#56-interfaz--sitesrccomponentscalculadora).

**Menú móvil y desplegable de Soluciones:**

- El desplegable debe abrirse **con teclado**, no solo con `hover`. Un menú que solo responde al ratón es inaccesible en teclado y en táctil.
- Al abrir el menú móvil, **mover el foco dentro** de él.
- **`Escape` cierra** menú y modales.
- Al cerrar, **el foco vuelve al elemento que lo abrió**.

**Modales (preferencias de cookies):**

- `role="dialog"` con **`aria-modal="true"`** y un `aria-labelledby` que apunte a su título.
- **Foco atrapado dentro del diálogo** mientras está abierto: `Tab` no debe salirse al contenido de detrás.
- `Escape` cierra y devuelve el foco.

**Formularios:**

- Errores asociados con `aria-describedby` y campo marcado con `aria-invalid`.
- Tras un envío fallido, **un resumen de errores al principio del formulario que recibe el foco**, con enlaces a cada campo. Es la diferencia entre poder corregir el formulario y abandonarlo.
- No anunciar cada cambio de precio mientras el usuario está escribiendo — ver [5.6](#56-interfaz--sitesrccomponentscalculadora).

**Verificación:**

- Lighthouse y `@axe-core/playwright` detectan problemas de marcado, pero **no** que el foco se pierda o que un menú sea inservible.
- **Probar a mano con NVDA (Windows) o VoiceOver (macOS)** al menos la Home, el formulario de contacto y la calculadora completa.

### Rendimiento (Core Web Vitals)

- Objetivo **LCP < 2,5 s**. Hero sin imágenes pesadas; los resplandores, con gradientes CSS.
- Imágenes en AVIF/WebP con `next/image`, `width`/`height` siempre puestos para evitar CLS, `loading="lazy"` bajo el pliegue.
- JavaScript mínimo: la mayoría de páginas son componentes de servidor. Solo llevan `'use client'` la Navbar, el menú móvil, los filtros del blog, los formularios, la calculadora y el CMP.
- Animaciones sutiles y respetando `prefers-reduced-motion`.

### Limpieza final

Una vez la web nueva esté verificada:

1. Borrar `web/`. La SPA Vite queda en el commit de baseline de la Fase 0.
2. Borrar el `index.html` de «En Construcción» de la raíz, o dejarlo si sirve de página de mantenimiento del hosting.
3. Verificar que **no queda ni una referencia a «North Labs» como nombre público** — solo «ISN Labs», y «Innovation and Security North Labs SL» exclusivamente en las páginas legales y las facturas.
4. Actualizar `CLAUDE.md` a la arquitectura nueva. Casi todo lo que describe hoy deja de ser cierto: SPA Vite, secciones ancladas, tres sistemas de color, clases `accent-cyan` muertas, ficheros vacíos `Botón.tsx`/`Tarjeta.tsx`, huérfano `AdminMensajes.tsx`.

---

## Fase 10 · Cabeceras, caché y endurecimiento

**B07.** Y con la migración, esta fase se parte en dos sitios: **las cabeceras del sitio se configuran en `netlify.toml`** y **las de la API, en el gateway y en Nginx**. `next.config` ya no sirve para esto: `headers`, `redirects` y `rewrites` están en la lista oficial de funciones **no soportadas** por `output: 'export'`.

### 10.1 Content-Security-Policy: la migración resuelve el problema

El plan anterior tenía un pendiente abierto (P26) porque pedía a la vez SSG y CSP estricta, y eran incompatibles: **los nonces exigen renderizado dinámico** —textual de la documentación: *«you must use dynamic rendering to add nonces»*, con la optimización estática y la ISR desactivadas— mientras la alternativa por hashes (`experimental.sri`) es experimental.

> ✅ **Sin runtime, el conflicto desaparece.** No hay servidor que pueda generar un nonce por petición, así que no hay nada que decidir: la CSP es una **cabecera estática servida por Netlify**. **P26 queda cerrado.**

**Procedimiento, en este orden.** La CSP no se escribe de memoria: se mide.

1. Empezar en **`Content-Security-Policy-Report-Only`** con la política objetivo:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy-Report-Only = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
```

2. Recoger informes con tráfico real durante unos días, incluidas todas las páginas, el formulario y la calculadora.
3. Ajustar a lo que el sitio necesita de verdad. Orígenes mínimos, sin comodines.
4. **No pasar a bloqueo hasta haber verificado**: el export de Next, la analítica si finalmente hay, las fuentes, las imágenes, el proxy `/api`, las previsualizaciones de Open Graph y la herramienta de consentimiento si existe.
5. Pasar a `Content-Security-Policy` en modo bloqueo.

`connect-src 'self'` basta para los formularios: el navegador llama a `/api/…`, del mismo origen, porque Netlify proxifica. Si algún día se llamara al gateway directamente habría que abrir su host aquí **y** montar CORS — otra razón para mantener el proxy.

> `style-src` arranca con `'unsafe-inline'` porque Next inyecta algunos estilos en línea. Es mucho menos grave que en `script-src`, pero conviene medir si se puede retirar.

### 10.2 Cabeceras del sitio en `netlify.toml`

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Frame-Options = "DENY"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Resource-Policy = "same-origin"
```

`frame-ancestors 'none'` va además dentro de la CSP, que es la forma moderna; `X-Frame-Options` se mantiene por navegadores antiguos.

#### El HSTS sigue siendo progresivo

Lo gestiona Netlify sobre el dominio, pero la precaución no cambia: `includeSubDomains` **bloquea cualquier subdominio que no sirva HTTPS** —incluido `api.secnorthlabs.eu`, que ahora existe— y el `preload` **no se revierte rápido**.

| Paso | Valor | Cuándo pasar al siguiente |
|---|---|---|
| 1 | `max-age=300` | Tras verificar que todo va por HTTPS sin avisos |
| 2 | `max-age=86400` | Tras unos días sin incidencias |
| 3 | `max-age=63072000` | Tras varias semanas estable |
| 4 | `+ includeSubDomains` | **Solo tras auditar todos los subdominios**, el del gateway incluido |
| 5 | `+ preload` | **Decisión consciente de sistemas**, no una línea más en un fichero |

### 10.3 Caché

```toml
# Activos versionados con hash: un año, inmutables
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# HTML: siempre revalidar, o un despliegue no se ve
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

Imágenes con hash en el nombre: un año. `sitemap.xml` y `robots.txt`: revalidación corta.

### 10.4 404 por idioma

Se generan `/es/404/` y `/en/404/`, y las reglas van **al final** de `netlify.toml`, después de todos los demás redirects:

```toml
[[redirects]]
  from = "/es/*"
  to = "/es/404/"
  status = 404

[[redirects]]
  from = "/en/*"
  to = "/en/404/"
  status = 404

[[redirects]]
  from = "/*"
  to = "/es/404/"
  status = 404
```

> ⚠️ **El orden importa y hay que comprobarlo.** Netlify evalúa los redirects de arriba abajo: si una de estas reglas comodín queda por encima de una ruta real, se la come. La prueba E2E debe cargar varias páginas existentes **después** de haber añadido estas reglas.

### 10.5 Endurecimiento de los endpoints del gateway

Ya no hay Route Handlers, así que esto se implementa en Fastify:

- Aceptar **solo `Content-Type: application/json`**; cualquier otro, `415`.
- **Límite de cuerpo de 32 KB**, aplicado también en Nginx (`client_max_body_size 32k`), y `413` al excederlo.
- **Validar `Origin`** contra el dominio propio cuando esté presente.
- **`Cache-Control: no-store`** en todas las respuestas ([6.6](#66-respuestas-del-gateway)).
- **Timeout explícito** hacia EspoCRM y SMTP.
- **Normalizar y limitar todas las cadenas**: recortar, longitud máxima, fuera caracteres de control.
- **Rechazar claves desconocidas** (`zod` con `.strict()`).
- **No reflejar los datos introducidos** en los errores.
- **`Retry-After`** en las respuestas `429`.
- **`requestId`** por petición, devuelto en el error y registrado.
- **Nada de datos personales en los logs.** Solo `requestId`, ruta, código y duración.

### 10.6 Rate limiting en dos capas

| Capa | Alcance | Ventana | Notas |
|---|---|---|---|
| **Netlify edge** | Por IP y dominio, antes de salir del CDN | **60–180 s** (máximo del producto) | 2–5 reglas por proyecto según plan. Ver [6.3](#63-el-proxy-firmado-de-netlify) |
| **Gateway** | Los límites de negocio, por IP y por `submissionToken` | Libre | Es donde viven los «5 por 10 minutos» |
| **Nginx** | Límite bruto de respaldo | Libre | Protege si el gateway se reinicia y pierde su contador en memoria |

El contador en memoria del gateway es aceptable con **un solo proceso**, que es el caso. Si algún día se escala a varias instancias hay que moverlo a un almacén compartido. Y **`X-Forwarded-For` se sobrescribe en Nginx**, nunca se añade: si se confía en la cabecera que llega, cualquiera falsifica su IP y el rate limiting es decorativo.

## Fase 11 · Despliegue y operación

Son **dos despliegues independientes** con ciclos de vida distintos: el sitio y el gateway.

### 11.1 Despliegue del sitio en Netlify

```toml
[build]
  base = "site"                # eliminar si site está en la raíz del repo
  command = "corepack enable && pnpm install --frozen-lockfile && pnpm build"
  publish = "out"

[build.environment]
  NODE_VERSION = "24.18.0"
  PNPM_VERSION = "10.34.5"
  NETLIFY_NEXT_PLUGIN_SKIP = "true"   # no queremos el runtime de Next

[[redirects]]
  from = "/"
  to = "/es/"
  status = 301
  force = true
```

> **`NETLIFY_NEXT_PLUGIN_SKIP = "true"` no es opcional.** Sin ella, el plugin de Next de Netlify puede intentar montar funciones para SSR y convertir en híbrido lo que queremos estático. Es justo lo que la migración evita.

**Flujo de publicación:**

1. Netlify conectado al repositorio `isnlabs-site`, y **solo a ese**.
2. Cada PR genera un **Deploy Preview**.
3. **Producción solo tras merge a `main`**, con branch protection exigiendo CI verde.
4. **GitHub Actions no necesita token de Netlify**: no se despliega desde Actions y desde Netlify a la vez, que es la forma clásica de tener dos despliegues pisándose.

**Lo que ya no existe:** proceso Node, `next start`, `output: 'standalone'`, copia manual de `public` y `.next/static`, Nginx delante del sitio, healthcheck del sitio, volumen de SQLite asociado al sitio, `sharp` en producción y secretos en el entorno del sitio. **El sitio no tiene ni un secreto.**

### 11.2 Despliegue del gateway

En el VPS, junto a EspoCRM, con red privada:

```yaml
services:
  espocrm:
    image: espocrm/espocrm:<VERSION_FIJADA>
    networks: [crm_private]
    expose: ["80"]          # sin ports: NO se publica a Internet

  gateway:
    image: registry.example/isnlabs-web-gateway:<TAG>
    networks: [crm_private, gateway_public]
    expose: ["3000"]        # tampoco se publica directamente
    environment:
      ESPOCRM_URL: "http://espocrm"      # nombre DNS del servicio, no 127.0.0.1

  nginx:
    image: nginx:<VERSION_FIJADA>
    networks: [gateway_public]
    ports: ["443:443"]      # el único puerto público

networks:
  crm_private:
    internal: true          # sin salida a Internet
  gateway_public:
```

La base de datos de EspoCRM pertenece **solo** a `crm_private`.

> ⚠️ **`127.0.0.1` no apunta al otro contenedor**, apunta al propio. Hay que usar el nombre DNS del servicio. Es un fallo clásico y el síntoma es «connection refused» en el formulario de contacto.

**Virtual host de Nginx** — publica exclusivamente `/web/v1/`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.secnorthlabs.eu;

    client_max_body_size 32k;
    server_tokens off;

    location ^~ /web/v1/ {
        proxy_pass http://gateway:3000/web/v1/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Request-Id $request_id;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $remote_addr;   # sobrescribir, no confiar

        proxy_connect_timeout 3s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;

        add_header Cache-Control "no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    location / { return 404; }    # todo lo demás no existe
}
```

**Resto del despliegue del gateway:**

1. **Usuario de sistema sin privilegios.** Nada de root.
2. **Volumen persistente** para la bandeja de salida. Si vive dentro del contenedor, cada despliegue borra los envíos pendientes.
3. Permisos: directorio de la base `700`, ficheros `.db`/`-wal`/`-shm` `600`, `.env` `600`, propietario el usuario del servicio.
4. **`better-sqlite3` compilado para la misma arquitectura y versión de Node** que corre en producción. Es un módulo nativo: si se compila en macOS ARM y se despliega en Linux x64, falla al cargar. Se compila dentro de la imagen.
5. **Reinicio supervisado** con systemd o la política de Docker.
6. **Rollback** escrito y probado, incluido qué pasa con las migraciones de la bandeja de salida.
7. **Copia de seguridad con la API de backup de SQLite**, nunca copiando el `.db` en caliente ([6.10](#610-bandeja-de-salida-submission--delivery_job)).
8. **Rotación de credenciales**: clave HMAC de EspoCRM, SMTP, `SUBMISSION_TOKEN_SECRET` y `NETLIFY_GATEWAY_SIGNING_SECRET`.
   > Rotar el secreto de firma de Netlify hay que hacerlo **en los dos lados a la vez**, o el gateway rechaza todo el tráfico. Conviene admitir temporalmente dos secretos válidos durante la rotación.
9. **Panel de EspoCRM solo por WireGuard**, con DNS interno y MFA. Si no hay VPN: virtual host independiente, allowlist de IP, MFA, WAF y rate limiting — y **nunca** una ruta poco predecible como única protección.

### 11.3 Imágenes: pipeline en build

Como no hay optimizador en runtime (`images.unoptimized: true`), se genera todo en el build:

1. Originales **fuera de `public/`**, para que no se publiquen sin procesar.
2. Script con **Sharp** en `pnpm images:build`.
3. Generar **AVIF + WebP + fallback** en anchos 320, 480, 640, 768, 1024, 1280 y 1600.
4. Escribir un **manifest de imágenes** con dimensiones reales.
5. Renderizar `<picture>` con `srcset` y `width`/`height` siempre puestos, para no provocar CLS.
6. Hero crítico: `fetchpriority="high"` y **sin** `loading="lazy"`. El resto: `loading="lazy"` y `decoding="async"`.

> Si el hero no necesita fotografía, mejor CSS y SVG local: es lo que mantiene el LCP por debajo de 2,5 s en móvil real.

**Fuentes:** autohospedadas en el artefacto, solo los pesos que se usan, subset latino, `font-display: swap`, `preload` únicamente de la crítica y fallback con métricas próximas. **Ninguna petición a Google Fonts en producción** — hoy el proyecto las carga por `@import`, y eso además es una transferencia de la IP del visitante a un tercero.

### 11.4 Observabilidad y alertas

El sitio no necesita observabilidad: es un CDN sirviendo ficheros. **Todo esto es del gateway:**

- `GET /internal/live` y `/internal/ready` separados, **sin exponer versiones ni rutas**, y no publicados por Nginx.
- Rotación de logs configurada. Un disco lleno de logs tira el servicio.

| Alerta | Por qué |
|---|---|
| `delivery_job` pendientes por encima de un umbral, o con más de 1 h | El CRM no está sincronizando |
| Fallos de EspoCRM | Caído, o clave rotada sin actualizar |
| Fallos de SMTP | Nadie está viendo los avisos |
| **Firmas de Netlify rechazadas** | Secreto desincronizado, o alguien probando el endpoint directamente |
| Tasa anómala de `429` | Ataque, o un límite mal calibrado bloqueando usuarios reales |
| Espacio en disco y caducidad de certificados | |

**SPF, DKIM y DMARC** en el dominio emisor. Sin ellos, la autorespuesta y el aviso comercial acaban en spam, y el efecto práctico es idéntico a que el formulario no funcione.

### 11.5 Prueba final de recuperación

Reiniciar el VPS completo y comprobar que el gateway vuelve solo, que la bandeja de salida conserva los pendientes y que el worker los procesa. Y por el lado del sitio, que un despliegue de Netlify no rompe nada porque **no tiene estado**. Si esto no se prueba, no se sabe.

## Fase 12 · Pruebas, CI y E2E

**B07.** Con dos repositorios, son **dos pipelines**. El del sitio protege la arquitectura estática; el del gateway protege los datos.

### 12.1 Pipeline de CI del sitio

```bash
pnpm install --frozen-lockfile
pnpm check:age              # cadena de suministro: ninguna versión con < 24 h
pnpm verify:architecture    # ¿ha vuelto alguien a meter servidor?
pnpm lint
pnpm typecheck
pnpm check:i18n             # paridad estructural ES/EN
pnpm check:routes           # manifiesto coherente, sin slugs duplicados
pnpm test
pnpm build                  # genera out/
pnpm verify:export          # inspecciona el artefacto
pnpm test:e2e
```

`--frozen-lockfile` y nunca un `install` que pueda resolver versiones nuevas por su cuenta.

**Seguridad de los workflows**, que es parte de la superficie de ataque y se olvida siempre:

- **Actions fijadas por SHA completo**, no por etiqueta. Una etiqueta se puede mover.
- Dependabot actualiza también las actions.
- `permissions: contents: read` por defecto, ampliando solo donde haga falta.
- **Sin secretos en workflows de PR.**
- **Nunca `pull_request_target` ejecutando código del PR.**
- Sin `curl | bash` ni `pnpm dlx` con versiones flotantes.
- Node y pnpm exactos, branch protection, environment para producción y logs sin secretos.

### 12.2 `verify:architecture` — que la migración no se deshaga sola

`scripts/assert-static-architecture.mjs` **falla el build** si aparece en el repositorio del sitio cualquiera de:

```text
'use server'        app/api/            route.ts
proxy.ts            middleware.ts       Server Actions
cookies()           headers()           draftMode()
revalidatePath()    revalidateTag()
runtime = 'nodejs'  runtime = 'edge'    output: 'standalone'
import 'server-only'
.netlify/functions  .netlify/edge-functions
```

Es la diferencia entre una decisión de arquitectura y un comentario en un documento que nadie lee. Sin este script, en seis meses alguien añadirá un Route Handler «solo para una cosita» y la web dejará de ser estática sin que nadie lo note.

### 12.3 `verify:export` — inspeccionar el artefacto

`scripts/assert-static-output.mjs` comprueba sobre `out/`:

**Que está completo:**

- Existen `out/es/index.html` y `out/en/index.html`.
- Hay un HTML por cada ruta con `enabled: true` en `ROUTES`, en los dos idiomas.
- Todos los HTML tienen `lang`, canonical, hreflang y **un único `<h1>`**.

**Que no se ha filtrado nada:**

- No existen `.netlify/functions` ni `.netlify/edge-functions`.
- No se publica `.next/server`.
- No hay ficheros `.env`.
- No aparecen `ESPOCRM_`, `SMTP_`, `NETLIFY_GATEWAY_SIGNING_SECRET` ni ninguna tarifa protegida.
- **No aparece ningún nombre de cliente** de la hoja VALIDACION.
- No hay source maps de producción salvo aprobación expresa.

```bash
# Comprobación de tarifas: el modelo ya no está en este repositorio,
# así que cualquier coincidencia es un error grave.
grep -rE "\b6\.58\b|edrUsuario|tarifaTecnica|auditoriaEjecuciones" out/   # sin resultados
grep -riE "campoastur|el musel|plabite|microviable|sierense|galma|acciona|adaro" out/
```

### 12.4 Dependabot y espera mínima de 24 h

Una versión recién publicada es el vector clásico de ataque de cadena de suministro: se compromete una cuenta, se publica un parche con código malicioso y se cuenta con que la automatización lo instale antes de que nadie lo mire. **Tres controles complementarios**, porque ninguno basta solo:

| Control | Qué cubre | Qué no cubre |
|---|---|---|
| **`cooldown` de Dependabot** | Retrasa la apertura de PR de actualización | **No se aplica a las actualizaciones de seguridad** |
| **`minimumReleaseAge: 1440` de pnpm** | Impide *resolver* una versión de menos de 24 h | No impide que llegue un lockfile ya modificado |
| **Age gate propio en CI** | Verificable y visible en el PR. Es el que cierra los dos huecos anteriores | |

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"        # cubre también pnpm
    directory: "/"
    schedule:
      interval: "daily"
      time: "04:00"
      timezone: "Europe/Madrid"
    cooldown:
      default-days: 1
      semver-major-days: 1
      semver-minor-days: 1
      semver-patch-days: 1
      include: ["*"]
    open-pull-requests-limit: 10
    groups:
      next-react:
        patterns: ["next", "react", "react-dom", "@types/react", "@types/react-dom"]
      lint-and-types:
        patterns: ["eslint*", "@eslint/*", "typescript", "@types/*"]
      testing:
        patterns: ["vitest", "@vitest/*", "@playwright/*", "@axe-core/*"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly", day: "monday" }
```

> **Verificar antes de dar por hecho el soporte de pnpm.** Dependabot usa `package-ecosystem: "npm"` para lockfiles de pnpm, pero conviene confirmar en la documentación de ecosistemas soportados qué versiones de pnpm cubre, sobre todo antes de plantearse subir a pnpm 11. Y si `default-days` se omite, Dependabot aplica 3 días por defecto.

**El age gate** — `scripts/check-package-age.mjs`:

1. Compara `pnpm-lock.yaml` entre la base y la cabeza del PR.
2. Extrae los paquetes y versiones nuevas o modificadas.
3. Consulta la metadata del registry y lee `time[version]`.
4. **Falla** si la edad es menor de 24 h, si falta el timestamp, si la versión es *prerelease* o si el paquete viene de una URL o un git no permitidos.
5. Imprime **solo** paquete, versión y tiempo restante.
6. No usa ninguna dependencia npm para validarse a sí mismo — sería circular.

```text
AGE_GATE_FAILED
react-dom@19.2.8 was published 21h 17m ago.
Minimum required age: 24h. Retry after: 2h 43m.
```

> **Que el primer intento falle es el comportamiento correcto, no un error.** Un PR de seguridad puede abrirse antes de las 24 h; CI falla por edad, **el PR no se cierra**, y un workflow programado (`dependabot-recheck.yml`, cron cada 3 h) relanza el CI cuando la versión cumple la edad. Al pasar, sigue el resto del pipeline.

**Auto-merge:**

| Automático | No automático |
|---|---|
| Parches, menores y actualizaciones de seguridad | **Majors** |
| Actions de GitHub | Cambios que modifican `onlyBuiltDependencies` |
| Solo si: > 24 h · CI verde · build estático verde · E2E verde · Lighthouse sin regresión grave · **sin script de instalación nuevo no aprobado** | Next o React con notas de rotura |
| | Cambios de Node o pnpm major |
| | Cambios en seguridad, CSP o gateway |
| | Dependencias nuevas |

> **Un script de instalación es ejecución de código en la máquina de build.** Por eso `onlyBuiltDependencies` se revisa a mano y esta es una excepción deliberada a la automatización, no una carencia. Automatizar los majors tampoco es una política segura: es cómo se cuela una rotura silenciosa en producción un viernes.

### 12.5 Pruebas E2E

**Arquitectura estática** — son las que verifican que la migración es real:

- `out/` existe y **no hay ninguna función serverless**.
- Netlify sirve el HTML **sin invocar cómputo**.
- `/` devuelve **301** a `/es/`.
- `/es/` y `/en/` devuelven HTML **distinto**.
- **Cada página tiene su contenido completo con JavaScript desactivado.** Es la prueba de que los Server Components hicieron su trabajo en build.

**i18n:**

- El selector conserva la **página lógica**, con slug traducido y ancla traducida.
- Canonical autorreferencial por idioma, hreflang recíproco y `x-default` → ES.
- `lang` correcto en cada HTML, sin mezcla de cadenas ES/EN en la misma página.
- Sitemap con solo las rutas `enabled && indexable`.
- Open Graph y JSON-LD localizados.
- 404 en ES y EN, incluida una ruta profunda inventada, y **las rutas reales no interceptadas** por las reglas comodín.

**Móvil** — matriz completa de [1.6](#16-mobile-first):

- 320 px sin scroll horizontal, y el resto de anchuras.
- Tablet en vertical y horizontal.
- Objetivos táctiles, teclado virtual sin tapar el botón, sin zoom de iOS al enfocar un input.
- Menú, formulario, calculadora, modales, safe-area y cambio de orientación.
- `@axe-core/playwright` en Home, contacto y calculadora.

**Proxy firmado y gateway** (con EspoCRM y SMTP simulados):

- **Petición directa al gateway sin firma: rechazada.**
- Firma incorrecta, expirada, `netlify_id` que no coincide, `alg` distinto de HS256: rechazadas.
- **Deploy preview apuntando al gateway de producción: rechazado** por `deploy_context`.
- Cuerpo > 32 KB → `413`. `Content-Type` incorrecto → `415`.
- Honeypot y envío demasiado rápido: **éxito silencioso sin persistir**.
- Doble clic: **una sola** submission.
- CRM caído: submission persistida y el usuario ve éxito. SMTP caído: `delivery_job` pendiente. El worker recupera ambos.
- **La bandeja de salida sobrevive a un reinicio** del contenedor.
- Token de propuesta alterado o caducado: rechazado.
- **`recalculate` no toca EspoCRM ni envía correo** — la verificación de B09.
- `proposal` actualiza el Lead **una sola vez**.

**EspoCRM, mínimo privilegio** — con la credencial HMAC real del gateway. Debe poder crear el Lead, leerlo y editarlo dentro del equipo. **No debe poder** listar todos los Leads, exportar, borrar, ni acceder a Accounts, Contacts, Users ni administración. Probar también `409`, `403`, timeout, y que **desactivar el usuario de API invalida el acceso**. Conservar la evidencia de los tests negativos.

**Cadena de suministro:**

- Paquete de menos de 24 h → falla. De más de 24 h → pasa.
- Timestamp ausente → falla.
- PR de seguridad de menos de 24 h → falla al principio y **pasa en el recheck posterior**.
- Script de instalación nuevo → falla.
- Major → **no** se auto-fusiona. Minor → sí, tras los checks.

### 12.6 Rendimiento

| Métrica | Objetivo |
|---|---|
| LCP | < 2,5 s **en móvil real**, no solo en Lighthouse de escritorio |
| INP | < 200 ms |
| CLS | < 0,1 |
| Lighthouse móvil · rendimiento | ≥ 90 |
| Lighthouse · accesibilidad | ≥ 95, **sin sustituir las pruebas manuales** |
| Lighthouse · SEO | 100 |

**Presupuesto de JavaScript**, que es lo que decide de verdad el INP:

- **Home: menos de 100 KB gzip** de JS propio más framework.
- Páginas interiores: menos que la Home.
- Calculadora, CMP y filtros del blog: **cada uno en su chunk**, cargado solo en su página.
- Sin librerías de gráficos, sin Framer Motion, **iconos con imports individuales** y sin provider global de estado.

**Terceros: cero por defecto.** Antes de añadir uno hay que justificar finalidad, medir peso, revisar privacidad, encajarlo en la CSP y en el consentimiento, definir fallback, medir impacto en móvil y asignar un responsable.

**Lighthouse CI** con presupuestos sobre Home ES, Home EN, MSSP ES, MSSP EN, contacto y calculadora. Conviene no tumbar el despliegue por fluctuaciones de dos o tres puntos: el valor está en detectar una regresión grande.

## Orden de ejecución recomendado

Reordenado por la migración. **Un commit por paso**: no mezclar en el mismo la migración a pnpm, el cambio de rutas, la exportación estática y la integración con EspoCRM.

| Paso | Trabajo | Repositorio |
|---|---|---|
| **M0** | **Congelar el plan actual**: commit, etiqueta, inventario. No desarrollar más Route Handlers | — |
| **M1** | **Separar la información sensible**: sacar el Excel VALIDACION del repositorio que verá Netlify, crear `isnlabs-web-gateway`, **revisar el historial de git** por si hubo datos confidenciales y, si los hubo, reescribirlo y rotar accesos | ambos |
| **M2** | **pnpm y Node fijados**, migración aislada, CI verde sin ningún cambio funcional | site |
| **M3** | **Rutas**: manifiesto, `/es` y `/en`, slugs, selector, sitemap, redirección raíz, 404 por idioma | site |
| **M4** | **Exportación estática**: `output: 'export'`, eliminar proxy y APIs, generar `out/`, `verify:architecture` y `verify:export` | site |
| **M5** | **Reducir JavaScript**: auditar cada `'use client'`, pasar contenido como props, eliminar providers globales, dividir chunks y **medir** | site |
| **M6** | **Mobile-first**: revisar componentes, escalas fluidas, tablas, navegación, formularios y calculadora, con pruebas visuales | site |
| **M7** | **Motor PBCG en el gateway**: `config` → `calculate` → **test de oro en verde** → batería completa | gateway |
| **M8** | **Bandeja de salida**: `submission` + `delivery_job`, migraciones, idempotencia, worker y adaptadores simulados de CRM y correo | gateway |
| **M9** | **Web Gateway**: scaffold Fastify, verificación de la firma de Netlify, validación, endpoints y tests | gateway |
| **M10** | **EspoCRM**: red privada, Nginx, equipo `Web Leads`, rol, usuario HMAC, campos personalizados, contrato de metadata y pruebas de mínimo privilegio | gateway |
| **M11** | **Proxy de Netlify**: signed redirect, rate limiting, staging con su propio secreto, y prueba end-to-end real | ambos |
| **M12** | **Interfaz de la calculadora** y flujo completo puerta → recotización → propuesta | site |
| **M13** | **Home** y componentes reutilizables | site |
| **M14** | MSSP y catálogos, GRC y catálogo, Software, Sectores, Compañía | site |
| **M15** | **Contacto** e integración real con EspoCRM de punta a punta | ambos |
| **M16** | Blog: página real o «Próximamente» no indexable | site |
| **M17** | Legales y CMP, **una vez decidida la analítica** | site |
| **M18** | **Dependabot y auto-merge**: cooldown, age gate, recheck, branch protection | ambos |
| **M19** | **SEO y SEM**: imágenes, fuentes, metadatos, redirecciones, eventos de conversión, Search Console | site |
| **M20** | **Publicación**: pentest funcional del gateway, backup, restore probado, alertas, rollback, DNS y revisión a 24/48 h | ambos |

> **Por qué el motor PBCG y la bandeja de salida (M7–M8) van antes que la interfaz (M12):** son las piezas de las que depende que todo lo demás sea correcto, y construir la interfaz primero es exactamente lo que produjo el bloqueante B01.

## Verificación

### Automática — repositorio del sitio

```bash
pnpm install --frozen-lockfile
pnpm check:age              # cadena de suministro
pnpm verify:architecture    # sin servidor en el repositorio
pnpm lint && pnpm typecheck
pnpm check:i18n             # paridad estructural ES/EN
pnpm check:routes           # manifiesto coherente
pnpm test
pnpm build                  # genera out/ y ejecuta verify:export
pnpm test:e2e
```

El script de paridad estructural ES/EN está en [2.5](#25-paridad-estructural-esen).

### Automática — repositorio del gateway

```bash
pnpm test                   # el caso de oro del PBCG y la batería completa
pnpm test:integration       # firma de Netlify, outbox, EspoCRM simulado
```

**El caso de oro del Excel debe dar exactamente esto**, y es lo primero que hay que tener en verde:

| Magnitud | Valor |
|---|---|
| Horas técnicas/mes | `7.5` |
| Total redondeado | **`840 €`** |
| Horquilla total | **`815 – 900 €/mes`** |

Si no cuadra, el error está en `calculate.ts`, no en la interfaz.

### Manual — el sitio

- Todas las rutas con `enabled: true` cargan en `/es/` y en `/en/`, y **el selector de idioma mantiene la página lógica** con el slug traducido.
- `curl -I https://…/` devuelve **301** a `/es/`.
- `curl https://…/es/soluciones/mssp/ | grep "<title>"` devuelve el título **en el HTML**, no inyectado por JavaScript. Repetir en inglés con `/en/solutions/mssp/`.
- **Con JavaScript desactivado**, cada página muestra su contenido completo.
- Canonical autorreferencial y hreflang recíproco en ambos idiomas.
- A 375 px de ancho: sin scroll horizontal, el teléfono pulsable y el teclado virtual sin tapar el botón de enviar.

### Manual — que la migración es real

```bash
# 1. El artefacto no contiene nada de servidor
ls out/.netlify 2>/dev/null            # no debe existir
find out -name "*.env*"                # sin resultados

# 2. El modelo de precios no está en el repositorio del sitio, ni en el artefacto
grep -rE "\b6\.58\b|edrUsuario|tarifaTecnica" out/ src/    # sin resultados

# 3. Ningún nombre de cliente en ninguna parte
grep -riE "campoastur|el musel|plabite|microviable|sierense|galma|acciona|adaro" .

# 4. Ningún secreto en el artefacto (grep -F: literal; saltar si está vacío)
for var in NETLIFY_GATEWAY_SIGNING_SECRET ESPOCRM_API_KEY SMTP_PASS; do
  val=$(grep "^$var=" .env 2>/dev/null | cut -d= -f2-)
  if [ -z "$val" ]; then echo "SALTADO (vacío): $var"; continue; fi
  if grep -rqF "$val" out/; then echo "FILTRADO: $var"; else echo "OK: $var"; fi
done
```

### Manual — el gateway y EspoCRM

- **`curl -X POST https://api.secnorthlabs.eu/web/v1/contact` sin cabecera `x-nf-sign` → rechazado.** Es la prueba de que el gateway no está abierto.
- `curl https://api.secnorthlabs.eu/` → **404**. Cualquier ruta fuera de `/web/v1/` → 404.
- **EspoCRM no es alcanzable desde fuera**: `curl` a su puerto y a su `/api/v1/` desde una red externa debe fallar por red, no por autenticación.
- El Lead aparece con **los 12 campos personalizados rellenos**. Comprobarlos uno a uno: si alguno sale vacío, el nombre de API no coincide y el dato se está perdiendo en silencio ([6.11](#611-mapeo-a-la-entidad-lead-de-espocrm)).
- **Parar EspoCRM**, enviar el formulario: el usuario ve éxito, llega el correo comercial y el `delivery_job` queda `pending`. Arrancarlo y comprobar que el worker lo pasa a `completed` con su `espo_lead_id`.
- **Reiniciar el contenedor** con envíos pendientes: siguen ahí. Si desaparecen, la base no está en volumen persistente.
- **Ajustar parámetros en la calculadora tras pasar la puerta y comprobar en el CRM que el Lead NO se modifica.** Es la verificación de B09.
- Interceptar la petición a `/api/quote/initial`, añadirle un `total` inventado, y comprobar que la respuesta **ignora ese valor**.
- Rechazar cookies y comprobar en la pestaña Red que **no se carga ningún script de analítica**.

## Pendientes de negocio

Bloquean la publicación, no el desarrollo. Recopilados de los avisos de los propios documentos: conviene enviarlos a dirección al empezar, para que estén resueltos cuando el desarrollo termine.

| # | Pendiente | Detalle |
|---|---|---|
| 1 | **Precios de licencia EDR/MDR** | 3 € y 6,58 €/usuario/mes. Marcados en el Excel como *«MARCADOR DE POSICIÓN: confirmar precio real con el distribuidor»*. Afectan directamente al precio que ve el cliente |
| 2 | **Tarifa técnica de 57 €/h** | La hoja VALIDACION indica que la media efectiva de la cartera actual es ~51 €/h. Confirmar que las ofertas nuevas deben salir por encima de la heredada |
| 3 | **Teléfono de incidentes 24/7** | ¿Existe la línea? Si no, el bloque se queda oculto |
| 4 | **Dominio y correo definitivos** | El brief usa `hola@isnlabs.eu`; la web actual, `info@secnorthlabs.eu`. ¿Se cambia de dominio con el cambio de marca? Afecta a canonical, sitemap, hreflang y `mailto:` |
| 5 | **Fuentes** | Space Mono + Noto Sans (§1) frente a JetBrains/IBM Plex Mono (§12). Se implementa §1 |
| 6 | **Logos oficiales** | Microsoft, Huntress, OPNsense, Fortinet y Ewala, con sus normas de marca. Hasta entonces, solo texto |
| 7 | **LinkedIn de empresa** | Para el `Organization` de schema.org |
| 8 | **Plan editorial del blog y CMS** | Los seis artículos actuales son placeholders declarados |
| 9 | **Fotos del equipo** | Fase 2 según el brief; por ahora, placeholder con la inicial |
| 10 | **Landings SEO** | Por marco (ENS, ISO 42001, ISO 27001, NIS2) y por sector. Fase 2. Hasta entonces **las tarjetas se renderizan sin enlace**, no apuntando a `/contacto` |
| 11 | **Proveedor de email marketing** | Para la newsletter, con doble opt-in. ¿Se usan las Target Lists de EspoCRM o un proveedor externo? |
| 12 | **Elección de analítica** ⛔ | Plausible, Matomo o GA4. **Ninguna se puede dar por exenta de consentimiento sin verificar** su configuración efectiva, alojamiento, tratamiento de IP y uso de almacenamiento local ([Fase 8](#fase-8--legales-y-consentimiento-cmp)). **Bloquea la Fase 8 completa** |

### Pendientes añadidos por la integración con EspoCRM

| # | Pendiente | Responsable | Detalle |
|---|---|---|---|
| 13 | **URL y accesibilidad de la instancia de EspoCRM** | Sistemas | ¿Mismo VPS que la web o distinto? Si es distinto, ¿red privada entre ambos? Determina el valor de `ESPOCRM_URL` |
| 14 | **Crear el equipo `Web Leads`, el usuario de API y su rol** ⛔ | Sistemas | Rol con creación + lectura/edición **a nivel de equipo**, sin eliminar ni exportar ([6.9.1](#6131-b10--el-modelo-de-permisos-y-la-asignación-están-acoplados)). **Probar contra la instancia real** que el usuario puede actualizar un Lead ya asignado al equipo. Entregar la API key por canal seguro, nunca por correo ni chat |
| 15 | **Crear los 11 campos personalizados de Lead** | Sistemas / CRM | Tabla de la [sección 6.7](#611-mapeo-a-la-entidad-lead-de-espocrm). **Bloquea el desarrollo del endpoint**: sin los campos creados, los datos se pierden en silencio |
| 16 | **Revisar la política de privacidad** | Quien la redactó | ¿Cubren sus apartados de destinatarios y conservación el alta en un CRM propio? Ver [6.10](#614-base-jurídica-y-deberes-de-rgpd). **El equipo de desarrollo no toca el texto legal** |
| 17 | **Entrada en el RAT y plazo de conservación de leads** | Responsable de cumplimiento | Finalidad, base jurídica, categorías, plazo y destinatarios. Y procedimiento de borrado de los leads no convertidos |
| 18 | **A quién se asignan los leads** | Comercial | Valor de `ESPOCRM_ASSIGNED_USER_ID`, o dejarlos sin asignar en una bandeja común |
| 19 | **Buzón comercial de destino** | Comercial | Valor de `CONTACT_TO_EMAIL`. Es una notificación, no la copia de seguridad |
| 20 | **Decisión de antispam** | Dirección | Se propone honeypot + tiempo + rate limiting, y Altcha si aparece spam real. **Requiere descartar reCAPTCHA de forma explícita** — ver [6.8](#612-captcha-recaptcha-contradice-el-argumento-de-soberanía) |

### Pendientes bloqueantes añadidos por la revisión técnica

Estos cuatro **impiden cerrar el desarrollo**, y tres de ellos condicionan el paso 0 del [orden de ejecución](#orden-de-ejecución-recomendado):

| # | Pendiente | Responsable | Por qué bloquea |
|---|---|---|---|
| P21 | **Definir qué es el campo de renting de firewall** | Dirección / Comercial | ✅ **Ya no bloquea.** El campo se ha eliminado por completo de esta versión, así que solo condiciona una futura ampliación que lo incluya. Ver [5.3](#53-lógica-de-cálculo--gatewaysrcdomainpbcgcalculatets) |
| **P22** | **Validar la base jurídica de cada formulario** | Cumplimiento | Determina la redacción de la casilla obligatoria, qué se guarda como evidencia, si se conserva la IP y qué derechos aplican. El plan apunta a medidas precontractuales, **no a consentimiento**, pero necesita confirmación. Ver [6.10](#614-base-jurídica-y-deberes-de-rgpd) |
| **P23** | **Inventario de URLs indexadas de la web actual** | Marketing / SEO | Sin él no se puede escribir el mapa de redirecciones y se pierde posicionamiento al borrar `web/`. Se saca de Search Console. Ver [7.1](#71-redirecciones-desde-la-web-anterior) |
| **P24** | **Decidir qué se hace con `/blog`** | Marketing | Página «Próximamente», `noindex`, o ruta desactivada. **No se publican los seis artículos de ejemplo.** Se implementa con el flag `BLOG_ENABLED` / `BLOG_INDEXABLE` de `routes.ts`. Ver [4.9](#49-blog--blog--namespace-blog) |

### Pendientes añadidos por la segunda revisión

| # | Pendiente | Responsable | Por qué bloquea |
|---|---|---|---|
| **P25** | **Estrategia ante Leads duplicados en EspoCRM** | Comercial / CRM | Un `409` sin estrategia definida deja el envío sin `espo_lead_id`, y entonces la solicitud de propuesta detallada no sabe qué Lead actualizar. Tres opciones en [6.9.2](#6132-b10--qué-hacer-cuando-espocrm-devuelve-409); se recomienda la A |
| P26 | **Elegir la estrategia de CSP** | — | ✅ **Cerrado por la migración.** Sin runtime no hay conflicto: la CSP es una cabecera estática de Netlify. Ver [10.1](#101-content-security-policy-la-migración-resuelve-el-problema) |
| **P27** | **Auditoría de subdominios antes del HSTS** | Sistemas | `includeSubDomains` bloquea cualquier subdominio sin HTTPS, y `preload` es difícil de revertir. Ver el escalonado de [10.2](#102-cabeceras-del-sitio-en-netlifytoml) |

### Pendientes añadidos por la migración a arquitectura estática

| # | Pendiente | Responsable | Detalle |
|---|---|---|---|
| **P28** | **Plan de Netlify contratado** | Sistemas | Determina cuántas reglas de rate limiting se pueden definir: **2–5 por proyecto** salvo Enterprise. Con una regla por endpoint se agota el cupo. Ver [6.3](#63-el-proxy-firmado-de-netlify) |
| **P29** | **Subdominio y certificado del gateway** | Sistemas | `api.secnorthlabs.eu` (o el que se decida con P4). Entra además en la auditoría previa al `includeSubDomains` del HSTS |
| **P30** | **Registro de contenedores** para la imagen del gateway | Sistemas | Privado. Define el `<TAG>` del despliegue |
| **P31** | **Aprobar la separación en dos repositorios** | Dirección / Sistemas | Si se arranca como monorepo temporal, **queda un pendiente técnico bloqueante antes de producción**, porque Netlify tendría acceso al código del gateway durante el build |
| **P32** | **Revisar el historial de git** por datos confidenciales | Sistemas / Seguridad | Antes de conectar Netlify. Si el Excel VALIDACION o alguna credencial estuvieron en algún commit, hay que reescribir el historial y rotar accesos. Paso **M1** |
| **P33** | **Variante de inglés y traducción profesional** | Marketing | ¿`en` genérico o una variante? Y quién traduce o valida jurídicamente el copy legal: **no se genera con traducción automática** |

**Ninguno bloquea las fases 0 a 5.** P28–P30 bloquean el paso M11 (proxy de Netlify); P31 y P32, la puesta en producción.
Y el pendiente **P12 (elección de analítica) es bloqueante** de la Fase 8 completa: lo que hay que construir en el CMP depende por entero de esa decisión.

**Ninguno de estos pendientes bloquea las fases 0 a 5**, que pueden empezar de inmediato. Ver [readiness por fase](#33-readiness-por-fase).

---

## Anexo A · Validación del consejo recibido sobre EspoCRM

Dirección pidió validar la recomendación técnica que circuló el 27/07/2026. Este es el resultado, contrastado con la documentación oficial de EspoCRM y con la definición real de la entidad `Lead`.

**Veredicto general: la arquitectura propuesta es correcta y la aprobamos.** El núcleo del consejo —no llamar a EspoCRM desde el navegador, mantener la API key en el servidor, usuario de API con permisos mínimos— es exactamente la práctica correcta y resuelve el riesgo principal. Hay tres correcciones y un cambio.

### A.1 Confirmado como correcto

| Afirmación | Estado |
|---|---|
| EspoCRM es open source, autoalojable y con API REST | ✅ Correcto |
| Nunca exponer la API key en el frontend React | ✅ **Correcto y esencial.** En Next hay que añadir: jamás en una variable `NEXT_PUBLIC_*`, porque acaban en el bundle |
| Patrón de proxy: formulario → endpoint propio → EspoCRM | ✅ Correcto |
| Autenticación por cabecera `X-Api-Key` | ✅ Verificado en la documentación oficial |
| Existe autenticación HMAC como alternativa | ✅ Verificado (`X-Hmac-Authorization`) |
| Crear el registro con `POST /api/v1/Lead` | ✅ Verificado |
| Usuario de API con rol de mínimo privilegio | ✅ Correcto, y es la mitigación más valiosa de la lista |
| Mapeo `firstName`, `lastName`, `accountName`, `emailAddress`, `phoneNumber`, `description` | ✅ Verificado contra la entidad Lead |
| TLS, firewall/WAF, admin no expuesto, actualizaciones, backups cifrados, rate limiting | ✅ Correcto |
| Registro de la evidencia con marca de tiempo y versión del texto, opt-in de marketing separado, retención definida | ✅ Correcto y obligatorio, **con un matiz**: para los formularios generales lo que se registra es que se **facilitó la información**, no un consentimiento. El consentimiento como tal solo aplica al marketing. Ver [6.1](#61-campos-y-validación--componentsformscontactformtsx) |
| «Es tan seguro como lo configures; al autohospedarlo la responsabilidad es tuya» | ✅ Valoración honesta y acertada |

### A.2 Correcciones

**1. El proxy Express ya no hace falta.** El consejo parte de que la web es una SPA Vite sin backend. Se ha decidido migrar a Next.js, y sus Route Handlers cumplen ese papel sin desplegar un segundo servicio. Montar Express aparte añadiría otro proceso que mantener, parchear y vigilar, sin ninguna ventaja. *→ Ver [6.3](#63-el-proxy-firmado-de-netlify).*

**2. `source` no acepta texto libre.** Es un enum con opciones cerradas: `""`, `Call`, `Email`, `Existing Customer`, `Partner`, `Public Relations`, `Web Site`, `Campaign`, `Other`. Enviar `'calculadora-web'`, como sugiere el consejo, hace que el campo falle o se descarte. Se usa `"Web Site"` y el origen fino va a un campo personalizado.

**3. El cargo no necesita campo personalizado.** El consejo propone `cRole`, pero `title` es un campo **estándar** de Lead. Un campo personalizado de menos que crear y mantener.

**Y un aviso que el consejo no incluye:** si se envía a la API un atributo que no existe en EspoCRM, **el dato se pierde sin error visible**. Los 11 campos personalizados de la [sección 6.7](#611-mapeo-a-la-entidad-lead-de-espocrm) tienen que existir en el Entity Manager *antes* de programar el endpoint, o medio formulario se irá al vacío sin que nadie se entere.

### A.3 El cambio: reCAPTCHA no

El consejo propone «captcha/honeypot en el proxy» sin concretar, y la propia función Lead Capture de EspoCRM implementa reCAPTCHA v3. **Recomendamos descartar reCAPTCHA.**

Es de Google: envía la IP y señales de comportamiento del visitante a un responsable estadounidense, en todas las páginas donde se carga y no solo al enviar el formulario. En la web de una consultora de ciberseguridad cuyo argumento de venta es la soberanía del dato, es una incoherencia que un cliente técnico detecta enseguida. Además obliga a declarar una transferencia internacional en la política de privacidad y a bloquearlo tras el banner de cookies, lo que rompe el formulario para quien rechace.

Alternativa propuesta: honeypot + comprobación de tiempo + rate limiting para empezar, y **Altcha** autoalojado o **Friendly Captcha** (proveedor europeo) si aparece spam real. *→ Ver [6.8](#612-captcha-recaptcha-contradice-el-argumento-de-soberanía).*

### A.4 Lo que el consejo no cubre y sí importa

| Hueco | Por qué importa |
|---|---|
| **Existe Lead Capture nativo** (`POST /api/v1/LeadCapture/{apiKey}`) y su clave **sí es pública por diseño** | Hay dos tipos de clave en EspoCRM con reglas opuestas. Sin saberlo, alguien puede leer la documentación de Lead Capture y concluir que exponer claves es aceptable en general. No lo es. Ver [6.3](#63-el-proxy-firmado-de-netlify) |
| **Su CORS viene por defecto en `*`** (`leadCaptureAllowOrigin`) | Si algún día se usa esa vía, hay que restringirlo al dominio propio. Tal cual, cualquiera puede inyectar leads salvo el captcha |
| **Qué pasa si EspoCRM está caído** | Sin respaldo local y correo de aviso, se pierden contactos comerciales en silencio. Es un fallo de negocio, no técnico. Ver [6.6](#610-bandeja-de-salida-submission--delivery_job) |
| **Duplicados** | Reenviar el formulario crea varios Leads del mismo contacto si no se activa la comprobación de duplicados |
| **La newsletter no es un lead** | Distinta finalidad y distinta base jurídica. Mezclarla con los leads comerciales es justo lo que la AEPD revisa. Ver [6.0](#60-inventario-de-formularios) |
| **RAT, retención y revisión de la política de privacidad** | Con EspoCRM autoalojado, ISN Labs es responsable del tratamiento. Tres deberes que no se resuelven con código. Ver [6.10](#614-base-jurídica-y-deberes-de-rgpd) |
| **El fichero de respaldo de leads contiene datos personales** | Entra en la política de retención y en las copias cifradas |

### A.5 Fuentes consultadas

- [EspoCRM · REST API](https://docs.espocrm.com/development/api/) — métodos de autenticación, formato de la URL base y creación de registros.
- [EspoCRM · Web-to-Lead](https://docs.espocrm.com/administration/web-to-lead/) — endpoint de Lead Capture, naturaleza pública de su API key, opt-in, captcha y CORS.
- [EspoCRM · definición de la entidad Lead](https://github.com/espocrm/espocrm/blob/master/application/Espo/Modules/Crm/Resources/metadata/entityDefs/Lead.json) — nombres de campo y opciones de los enums `source` y `status`.
- [EspoCRM · Entity Manager](https://docs.espocrm.com/administration/entity-manager/) — creación de campos personalizados.

---

## Anexo B · Trazabilidad de la revisión técnica

Una revisión técnica externa del plan (27/07/2026) planteó siete bloqueantes y una lista de mejoras. Este anexo registra qué se aplicó, qué se corrigió y qué se matizó, para que la revisión quede auditable y no se pierda en un correo.

### B.1 Bloqueantes: todos aplicados

| ID | Cambio realizado |
|---|---|
| **B01** | El motor de cálculo pasa de `src/lib/pbcg/` a `src/server/pbcg/` con `import 'server-only'`. El cliente envía parámetros y recibe solo el resultado visible; el servidor recalcula siempre e ignora cualquier importe que llegue del navegador. Añadido test automatizado de no-filtración y comprobaciones de bundle en la verificación |
| **B02** | El navegador recibe un `submissionToken` firmado y caducable en lugar del `espoId`. La relación `submissionId → espoLeadId` vive solo en el servidor. Corregido el permiso del usuario de API: crear **y editar los Leads propios**, porque un `PUT` requiere edición |
| **B03** | JSONL sustituido por bandeja de salida en SQLite (WAL), con clave de idempotencia, estados, reintentos con retroceso exponencial y `delete_after` para la retención. Retirada la afirmación de que el correo es una copia de seguridad |
| **B04** | La casilla obligatoria pasa de «acepto la política de privacidad» a «he leído la información básica sobre protección de datos». Campos del CRM renombrados a `privacyNotice*` / `marketing*`. La base jurídica deja de presuponerse como consentimiento y pasa a pendiente P22. La IP deja de presentarse como obligatoria |
| **B05** | `middleware.ts` → `src/proxy.ts`; eliminado `--no-turbopack`; `params` documentado como promesa; `export const metadata` → `generateMetadata`; añadidos `generateStaticParams` y `dynamicParams = false`; 404 completada con `[...rest]`; script de lint por CLI de ESLint, porque `next lint` se eliminó en Next 16; fijadas versiones y Node ≥ 20.9 |
| **B06** | La incoherencia CPD ↔ servidores deja de normalizarse en silencio y pasa a **error bloqueante**: no se genera presupuesto. Añadido el caso de prueba de «híbrido → propio conservando valores» |
| **B07** | Añadidas la Fase 10 (seguridad HTTP y endurecimiento de endpoints), la Fase 11 (despliegue, observabilidad, alertas, SPF/DKIM/DMARC y recuperación) y la Fase 12 (CI y batería E2E con Playwright) |

### B.2 Mejoras aplicadas

| Ámbito | Cambio |
|---|---|
| PBCG | Factores de horquilla leídos de la configuración en lugar de `0.95`/`1.15` literales |
| PBCG | Bloques de auditoría con claves `S`/`M`/`L` y nombre de prueba, en lugar de arrays posicionales |
| PBCG | Importes en céntimos con función de redondeo explícita |
| PBCG | Batería de tests ampliada: fronteras, 9 combinaciones módulo × tamaño, extremos, rechazos e invariantes de horquilla y monotonía |
| PBCG | Campo de renting redefinido y retirado de la calculadora pública hasta decidirlo (P21) |
| i18n | Script de paridad reescrito para recorrer el interior de los arrays, no solo su longitud |
| i18n | Tipado de mensajes de `next-intl` y validación `zod` en lugar de `as Array<…>` |
| i18n | Breadcrumbs como array de objetos con `href`, en lugar de partir una frase por `/` |
| i18n | `localeDetection: false` y `localeCookie: false`, para que ES esté siempre en `/` y no se cree una cookie de idioma |
| Diseño | Variables de `next/font` separadas del token de Tailwind, con `@theme inline` |
| Formularios | Nombre y apellidos en dos campos, en lugar de partir la cadena por el primer espacio |
| SEO | Añadidas redirecciones desde la web anterior, canonical autorreferencial por idioma, recursos de marca y Open Graph, fuente única de datos de empresa y plan de medición de conversiones |
| Blog | Se deja de publicar contenido ficticio: «Próximamente», `noindex` o ruta desactivada. Ningún enlace usa `/contacto` como sustituto de una página inexistente |
| CMP | Dos escenarios según la analítica elegida, con P12 como bloqueante. Atributos de cookie y requisitos de la AEPD explicitados |
| Accesibilidad | Radios nativos en lugar de `role="radiogroup"`; enlace de salto; gestión de foco de menú y modal; `Escape`; `aria-modal`; resumen de errores con foco; pruebas con NVDA/VoiceOver |
| Seguridad | Cabeceras HTTP, límites de cuerpo, validación de `Origin`, timeouts, `Retry-After`, `requestId`, prohibición de PII en logs, `X-Forwarded-For` y rate limiting también en el proxy inverso |

### B.3 Un error propio corregido

La primera versión de este documento afirmaba que el prefijo `c` de los campos personalizados de EspoCRM «es solo una convención; EspoCRM no lo añade solo». **Es incorrecto.** La documentación oficial indica que el sistema añade el prefijo `c` al crear entidades, campos y relaciones desde Entity Manager, y que solo se desactiva con el parámetro `customPrefixDisabled`.

La corrección está en [6.7](#611-mapeo-a-la-entidad-lead-de-espocrm), junto con el procedimiento que evita el problema de raíz: leer los nombres reales de `GET /api/v1/Metadata` y fijarlos en un contrato de integración versionado, en lugar de deducirlos.

### B.4 Matizaciones

Dos puntos de la revisión se aplican con una precisión añadida:

1. **`dynamicParams = false`** se recoge como recomendación de endurecimiento. Es una API de Next.js, no una recomendación de `next-intl`: su documentación no la menciona.
2. **El doble opt-in de la newsletter** se implementa por ser una buena medida probatoria y antiabuso, y el documento **no** lo presenta como obligación legal universal. Lo que sí es exigible es el consentimiento separado, opcional, sin premarcar y revocable, con mecanismo de baja.

### B.5 Estado tras la primera revisión

Los siete bloqueantes quedaron resueltos en el texto. Lo que faltaba eran decisiones de negocio, no de desarrollo.

### B.6 Fuentes verificadas para la primera revisión

Las afirmaciones sobre versiones y APIs se comprobaron contra la documentación oficial antes de aplicarlas:

- [Next.js · Renaming Middleware to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy) — confirma la deprecación de `middleware` y el codemod.
- [Next.js · ESLint](https://nextjs.org/docs/app/api-reference/config/eslint) — confirma que `next lint` se eliminó en la versión 16.
- [next-intl · Routing setup](https://next-intl.dev/docs/routing/setup) — confirma `src/proxy.ts`, `generateStaticParams`, `setRequestLocale` y el paso explícito del `locale` en `generateMetadata`.
- [EspoCRM · Entity Manager](https://docs.espocrm.com/administration/entity-manager/) — confirma el prefijo `c` automático y el parámetro `customPrefixDisabled`.
- [AEPD · FAQ-0248, sobre si el usuario tiene que dar consentimiento a la cláusula de privacidad](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/6-el-deber-de-informacion/FAQ-0248-sobre-si-el-usuario-tiene-que-dar-consentimiento-a-clausula-de-privacidad) — confirma la distinción entre informar y consentir, y el valor de la casilla como acreditación de la información facilitada.

### B.7 Segunda revisión técnica (B08–B10)

Una segunda revisión, tras aplicar la primera, encontró dos fallos nuevos **introducidos por las propias correcciones** y uno que había quedado a medias.

#### Bloqueantes

| ID | Cambio realizado |
|---|---|
| **B08** | La bandeja de salida se divide en **`submission` + `delivery_job`**. Un solo `status` por envío no podía representar «CRM sincronizado, correo fallido» ni permitir reintentar un único destino. Añadidos: reclamo atómico de trabajos, recuperación de trabajos zombi por `locked_at`, persistencia inmediata del `espo_lead_id`, códigos de error sanitizados, migraciones versionadas, los tres `PRAGMA` obligatorios y el aviso de que **copiar el `.db` en caliente con WAL produce una base corrupta**. Renombrada a `submission_outbox`, porque la newsletter no es un Lead |
| **B09** | Las recotizaciones se separan en **tres endpoints**. La corrección anterior introdujo el recálculo en servidor con *debounce* de 400 ms, pero apuntando al endpoint que persiste y sincroniza con el CRM: arrastrar un campo habría generado decenas de actualizaciones del Lead y de trabajos en cola. Ahora `recalcular` no toca el CRM ni envía correo, `propuesta` congela un `quote_snapshot`, y hay límites distintos por endpoint. Añadido el descarte de respuestas fuera de orden con `AbortController` + contador secuencial |
| **B10** | El modelo de permisos pasa de `own` a **equipo `Web Leads`**. Asignar el Lead a un comercial puede hacer que el usuario de API pierda el permiso de edición «own», y la propuesta detallada fallaría solo con un cliente real. Y se define la **estrategia ante `409` de duplicado** (P25): dejarlo como error genérico rompía el flujo, porque sin `espo_lead_id` no hay Lead que actualizar |

#### Decisiones que estaban implícitas o incompatibles

| Ámbito | Resolución |
|---|---|
| **CSP** | Se elige una estrategia: **A ahora, B como objetivo** (P26). Nonces y SSG son excluyentes, y la vía por hashes es experimental: pedir a la vez estático, Turbopack y CSP sin `unsafe-inline` no era una solución cerrada |
| **HSTS** | Escalonado en cinco pasos. `max-age=63072000; includeSubDomains; preload` desde el primer día podía tumbar subdominios sin HTTPS, y el `preload` no se revierte rápido |
| **`standalone`** | Corregido: `server.js` **no** copia `public` ni `.next/static`, y sustituye a `next start`. Añadidos `sharp`, `runtime = 'nodejs'`, compilación de `better-sqlite3` para la arquitectura de destino y permisos del volumen |

#### Ajustes del modelo PBCG

| Cambio | Motivo |
|---|---|
| **Campo de renting eliminado** de `CalcInput`, la fórmula, el resultado y el desglose | Quedaba «a cero» pero seguía presente en cinco sitios. **Consecuencia: P21 deja de bloquear** |
| **`InternalCalculationResult` frente a `PublicQuoteDto`** | El caso de oro comprueba horas técnicas y el total exacto de 840 €, que no existían en el tipo devuelto. Ahora el test usa el interno y la API devuelve solo el público |
| **`PBCG_MODEL_VERSION`** | Para poder saber con qué tarifas se calculó una oferta antigua. Con las tarifas marcadas como pendientes de confirmar, va a hacer falta |
| **Orden exacto de redondeo** | `62 ÷ 12 × 65` es periódico. Se replica el Excel: **sin redondeos intermedios**, un único `MROUND` al final. Y se contrasta en los nueve casos de módulo × tamaño, no solo en el de oro |

#### Contradicciones residuales barridas

- **Privacidad**: la puerta de la calculadora y el diagrama del proxy seguían hablando de «consentimiento RGPD obligatorio» y «registra consentimiento». Corregido también el Anexo A.
- **Breadcrumbs**: la tabla de componentes seguía diciendo que se parte el texto por `/`.
- **GRC**: las cuatro tarjetas de marco enlazaban a `/contacto`; ahora se renderizan sin enlace, igual que P10.
- **Rutas**: «siempre 15 rutas» era incompatible con un blog condicional. Fuente única en `routes.ts`, que consumen navegación, pie, sitemap, metadatos y E2E.
- **CMP**: la tabla de decisiones lo daba por hecho y el pie mostraba siempre «Configurar cookies», mientras la Fase 8 admitía que puede no hacer falta. Ahora es condicional. P12 ya no afirma que Plausible/Matomo sea «sin cookies».
- **Verificaciones**: `grep -rn "@/server/" src/app/` daba falso positivo garantizado, porque los Route Handlers **deben** importar del servidor. Sustituido por una comprobación limitada a ficheros `'use client'` y, mejor, por una regla ESLint. Los `grep` de secretos pasan a `grep -F` y se saltan si el valor está vacío. Añadido `Cache-Control: no-store`.

#### Fuentes verificadas para esta segunda revisión

- [Next.js · Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy) — confirma que los nonces exigen renderizado dinámico y desactivan la optimización estática, y que el SRI por hashes es experimental y solo App Router.
- [Next.js · `output`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) — confirma que el `server.js` de `standalone` no copia `public` ni `.next/static`, y da el comando exacto de copia y arranque.

> **Una matización a la revisión recibida:** afirmaba que el SRI experimental está «ligado a Webpack, no a Turbopack». La documentación de Next no dice eso — lo describe como experimental y solo para App Router, sin restringirlo a un empaquetador. El plan recoge la limitación real (experimental, App Router, solo scripts de build) sin añadir una que no está documentada. Aun así, la conclusión de la revisión se mantiene: hay que elegir una estrategia y no dejar las tres implícitas.

### B.8 Estado resultante

**Aprobado para implementación por fases.** Las fases 0 a 5 —infraestructura, diseño, i18n, páginas estáticas y motor PBCG— no dependen de ningún pendiente y pueden empezar de inmediato.

Quedan condicionadas: la **integración real con EspoCRM** (P14, P15, P25), el **CMP** (P12), el **SEO y las redirecciones** (P4, P23, P24) y la **puesta en producción** (P26, P27). Y la **base jurídica** (P22) antes de publicar cualquier formulario.

Detalle en [readiness por fase](#33-readiness-por-fase).

---

---

## Anexo C · Migración a arquitectura estática

Aplicación de **ISNLA-DOC-0008-MIG-01**. Este anexo registra qué cambió, qué se verificó y qué se corrigió del documento de migración.

### C.1 El cambio de fondo

| Antes (rev. 01-c) | Ahora (rev. 01-d) |
|---|---|
| Next con proceso Node en producción (`output: 'standalone'`) | **`output: 'export'`**, artefacto estático en Netlify. **Sin runtime** |
| Route Handlers en el sitio | **Web Gateway** independiente, en otro repositorio y otra máquina |
| Motor PBCG en `site/src/server/pbcg` con `server-only` | Motor PBCG en `gateway/src/domain/pbcg`. **No está en el repositorio que Netlify compila** |
| `better-sqlite3`, `nodemailer` y secretos en el sitio | Todo en el gateway. **El sitio no tiene ni un secreto** |
| Español en `/`, inglés en `/en`, slugs solo en español | **`/es/` y `/en/` con slugs traducidos** y manifiesto central |
| `src/proxy.ts` para la i18n | No existe: `proxy` no es compatible con `export`. La redirección la hace Netlify |
| Cabeceras y redirects en `next.config` | En `netlify.toml`: `headers`, `redirects` y `rewrites` **no son compatibles con `export`** |
| npm con `package-lock.json` | **pnpm 10.34.5** con `minimumReleaseAge` |
| CSP pendiente de decidir (P26) | **Cerrado**: sin runtime no hay conflicto entre nonces y estático |
| Mobile-first como nota al final | Fase propia con matriz de anchuras ([1.6](#16-mobile-first)) |

### C.2 Qué mejora, en concreto

**B01 queda resuelto por construcción.** La versión anterior dependía de que nadie borrara un `import 'server-only'`. Ahora el modelo de precios **no está en el repositorio**, así que no puede filtrarse ni por descuido ni por un import mal puesto. Es la diferencia entre una convención y una imposibilidad.

**Desaparece toda la superficie de ataque de un servidor.** No es teórico: **CVE-2025-55182 (CVSS 10.0)** permite ejecución remota de código sin autenticación contra los endpoints de Server Functions de React, en `react-server-dom-*` 19.0–19.2.0 (corregido en 19.0.1, 19.1.2 y 19.2.1). El aviso de React es explícito en que **una aplicación sin servidor no está afectada**. Con `output: 'export'` no hay endpoint de Server Functions que atacar.

**P26 (CSP) se cierra.** El conflicto era estructural: los nonces exigen renderizado dinámico. Sin runtime, la CSP es una cabecera estática y ya está.

**Y desaparecen varias fuentes de error operativo**: la copia manual de `public` y `.next/static` del despliegue `standalone`, la compilación de `better-sqlite3` para la arquitectura correcta *en el servidor web*, el volumen persistente del sitio, y el rate limiting en memoria como única barrera.

### C.3 Verificado contra documentación oficial

| Afirmación | Estado |
|---|---|
| `signed = "VAR"` en `netlify.toml`, cabecera **`x-nf-sign`**, JWS **HMAC HS256** | ✅ Verificado |
| Claims `iss: "netlify"`, `exp`, `netlify_id`, `site_url`, `deploy_context` | ✅ Verificado, exactamente esos cinco |
| La variable de entorno **debe tener scope `Runtime`** | ✅ Verificado |
| `output: 'export'` **no soporta** `redirects`, `headers`, `rewrites`, `proxy`, `cookies()`, Server Actions, ISR, Draft Mode, rutas dinámicas con `dynamicParams: true` | ✅ Verificado |
| Los Server Components **se ejecutan en build** y generan HTML más payload estático | ✅ Verificado |
| CVE-2025-55182 no afecta a aplicaciones sin servidor | ✅ Verificado en el propio aviso |
| Los nonces de CSP exigen renderizado dinámico | ✅ Verificado |

### C.4 Dos errores del documento de migración, corregidos

**1 · `allowBuilds` no existe en pnpm 10.** El documento fijaba pnpm **10.34.5** y a la vez usaba `allowBuilds`, que es un mapa introducido en **pnpm 11** como sustituto de `onlyBuiltDependencies`. Con la versión 10 fijada, `allowBuilds` **se ignora en silencio** y se pierde justo el control que se pretendía tener sobre los scripts de instalación. Se usa `onlyBuiltDependencies` (lista). Corregido en la [Fase 0](#fase-0--preparación).

Y por la misma razón, los demás ajustes de endurecimiento que proponía —`strictDepBuilds`, `blockExoticSubdeps`, `trustPolicy`— **hay que verificarlos uno por uno contra la versión instalada**: un ajuste que no existe no da error, simplemente no protege.

**2 · El `window_size` de Netlify no admite 600 segundos.** El documento definía ventanas de 600 s para expresar «5 por 10 minutos». **El rango válido es 60–180 s.** Los límites de negocio de 10 minutos se implementan en el gateway, y Netlify hace la protección gruesa con ventanas de 180 s. Corregido en [6.3](#63-el-proxy-firmado-de-netlify).

Se añade además un límite que el documento no mencionaba: Netlify permite **2–5 reglas de rate limiting por proyecto** según el plan (100 solo en Enterprise), así que una regla por endpoint agota el cupo. Hay que comprobar el plan contratado antes de escribir el fichero.

### C.5 Matizaciones

**Los Route Handlers sí funcionan con `output: 'export'`** — solo `GET` y resolviéndose a un fichero estático en build. El documento los prohibía como si fuera una imposición técnica. Se mantiene la prohibición, pero **como decisión de endurecimiento**, y así queda escrito: evita que alguien empiece con un `GET` inocente y acabe necesitando leer la petición. Un junior que lea «no se puede» y luego compruebe que sí se puede, dejará de confiar en el resto del documento.

**`server-only` no es peligroso.** El documento lo incluía en la lista de prohibiciones sin explicar por qué, y su función es precisamente evitar filtraciones. Se prohíbe porque en esta arquitectura **no hay código de servidor en el sitio**, así que su presencia significa que alguien lo ha reintroducido. Es un detector, no una amenaza.

**Sobre el aviso de React Server Components:** el documento hacía bien en corregir la idea de que un Server Component sea inseguro por sí mismo. Lo peligroso es el runtime que atiende peticiones. Por eso la regla es *«mínimo de Client Components y ningún runtime»*, no *«pocos Server Components»* — y eso además es lo que reduce el JavaScript enviado al navegador.

### C.6 Lo que la migración **no** cambia

Se conservan íntegros: el sistema de diseño y sus tokens, el copy de los dos JSON del brief, el modelo económico PBCG con su caso de oro de 840 €, las páginas legales propias, la separación entre información de privacidad y consentimiento de marketing, el modelo de permisos por equipo de EspoCRM, la estrategia ante duplicados, la bandeja de salida con `submission` + `delivery_job`, el descarte de reCAPTCHA y todas las reglas de accesibilidad.

**Y no resuelve ninguna decisión de negocio.** Siguen pendientes: dominio y correo finales, precios de licencia, base jurídica, retención, analítica, newsletter, blog, teléfono 24/7, landings futuras, uso de logos y asignación comercial.

### C.7 Pendientes técnicos que la migración cierra

- Cómo publicar una ruta hacia EspoCRM sin exponerlo → proxy firmado + gateway.
- Cómo mantener la web realmente estática → `output: 'export'` con dos scripts que lo verifican en CI.
- Cómo usar Server Components sin runtime → se ejecutan en build.
- Cómo estructurar `/es` y `/en` con slugs traducidos → manifiesto central.
- Cómo resolver la CSP sin renunciar al estático → **P26 cerrado**.
- Cómo imponer una espera de 24 h en las dependencias → tres controles complementarios.

### C.8 Fuentes verificadas

- [Netlify · Rewrites and proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/) — proxy firmado, `x-nf-sign`, claims del JWS y scope `Runtime`.
- [Netlify · Rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/) — sintaxis, rango de `window_size` y número de reglas por plan.
- [Next.js · Static exports](https://nextjs.org/docs/app/guides/static-exports) — funciones soportadas y no soportadas.
- [Next.js · Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy) — los nonces exigen renderizado dinámico.
- [React · Critical security vulnerability in React Server Components](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) — CVE-2025-55182 y el alcance real.
- [pnpm · Settings](https://pnpm.io/settings) y [pnpm 11 release notes](https://pnpm.io/blog/releases/11.0) — `onlyBuiltDependencies` frente a `allowBuilds`.
- [GitHub · Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) — `cooldown` y que no aplica a actualizaciones de seguridad.

---

*Documento de trabajo interno de ISN Labs. Elaborado a partir de ISNLA-DOC-0001, 0004, 0006 y 0007, de la indicación de dirección de 27/07/2026 y de las dos revisiones técnicas de la misma fecha.*
