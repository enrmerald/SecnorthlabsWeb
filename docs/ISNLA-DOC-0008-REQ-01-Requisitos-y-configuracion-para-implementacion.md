# ISNLA-DOC-0008-REQ-01 · Requisitos y guía de configuración para continuar la implementación

| Campo | Valor |
|---|---|
| Documento | ISNLA-DOC-0008-REQ-01 |
| Título | Requisitos y guía de configuración para continuar la implementación de la web ISN Labs |
| Versión | 01 |
| Fecha | 28/07/2026 |
| Estado | Pendiente de que Dirección y Sistemas aporten los valores |
| Documentos de entrada | ISNLA-DOC-0008-01 (plan) · ISNLA-DOC-0008-MIG-02 (correo cifrado e importador local) · Decisiones de Dirección de 28/07/2026 |
| Audiencia | Dirección, sistemas, cumplimiento y desarrollo |
| Para qué sirve | Reunir en un sitio **todo lo que hace falta conseguir o configurar** para que la implementación pueda continuar, con instrucciones paso a paso |

---

## 0 · Decisiones de Dirección del 28/07/2026 que este documento incorpora

| # | Decisión | Consecuencia |
|---|---|---|
| D1 | **La calculadora devuelve el precio al momento** | Se adopta la variante híbrida de MIG-02 §0.4. El motor PBCG se ejecuta en una Netlify Function |
| D2 | **El presupuesto se envía además por correo** al interesado | Segundo correo, con el mismo resultado que se mostró en pantalla |
| D3 | **La lógica del mailer vive dentro de `site/`** | Un solo repositorio y una sola carpeta. Se cancelan `isnlabs-web-mailer` e `isnlabs-local-ingest` como repositorios de este proyecto |
| D4 | **Monorepo con una sola carpeta: `site/`** | `gateway/` desaparece; el motor pasa a `site/pbcg/` |
| D5 | **Se retira la newsletter** | Se elimina el formulario, sus claves de mensajes y su endpoint. El pendiente P11 queda cerrado como «no aplica» |
| D6 | **El blog tendrá artículos reales, migrados de un blog existente, e indexados** | `/blog` pasa de «próximamente» a listado real con páginas de detalle. Cierra el pendiente P8 |
| D7 | **El dominio es `secnorthlabs.eu`** | Cierra el pendiente P4. No hay cambio de dominio con el cambio de marca |
| D8 | **EspoCRM no se expone.** Un servicio Docker local lee un buzón e inserta los Leads | Se mantiene de MIG-02. Ese servicio **es externo a este repositorio** |

### 0.1 Lo que D1 y D3 cuestan, por escrito

Se documenta aquí para que la decisión quede trazada y nadie la descubra dentro de seis meses.

**Lo que NO empeora:**

- Las tarifas y coeficientes **no viajan al navegador**. El código de una Netlify Function se ejecuta en servidor; el visitante nunca lo descarga. El bloqueante B01 original -«el modelo publicado en el JavaScript del cliente»- sigue cerrado.
- El aviso del CVE-2025-55182 de React no aplica: una Netlify Function es un handler aislado, no un runtime de Next ni de React atendiendo Server Functions.
- El sitio sigue exportándose por completo. Las páginas continúan siendo HTML estático generado en build; la función es una pieza aparte que Netlify despliega desde `netlify/functions/`, no algo que compile Next.

**Lo que sí empeora, y cómo se mitiga:**

| Coste | Mitigación implementada |
|---|---|
| El modelo económico vive en el repositorio que Netlify clona | Guardián nuevo en CI: **ningún fichero bajo `src/` puede importar de `pbcg/`**. Si alguien lo intenta, el build falla. Es lo que sustituye a «el motor está en otro repositorio» |
| El artefacto público podría acabar conteniendo una tarifa | `verify:export` sigue inspeccionando `out/` en cada build buscando tarifas, coeficientes y nombres de cliente. Ya está implementado y en verde |
| El sitio ya no es un export estático puro | `verify:architecture` deja de prohibir `netlify/functions/` **de forma explícita y acotada a una única función**. Sigue prohibiendo `'use server'`, `app/api/`, `route.ts`, `middleware.ts` y `cookies()`, que son lo que convertiría el sitio en híbrido de verdad |
| Netlify pasa a alojar el modelo como código | Es una decisión de negocio, no técnica. Netlify no es encargado de tratamiento por esto (no son datos personales), pero conviene que Dirección lo sepa |

---

## 1 · Arquitectura resultante

```text
site/
├── src/                      Next.js 16, output: 'export'  →  out/
│                             NO puede importar de pbcg/ ni de netlify/
├── netlify/
│   └── functions/
│       └── ingest.ts         ← ÚNICA función. Valida, calcula, cifra, envía
├── pbcg/                     ← motor + 59 tests (movido de gateway/)
│   ├── src/domain/pbcg/
│   └── bin/calculate.mjs     CLI, para que el agente local use el MISMO motor
├── contracts/                esquema de ingestión, mapeo de enums, vectores de oro
├── messages/                 es.json · en.json
├── content/blog/             artículos migrados (Markdown)
├── emails/                   plantillas HTML
├── e2e/
└── netlify.toml
```

### 1.1 Flujo de la calculadora

```text
[Visitante]
   │ parámetros técnicos + datos de contacto
   │ POST /api/quote          (mismo origen, sin CORS)
   ▼
[Netlify Function · ingest.ts]
   │
   ├─ 1. verifica la firma del proxy de Netlify (x-nf-sign)
   ├─ 2. valida el payload con zod .strict()
   ├─ 3. antispam: honeypot + tiempo mínimo + rate limiting
   ├─ 4. CALCULA el PBCG                     ← el modelo vive aquí
   ├─ 5. firma (JWS Ed25519) y cifra (JWE RSA-OAEP-256 + A256GCM)
   ├─ 6. Resend → buzón de ingestión         ← BLOQUEANTE: si falla, 503
   ├─ 7. Resend → correo al interesado       ← mejor esfuerzo: si falla, 200
   └─ 8. responde con el PublicQuoteDto      ← precio en pantalla
         │
         ▼
[leads-ingest@secnorthlabs.eu]
         ▲
         │ Microsoft Graph o IMAP+OAuth, solo salida
[Servicio Docker local - REPOSITORIO EXTERNO]
         ├─ verifica firma y descifra
         ├─ deduplica por submissionId
         └─ POST http://espocrm/api/v1/Lead
```

**Por qué el paso 6 bloquea y el 7 no.** Si el correo de ingestión falla, el lead se pierde y no se puede decir al visitante que lo hemos recibido: se responde `503`. Si falla el correo al interesado, el lead **ya está a salvo** en el buzón y el presupuesto ya está en pantalla, así que se responde `200` y se registra el fallo; el agente local puede reenviarlo porque el resultado viaja dentro del sobre cifrado.

### 1.2 Flujo del formulario de contacto

Idéntico, pero sin los pasos 4 y 7: valida, cifra, envía al buzón de ingestión y responde.

---

## 2 · Resumen de lo que necesito

Ordenado por lo que bloquea. **B = bloquea escribir código. C = bloquea publicar.**

| # | Qué | Quién | Bloquea |
|---|---|---|---|
| 1 | Cuenta de Resend y dominio `notify.secnorthlabs.eu` verificado | Sistemas | **B** |
| 2 | Dos API keys de Resend (`sending_access`), producción y staging | Sistemas | **B** |
| 3 | Buzón `leads-ingest@secnorthlabs.eu` con sus carpetas | Sistemas | **B** |
| 4 | Cuatro pares de claves criptográficas (prod y staging) | Sistemas | **B** |
| 5 | Site ID de Netlify y secreto del proxy firmado | Sistemas | **B** |
| 6 | Plan de Netlify contratado | Dirección | **B** |
| 7 | Export del blog actual: artículos, formato e idiomas | Marketing | **B** |
| 8 | Texto que se muestra al usuario tras enviar | Dirección | **B** - propuesta más abajo |
| 9 | Decisión pnpm 10 o 11 | Desarrollo | **B** |
| 10 | Elección de analítica | Dirección | **B** para la Fase 8 |
| 11 | Confirmar precios de licencia EDR y MDR | Dirección | **C** - afectan al precio publicado |
| 12 | Retención de las carpetas del buzón | Cumplimiento | **C** |
| 13 | DPA de Resend aceptado y política de privacidad actualizada | Cumplimiento | **C** |
| 14 | Export de URLs indexadas de Search Console | Marketing | **C** |
| 15 | Teléfono de incidentes 24/7: existe o no | Dirección | **C** |
| 16 | LinkedIn de empresa | Marketing | - |
| 17 | Logos oficiales de Microsoft, Huntress, OPNsense, Fortinet, Ewala | Marketing | - |
| 18 | EspoCRM: equipo, usuario de API, campos y su Metadata | Sistemas | Bloquea el **servicio externo**, no a mí |

---

## 3 · Bloque A · Resend

### A.1 Crear el dominio de envío

Se usa un **subdominio** y no el dominio raíz, para aislar la reputación de envío: si algún día un envío masivo perjudica la reputación de `notify.secnorthlabs.eu`, el correo corporativo de `@secnorthlabs.eu` no se ve afectado.

1. Entra en `https://resend.com` → **Domains** → **Add Domain**.
2. Dominio: `notify.secnorthlabs.eu`
3. Región: **EU (Ireland)**. Es importante: reduce la exposición en transferencias internacionales y es coherente con el argumento de soberanía del dato que vende la casa.
4. Resend mostrará una lista de registros DNS. **Cópialos literalmente**, no los transcribas de memoria ni los adaptes.

### A.2 Registros DNS que hay que crear

En el proveedor de DNS de `secnorthlabs.eu`:

| Tipo | Nombre | Valor | De dónde sale |
|---|---|---|---|
| TXT | `notify` (o `send.notify`) | El SPF que indique Resend | Panel de Resend |
| TXT o CNAME | `resend._domainkey.notify` | La clave DKIM que indique Resend | Panel de Resend |
| MX | `send.notify` | El que indique Resend, si lo pide | Panel de Resend |
| TXT | `_dmarc.notify` | Ver abajo | **Lo añades tú, Resend no lo pone** |

**DMARC.** Resend no lo configura. Empieza permisivo y endurece después de comprobar los informes:

```text
v=DMARC1; p=none; rua=mailto:dmarc@secnorthlabs.eu; fo=1
```

Progresión, cada paso tras unos días revisando los informes agregados:

```text
p=none   →   p=quarantine   →   p=reject
```

> ⚠️ **No pongas `p=reject` el primer día.** Si algún registro está mal, el correo se descarta en silencio y el efecto práctico es idéntico a que el formulario no funcione. Y el fallo no se ve: no rebota, desaparece.

### A.3 Verificación

En el panel de Resend, **Verify DNS Records**. La propagación puede tardar de minutos a horas. No sigas hasta que los tres pilares -SPF, DKIM y el dominio- estén en verde.

### A.4 Crear las API keys

Dos claves, **nunca una compartida**:

| Nombre | Permiso | Dominio | Para |
|---|---|---|---|
| `ISN Labs Web Ingest Production` | **Sending access** | `notify.secnorthlabs.eu` | Producción |
| `ISN Labs Web Ingest Staging` | **Sending access** | `notify.secnorthlabs.eu` | Deploy previews |

> ⚠️ **No uses `Full access`.** Una clave `sending_access` robada solo puede enviar correo. Una `full_access` puede además leer los envíos, los contactos y borrar el dominio.

Si el servicio local acaba enviando también correos, necesitará **una tercera clave propia**: `ISN Labs Quote Sender Production`. No se reutiliza la del sitio.

### A.5 Qué me tienes que pasar

```text
RESEND_API_KEY_PRODUCTION   = re_...
RESEND_API_KEY_STAGING      = re_...
RESEND_FROM                 = ISN Labs Web <webforms@notify.secnorthlabs.eu>
```

Por canal seguro: gestor de contraseñas compartido o sobre cifrado. **Nunca por correo, chat ni ticket.**

---

## 4 · Bloque B · Buzón de ingestión

### B.1 Crear el buzón

Dirección: `leads-ingest@secnorthlabs.eu`

> ⚠️ **No reutilices `info@`, `ventas@`, `soporte@` ni un buzón que use una persona.** Este buzón lo lee un programa cada pocos minutos, mueve mensajes entre carpetas y los borra por retención. Compartirlo con una persona garantiza que antes o después alguien mueva o lea un mensaje y el importador se descoloque.

### B.2 Restricciones de configuración

- Sin auto-reenvío externo.
- Sin acceso desde móvil.
- **Sin POP3.**
- Sin reglas personales, salvo la del punto B.4.
- Sin respuestas automáticas.
- Sin acceso para usuarios normales.
- Bloqueo de inicio de sesión interactivo, si el proveedor lo permite.
- MFA obligatorio para los administradores.
- Auditoría activada.
- Retención definida (ver punto 8 de la lista de requisitos).

### B.3 Carpetas

Créalas dentro de la bandeja de entrada, con estos nombres exactos:

```text
Bandeja de entrada/
└── ISNLabs Ingest/
    ├── Pending
    ├── Processing
    ├── Processed
    ├── Retry
    ├── Rejected
    └── Quarantine
```

### B.4 Regla de correo

Mover a `Pending` si el asunto empieza por `[ISNLABS-INGEST-V1]` **y** el remitente es `webforms@notify.secnorthlabs.eu`.

> **Esta regla no es un control de seguridad.** Cualquiera puede escribir ese asunto. La autenticidad la determina la firma criptográfica que verifica el importador. La regla solo sirve para que el buzón esté ordenado.

### B.5 Acceso del programa - según el proveedor

**Si el buzón está en Microsoft 365** (recomendado), usa **Microsoft Graph**:

1. Portal de Entra → **App registrations** → **New registration**.
   - Nombre: `ISN Labs Local Lead Ingest`
   - Tipo: cuentas de este directorio únicamente.
2. **Certificates & secrets** → sube un **certificado**, no un secreto de cliente. Un certificado no se puede pegar por error en un chat y caduca de forma visible.
   ```bash
   openssl req -x509 -newkey rsa:4096 -sha256 -days 730 -nodes \
     -keyout ingest-graph.key -out ingest-graph.crt \
     -subj "/CN=isnlabs-local-lead-ingest"
   ```
   Sube el `.crt`. El `.key` se queda en el host local.
3. **API permissions** → Microsoft Graph → **Application permissions** → `Mail.ReadWrite`.
4. ⚠️ **Paso que no se puede omitir.** `Mail.ReadWrite` como permiso de aplicación da acceso a **todos los buzones del tenant**. Hay que acotarlo al buzón dedicado con **Exchange Online Application RBAC**:
   ```powershell
   New-ManagementScope -Name "ISNLabs-Ingest-Scope" `
     -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'leads-ingest@secnorthlabs.eu'"

   New-ServicePrincipal -AppId <APP_ID> -ObjectId <OBJECT_ID> `
     -DisplayName "ISN Labs Local Lead Ingest"

   New-ManagementRoleAssignment -App <SERVICE_PRINCIPAL_ID> `
     -Role "Application Mail.ReadWrite" -CustomResourceScope "ISNLabs-Ingest-Scope"
   ```
   Sin esto, una credencial filtrada del importador da acceso de lectura y escritura al correo de toda la empresa.

**Si el buzón no está en Microsoft 365**, IMAP sobre TLS con OAuth 2.0, puerto 993. **Nunca POP3, y nunca autenticación básica si el proveedor admite OAuth.**

### B.6 Qué me tienes que pasar

```text
LEAD_MAILBOX_TO         = leads-ingest@secnorthlabs.eu
MAIL_PROVIDER           = microsoft_graph | imap
```

Lo demás -tenant, client ID, huella del certificado, IDs de carpeta- lo necesita el **servicio local**, no yo.

---

## 5 · Bloque C · Claves criptográficas

Aunque Resend y el proveedor del buzón transporten el correo, **no deben poder leer los datos del formulario**. Un volcado de la base de correo no debe revelar ni un lead, y quien conozca la dirección del buzón no debe poder fabricar un lead válido.

Se usan dos pares por entorno: uno para **firmar** (autenticidad) y otro para **cifrar** (confidencialidad).

### C.1 Generación

Ejecuta esto **en el host local que vaya a correr el importador**, no en tu portátil ni en un servidor compartido:

```bash
mkdir -p claves/produccion claves/staging && cd claves/produccion

# ── Par de FIRMA (Ed25519) ────────────────────────────────────────────
# La privada la usa la Netlify Function para firmar.
# La pública la usa el importador para verificar.
openssl genpkey -algorithm ed25519 -out sig-priv.pem
openssl pkey -in sig-priv.pem -pubout -out sig-pub.pem

# ── Par de CIFRADO (RSA 4096, para RSA-OAEP-256) ──────────────────────
# La pública la usa la Netlify Function para cifrar.
# La privada la usa el importador para descifrar y NUNCA sale de aquí.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out enc-priv.pem
openssl pkey -in enc-priv.pem -pubout -out enc-pub.pem

chmod 600 *.pem
```

Repite lo mismo en `claves/staging`. **Claves distintas por entorno, sin excepción**: si una *deploy preview* pudiera firmar con la clave de producción, un enlace de prueba metería leads falsos en el CRM real.

### C.2 Reparto - la parte que importa

| Clave | Netlify | Host local |
|---|:---:|:---:|
| `sig-priv.pem` firma privada | ✅ | ❌ |
| `sig-pub.pem` firma pública | ❌ | ✅ |
| `enc-pub.pem` cifrado pública | ✅ | ❌ |
| `enc-priv.pem` **descifrado privada** | ❌ **NUNCA** | ✅ |

> ⚠️ **`enc-priv.pem` no se sube a Netlify, no se manda por correo, no entra en el repositorio y no me la pases a mí.** Es la única cosa que impide que un volcado del buzón revele los datos de los leads. Su copia de seguridad va cifrada, con dos custodios y acceso auditado.

### C.3 Identificadores de clave

Cada clave lleva un `kid` para poder rotar sin cortar el servicio. Usa este formato:

```text
sig-2026-q3
enc-2026-q3
```

Rotación normal: **cada 90 días**. Inmediata ante sospecha. Durante la ventana de tránsito el importador acepta la clave anterior **y** la nueva; después se retira la vieja.

### C.4 Cómo pasarme las que van a Netlify

Un PEM tiene saltos de línea y los paneles web los estropean. Codifícalo:

```bash
# Linux y Git Bash en Windows
base64 -w0 sig-priv.pem
base64 -w0 enc-pub.pem

# macOS
base64 -i sig-priv.pem
```

Me pasas la cadena resultante y el `kid`. La función la descodifica al arrancar.

---

## 6 · Bloque D · Netlify

### D.1 Datos del proyecto

En el panel de Netlify, **Site configuration → General**:

```text
Site ID          (un UUID, p. ej. 1be0f471-6532-45ff-b1b1-f9c66ea24dc1)
Site URL de producción   https://www.secnorthlabs.eu
```

El Site ID lo necesita la función para rechazar cualquier petición que no venga de este sitio.

### D.2 Secreto del proxy firmado

```bash
openssl rand -base64 48
```

Ese valor va en Netlify como `NETLIFY_PROXY_SIGNING_SECRET`.

> ⚠️ **Scope `Runtime`, no `Builds`.** Si el scope es incorrecto, Netlify **no aplica la firma** y no avisa: la función recibiría peticiones sin firmar y las rechazaría todas. El síntoma es «el formulario no funciona», sin ningún error útil.

### D.3 Variables de entorno

**Site configuration → Environment variables.** Todas con scope **Functions** salvo donde se indique.

| Variable | Scope | Valor |
|---|---|---|
| `RESEND_API_KEY` | Functions | La de A.4, distinta por contexto de deploy |
| `RESEND_FROM` | Functions | `ISN Labs Web <webforms@notify.secnorthlabs.eu>` |
| `LEAD_MAILBOX_TO` | Functions | `leads-ingest@secnorthlabs.eu` |
| `NETLIFY_PROXY_SIGNING_SECRET` | **Runtime** | El de D.2 |
| `ALLOWED_SOURCE_SITE_ID` | Functions | El Site ID de D.1 |
| `ALLOWED_SOURCE_SITE_URL` | Functions | `https://www.secnorthlabs.eu` |
| `MAIL_ENVIRONMENT` | Functions | `production` o `staging` |
| `LEAD_SIGNING_PRIVATE_KEY_B64` | Functions | Base64 de `sig-priv.pem` |
| `LEAD_SIGNING_KEY_ID` | Functions | `sig-2026-q3` |
| `LEAD_ENCRYPTION_PUBLIC_KEY_B64` | Functions | Base64 de `enc-pub.pem` |
| `LEAD_ENCRYPTION_KEY_ID` | Functions | `enc-2026-q3` |
| `PRIVACY_NOTICE_VERSION` | Functions | `2026-07-28` |
| `MARKETING_TEXT_VERSION` | Functions | `2026-07-28` |
| `SITE_URL` | Builds | `https://www.secnorthlabs.eu` |
| `INCIDENT_PHONE` | Builds | El teléfono 24/7, o **vacío** si no existe |

**Usa valores distintos por contexto de deploy.** Netlify permite fijar un valor para `production` y otro para `deploy-preview` y `branch-deploy`. Es lo que impide que una rama de prueba escriba en el buzón real.

### D.4 Plan contratado

Necesito saberlo porque **Netlify permite entre 2 y 5 reglas de rate limiting por proyecto** según el plan, y 100 solo en Enterprise. Con una regla por endpoint se llega al techo enseguida, así que la estrategia cambia según lo que tengáis.

También: la ventana de rate limiting de Netlify solo admite **entre 60 y 180 segundos**. Los límites de negocio más largos («5 cotizaciones por IP cada 10 minutos») los aplica la función, no el borde.

---

## 7 · Bloque E · Blog - lo que necesito para migrar

Es lo que más me falta y no puedo empezar sin ello.

### E.1 Preguntas concretas

| # | Pregunta | Por qué importa |
|---|---|---|
| 1 | **URL del blog actual** | Para ver la estructura real y hacer el mapa de redirecciones |
| 2 | **Plataforma** (WordPress, Ghost, Medium, Notion, otra) | Determina cómo se exporta |
| 3 | **Cuántos artículos** | 6 se migran a mano; 60 justifican un script |
| 4 | **¿Están en los dos idiomas?** | Si solo hay español, hay que decidir: `/en/blog/` vacío, o solo los artículos traducidos |
| 5 | **¿Tienen imágenes?** | Hay que procesarlas con el pipeline de build a AVIF y WebP |
| 6 | **¿Autor y fecha reales por artículo?** | Son obligatorios para el `BlogPosting` de datos estructurados |
| 7 | **URLs actuales de cada artículo** | Un artículo indexado que cambia de URL sin 301 pierde su posicionamiento |
| 8 | **Categorías reales** | El brief propone 8; necesito las que de verdad se usan |

### E.2 Cómo exportar

**WordPress:** Herramientas → Exportar → Todo el contenido. Genera un XML (WXR). Pásame el fichero.

**Ghost:** Ajustes → Labs → Exportar contenido. Genera un JSON.

**Medium:** Settings → Download your information. Llega un ZIP con HTML.

**Notion:** Exportar como Markdown y CSV, marcando «incluir subpáginas».

**Si no hay export automático:** pásame los artículos en Markdown, un fichero por artículo, con esta cabecera:

```markdown
---
title: "Qué exige NIS2 a una empresa mediana"
slug: nis2-empresa-mediana
date: 2026-03-14
category: NIS2
locale: es
author: Nombre del autor
excerpt: "Una o dos frases para la tarjeta del listado y la meta description."
originalUrl: https://blog-actual.example/nis2-empresa-mediana
---

Cuerpo del artículo en Markdown.
```

### E.3 Lo que implica

- Los artículos viven en `site/content/blog/` como Markdown. Encaja con la exportación estática: se compilan en build, sin CMS ni runtime.
- Rutas nuevas: `/es/blog/<slug>/` y `/en/blog/<slug>/`, generadas desde los ficheros. El manifiesto de rutas actual es fijo; hay que ampliarlo para admitir rutas derivadas de contenido.
- `BlogPosting` en cada detalle, con autor y fecha reales. **Nada de datos inventados en el marcado.**
- Filtros por categoría y artículo destacado, como el mockup `image8.png`.
- **Se elimina el bloque de newsletter** (D5).

---

## 8 · Bloque F · Texto que se muestra al usuario

Dijiste que no sabías qué poner. Con precio instantáneo el problema es más fácil, porque el resultado ya está en pantalla. Propongo esto y solo necesito un «vale» o tus correcciones.

### F.1 Calculadora, tras enviar

> ### Tu estimación
>
> **815 – 900 €/mes**
> Impuestos no incluidos
>
> Te la hemos enviado también a `ana@empresa.com` con el desglose.
>
> Referencia: `A7F3-2B91`
>
> Estimación orientativa, no vinculante. La cuota final depende del alcance validado en una sesión técnica gratuita de 30 minutos.

**Por qué así.** El importe primero, porque es lo que la persona ha venido a buscar. El correo como refuerzo, no como promesa de futuro. La referencia para que pueda citarla si escribe. Y el descargo obligatorio, sin letra pequeña ilegible.

**No se dice** «te llamaremos en 24 h» ni ningún plazo, hasta que se mida la operación real. Prometer un plazo que no se cumple hace más daño que no darlo.

### F.2 Formulario de contacto, tras enviar

> ### Gracias, lo hemos recibido
>
> Te respondemos en menos de 24 h laborables. Hablarás con un especialista, no con un comercial.
>
> Referencia: `A7F3-2B91`

Las 24 h laborables **sí** están en el copy aprobado del brief (`contact.form.responseNote`), así que se mantienen.

### F.3 Si falla el correo de ingestión

> ### No hemos podido registrar tu solicitud
>
> Ha fallado algo por nuestra parte, no por la tuya. Escríbenos a `info@secnorthlabs.eu` o llámanos al `+34 634 651 312` y lo resolvemos.

**Nunca se dice que se ha recibido algo que no se ha recibido.** Es la única forma honesta de tratar ese fallo.

---

## 9 · Bloque G · Plantillas de correo

Pides plantillas HTML con el estilo de la web. Son **tres**, y una de ellas a propósito no lleva estilo.

### G.1 Correo de ingestión - deliberadamente feo y sin datos

Este correo va al buzón que lee el programa. **No debe contener ningún dato personal legible**: ni nombre, ni empresa, ni correo, ni teléfono, ni precio, ni el asunto. Todo el contenido de negocio va cifrado en el adjunto.

```text
Asunto: [ISNLABS-INGEST-V1] quote_request 550e8400-e29b-41d4-a716-446655440000

Cuerpo:
Mensaje de integración automatizada de ISN Labs.
No responder.
El contenido de negocio está cifrado en el adjunto.
Schema: 1.0
Submission: 550e8400-...
Environment: production
```

> ⚠️ **Aquí no aplico el estilo de la web, y es intencionado.** Maquetarlo bonito no aporta nada -no lo lee una persona- y cada elemento que se añade es una oportunidad de colar un dato personal en un sistema de terceros donde no debe estar. Si algún día alguien quiere «ver los leads en el correo», la respuesta es que los vea en EspoCRM.

### G.2 Correo de presupuesto al interesado - sí con la marca

Aquí sí va la plantilla completa con el estilo ISN Labs. Contiene:

- Horquilla visible y tamaño estimado.
- Desglose: licencias, auditorías, total.
- Descargo de no vinculante.
- Exclusiones: impuestos, desplazamientos, remediación, pruebas extraordinarias, honorarios de la entidad certificadora ENS.
- Referencia y enlace a contacto.

**No contiene:** horas internas, tarifas, coeficientes, margen ni coste. Es la misma regla de la sección 5 del plan aplicada a la salida.

### G.3 Correo de confirmación de contacto

Acuse de recibo breve, con la marca, la referencia y las vías de contacto directo.

### G.4 Restricciones técnicas del HTML de correo

Esto lo escribo yo, pero conviene que sepas por qué no se parecerá exactamente a la web:

| Restricción | Motivo |
|---|---|
| Maquetación con `<table>`, no flexbox ni grid | Outlook usa el motor de Word para renderizar |
| CSS en línea, no clases ni variables | Muchos clientes eliminan el `<style>` |
| Sin Space Mono ni Noto Sans | Las fuentes web no cargan de forma fiable. Se usa una pila de respaldo con métricas parecidas |
| Ancho fijo de 600 px | Es el máximo seguro en el panel de lectura de Outlook |
| Fondo oscuro con respaldo claro | Algunos clientes invierten los colores en modo oscuro y el resultado es ilegible |
| Sin imágenes para el texto | Muchos clientes las bloquean por defecto |

**Qué necesito de Marketing:** el logotipo en **PNG con fondo transparente**, a 2× (unos 240 px de ancho), y alojado en una URL estable del sitio. En correo no puedo usar el wordmark de texto que uso en la web.

---

## 10 · Bloque H · Cumplimiento

| # | Qué | Detalle |
|---|---|---|
| 1 | **DPA de Resend** | Aceptar en `https://resend.com/legal/dpa`, archivar y revisar sus subencargados |
| 2 | **Política de privacidad** | Debe reflejar a **Resend** y al proveedor del buzón como encargados, y la transferencia internacional si aplica. **El equipo de desarrollo no toca el texto legal**: se señala el hueco y lo resuelve quien lo redactó |
| 3 | **RAT** | Dos entradas separadas: «leads de la web» y «elaboración de presupuestos». Son finalidades distintas |
| 4 | **Base jurídica (P22)** | He escrito la información en capas apuntando a *medidas precontractuales solicitadas por el interesado*, no a consentimiento. Necesito que se confirme o se corrija |
| 5 | **Retención** | Plazos de las seis carpetas del buzón y de los leads no convertidos en EspoCRM. Propuesta de MIG-02 §11.5 como punto de partida |

---

## 11 · Decisiones que siguen abiertas

| # | Decisión | Mi recomendación |
|---|---|---|
| 1 | **pnpm 10 o 11** | MIG-02 §5.2 dice bajar a 10.34.5 porque Dependabot soporta 7–10. **Quiero verificarlo antes** contra la documentación actual: la configuración de pnpm 11 ya está escrita y en verde, y bajarla es trabajo. Alternativa limpia: quedarse en 11 y usar **Renovate**, que sí lo soporta |
| 2 | **Analítica** | Plausible autoalojado en la UE. Ninguna opción se puede dar por exenta de consentimiento sin verificar su configuración efectiva, su alojamiento, el tratamiento de la IP y si escribe en el dispositivo |
| 3 | **Duplicados en EspoCRM** | Estrategia por `webSubmissionId`, no por email: dos consultas del mismo correo pueden ser dos oportunidades legítimas |
| 4 | **Quién envía el correo de presupuesto** | La función, para que funcione desde el primer día. Cuando el servicio local exista, se puede mover allí, que tiene diario y reintentos |
| 5 | **Precios de licencia EDR y MDR** | El propio Excel los marca como *«MARCADOR DE POSICIÓN: confirmar precio real con el distribuidor»*. Ahora salen en pantalla y por correo, así que confirmarlos pasa de deseable a necesario antes de publicar |

---

## 12 · Qué hago yo mientras consigues todo esto

Ninguno de estos pasos necesita una sola de tus respuestas, y todos son prerrequisito de lo demás. Un commit por paso.

| # | Trabajo |
|---|---|
| 1 | Reorganizar el monorepo: `gateway/` → `site/pbcg/`, y el guardián que impide que `src/` importe de ahí |
| 2 | `contracts/`: esquema de ingestión, mapeo de enums entre el contrato y el motor, y `pbcg-golden-vectors.json` para que el servicio local pruebe contra los mismos casos |
| 3 | CLI del motor (`pbcg/bin/calculate.mjs`), para que el servicio local use exactamente este motor y no una reimplementación |
| 4 | Reescribir el namespace `calculator` con el flujo definitivo y los textos de la sección 8 |
| 5 | Retirar la newsletter: formulario, claves y endpoint |
| 6 | `ContactForm` completo, con validación, accesibilidad y antispam, contra un simulacro de la función |
| 7 | Interfaz de la calculadora, con el resultado en pantalla |
| 8 | La Netlify Function, con las claves y Resend simulados en tests |
| 9 | Las tres plantillas de correo, con vista previa local |
| 10 | `netlify.toml`: proxy firmado, rate limiting, cabeceras, CSP, caché, 404 por idioma y `/` → `/es/` |
| 11 | Actualizar el plan principal con la revisión `01-e` y reescribir `CLAUDE.md`, que describe una arquitectura que ya no existe |

Lo primero que se detiene sin respuestas es el **blog** (necesito el bloque E) y el **despliegue real** (bloques A a D).

---

*Fin del documento.*
