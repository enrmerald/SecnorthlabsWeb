# ISNLA-DOC-0008-MIG-02 · Migración a captación por correo cifrado con Resend e importador local para EspoCRM

| Campo | Valor |
|---|---|
| Documento | ISNLA-DOC-0008-MIG-02 |
| Título | Migración del Web Gateway público a correo cifrado con Resend e importador local |
| Versión | 01 |
| Fecha | 28/07/2026 |
| Estado | Propuesto para incorporar a ISNLA-DOC-0008-01 antes de comenzar el siguiente paso de implementación |
| Documento afectado | ISNLA-DOC-0008-01 · Plan de implementación de la web ISN Labs |
| Revisión sustituida | Arquitectura de Web Gateway público y acceso directo Gateway → EspoCRM de la revisión 01-d |
| Audiencia | Claude Code, desarrollo, sistemas, ciberseguridad, cumplimiento y comercial |
| Objetivo | Mantener el sitio estático en Netlify, eliminar cualquier acceso entrante a la infraestructura local y entregar los leads a EspoCRM mediante un buzón dedicado y un agente local |

---

# 0 · Resumen ejecutivo

## 0.1 Cambio principal

Se elimina por completo esta arquitectura:

```text
Navegador
  → proxy firmado de Netlify
  → Web Gateway público
  → EspoCRM local o privado
```

Se sustituye por:

```text
Navegador
  → proxy firmado de Netlify
  → función mínima de correo
  → Resend
  → buzón dedicado

Agente local
  → consulta saliente del buzón
  → verifica y descifra el mensaje
  → calcula PBCG si procede
  → crea o actualiza el Lead en EspoCRM local
  → mueve el mensaje a Procesados
```

La infraestructura local:

- no publica ningún puerto;
- no necesita VPN con Netlify;
- no necesita túnel;
- no necesita on-premises data gateway;
- no acepta llamadas desde Internet;
- no entrega a Netlify ninguna credencial de EspoCRM;
- no entrega a Resend ninguna credencial de EspoCRM;
- solo inicia conexiones salientes hacia el proveedor de correo;
- llama a EspoCRM exclusivamente por la red local.

## 0.2 Decisión sobre Power Automate o servicio local

Se adopta como solución principal:

> **Servicio local en Python, ejecutado como servicio de sistema o contenedor, con acceso de solo lectura y movimiento sobre un único buzón y acceso local de mínimo privilegio a EspoCRM.**

Power Automate queda como alternativa secundaria porque:

- el desencadenador de correo se ejecuta en la nube de Microsoft;
- para llegar a EspoCRM local necesita un on-premises data gateway o un conector adicional;
- reintroduce una vía de orquestación cloud → red local;
- manejar adjuntos cifrados, firmas, reintentos e idempotencia es más complejo;
- portar el motor PBCG a expresiones de Power Automate sería frágil;
- las pruebas automatizadas y la observabilidad son inferiores;
- el versionado y la revisión de código son menos claros.

## 0.3 Corrección terminológica

**SMTP no sirve para obtener correo.**

SMTP se usa para **enviar** mensajes.

Para recibir o leer el buzón se utilizará:

- **Microsoft Graph**, si el buzón está en Microsoft 365 — opción recomendada;
- **IMAP sobre TLS con OAuth 2.0**, si el proveedor no es Microsoft 365;
- nunca POP3;
- nunca autenticación básica si el proveedor admite OAuth;
- nunca automatización visual de Outlook como mecanismo principal.

## 0.4 Impacto sobre la calculadora

La opción aprobada en este documento es la de máxima separación:

1. La web recoge datos técnicos y contacto.
2. La función de Netlify valida y envía un mensaje cifrado.
3. El agente local descifra.
4. El motor PBCG se ejecuta localmente.
5. Se crea el Lead.
6. Se envía la estimación al interesado por correo.

Por tanto, la calculadora deja de prometer resultado instantáneo en pantalla.

Nuevo mensaje:

> «Hemos recibido tus datos. Nuestro sistema generará la estimación y te la enviará por correo.»

No debe mantenerse:

> «Te mostramos la cuota orientativa al momento.»

Si Dirección exige mantener la cotización instantánea, será necesaria una variante híbrida en la que el motor PBCG se ejecute dentro de una función de Netlify. Esa variante no se adopta en este plan porque vuelve a situar el modelo económico en infraestructura cloud ejecutable.

---

# 1 · Estado actual que se conserva

## 1.1 Commits ya realizados

Estos commits se conservan:

| Commit | Trabajo | Acción |
|---|---|---|
| `dba82ef` | Baseline SPA Vite + documentación | Conservar |
| `52a8f76` | Scaffold Next 16.2.12, pnpm y exportación estática | Conservar, con revisión de pnpm |
| `3ae41b1` | Sistema de diseño | Conservar |
| `4544bf9` | i18n `/es` y `/en`, slugs traducidos y manifiesto | Conservar |
| `d5a8453` | Layout común | Conservar |
| `7bf3d7b` | Las 15 páginas | Conservar |
| `2099deb` | Motor PBCG y tests | Conservar y trasladar al servicio local |

## 1.2 Estado validado

Se toma como línea base:

- 32 páginas estáticas;
- español e inglés;
- 59 tests PBCG;
- caso de oro:
  - total: 840 €;
  - horquilla: 815–900 €;
- 280 E2E;
- cuatro anchuras probadas;
- lint limpio;
- type-check limpio;
- presupuesto real de JavaScript: 148,5 KB;
- trinquete aprobado: 155 KB;
- Excel confidencial fuera de Git;
- errores responsive ya corregidos.

Nada de esto debe rehacerse sin una causa concreta.

## 1.3 Regla del Excel

Se mantiene la decisión ya implementada:

> El Excel es la fuente de verdad del cálculo.

Firewall, servidores físicos, OT, sedes y consultoría se calculan como lo hace el Excel, aunque la indentación del pseudocódigo anterior pudiera sugerir otra cosa.

El caso de oro y los tests existentes no se modifican para adaptarlos a un pseudocódigo antiguo.

---

# 2 · Hallazgos que obligan a cambiar el plan

## 2.1 EspoCRM no es accesible desde Netlify

EspoCRM está dentro de la infraestructura local.

No existe una ruta segura y directa desde Netlify porque:

- Netlify no se incorpora a una VPN corporativa convencional;
- no se desea publicar la API de EspoCRM;
- no se desea abrir un reverse proxy hacia la red;
- no se desea instalar un túnel;
- el gateway público inicialmente previsto acabaría siendo otra superficie permanente.

## 2.2 Una web estática no puede llamar directamente a Resend

La API de Resend necesita una API key.

Esa clave no puede estar:

- en JavaScript del navegador;
- en variables `NEXT_PUBLIC_*`;
- en HTML;
- en `out/`;
- en un JSON descargable;
- en un formulario;
- en una cabecera generada por el cliente.

Por ello, hace falta una pieza de cómputo mínima.

La web continúa siendo estática, pero el envío se ejecuta en una función serverless aislada.

## 2.3 El correo no es una cola transaccional por naturaleza

El correo aporta:

- almacenamiento temporal;
- reintentos de transporte;
- trazabilidad;
- aislamiento respecto a la red local;
- funcionamiento con conexiones exclusivamente salientes.

Pero también introduce:

- posibles retrasos;
- filtrado antispam;
- duplicados;
- mensajes dañados;
- adjuntos bloqueados;
- retención en Resend y en el proveedor del buzón;
- necesidad de reconciliación;
- dependencia de dos proveedores.

Para usarlo como canal de ingestión se añaden:

- payload estructurado;
- cifrado;
- firma;
- identificador único;
- idempotencia;
- diario local;
- carpetas de estado;
- reintentos;
- cuarentena;
- monitorización;
- borrado automático.

## 2.4 El proveedor de correo procesará datos

Resend y el proveedor del buzón pasan a formar parte del tratamiento.

La arquitectura reduce la exposición técnica de la red local, pero no elimina obligaciones de protección de datos.

Se debe:

- aceptar y archivar el DPA de Resend;
- revisar sus subencargados;
- documentar transferencias;
- actualizar la política de privacidad;
- actualizar el RAT;
- definir retención;
- cifrar el contenido de negocio antes de enviarlo;
- evitar PII en asunto, cabeceras, tags y cuerpo visible.

---

# 3 · Arquitectura objetivo

## 3.1 Tres componentes separados

### A. Sitio estático

Repositorio:

```text
isnlabs-site
```

Responsabilidad:

- páginas;
- formularios;
- UX;
- i18n;
- SEO;
- validación de cliente;
- llamadas a `/api/ingest`.

No contiene:

- Resend API key;
- motor PBCG;
- claves privadas;
- EspoCRM;
- lógica de correo;
- acceso a buzones;
- Python;
- API de servidor.

### B. Mailer serverless

Repositorio independiente:

```text
isnlabs-web-mailer
```

Despliegue:

```text
Netlify Functions
```

Responsabilidad:

- recibir el formulario;
- validar;
- aplicar antispam;
- normalizar;
- crear el envelope;
- firmarlo;
- cifrarlo;
- enviarlo por Resend;
- responder con referencia.

No contiene:

- EspoCRM URL;
- API key de EspoCRM;
- acceso local;
- base de datos;
- PBCG;
- información de clientes;
- Excel;
- lógica comercial de precios.

### C. Importador local

Repositorio:

```text
isnlabs-local-ingest
```

Despliegue:

- Docker local;
- servicio systemd;
- servicio Windows, si fuera obligatorio.

Responsabilidad:

- leer el buzón;
- descargar adjuntos;
- verificar firma;
- descifrar;
- validar;
- deduplicar;
- ejecutar PBCG;
- crear o actualizar Lead;
- enviar estimación al cliente;
- mover mensajes;
- mantener diario local;
- alertar.

No publica ningún endpoint.

## 3.2 Flujo de contacto

```text
[Visitante]
   │
   │ POST /api/ingest
   ▼
[Netlify del sitio]
   │ signed proxy
   ▼
[Netlify Function del mailer]
   │
   ├─ valida
   ├─ firma
   ├─ cifra
   └─ Resend API
         │
         ▼
[leads-ingest@dominio]
         ▲
         │ Microsoft Graph / IMAP TLS
[Agente Python local]
         │
         ├─ verifica
         ├─ descifra
         ├─ deduplica
         └─ POST local /api/v1/Lead
               │
               ▼
          [EspoCRM local]
```

## 3.3 Flujo de calculadora

```text
[Visitante]
  │ datos de contacto + parámetros
  ▼
[Mailer]
  │ envelope cifrado tipo quote_request
  ▼
[Buzón]
  ▲
[Agente local]
  ├─ descifra
  ├─ valida
  ├─ ejecuta motor PBCG
  ├─ crea Lead con parámetros y resultado
  ├─ envía email de estimación
  └─ mueve mensaje a Processed
```

## 3.4 Superficie pública final

Quedan expuestos:

1. CDN estático de Netlify.
2. Una función serverless con un único contrato cerrado.
3. Resend como servicio saliente.

No quedan expuestos:

- EspoCRM;
- API local;
- motor PBCG;
- bandeja local;
- credenciales del CRM;
- red corporativa;
- sincronizador;
- base local;
- claves de descifrado;
- paneles internos.

---

# 4 · Repositorios y separación

## 4.1 Repositorio del sitio

```text
isnlabs-site/
├── src/
├── messages/
├── public/
├── scripts/
├── tests/
├── netlify.toml
├── package.json
└── pnpm-lock.yaml
```

`assert-static-architecture` sigue prohibiendo:

```text
app/api/
route.ts
'use server'
middleware.ts
proxy.ts
netlify/functions/
server-only
EspoCRM
Resend
PBCG
SMTP
IMAP
Graph
```

El sitio sigue siendo completamente estático.

## 4.2 Repositorio del mailer

```text
isnlabs-web-mailer/
├── netlify/
│   └── functions/
│       └── ingest.ts
├── src/
│   ├── schemas/
│   ├── crypto/
│   ├── mail/
│   ├── antispam/
│   └── observability/
├── tests/
├── netlify.toml
├── package.json
└── pnpm-lock.yaml
```

Solo se permite una función pública:

```text
POST /v1/ingest
```

No se permite:

```text
GET de datos
listado
búsqueda
actualización
borrado
upload arbitrario
proxy genérico
URL suministrada por cliente
destinatario suministrado por cliente
plantilla suministrada por cliente
```

## 4.3 Repositorio local

```text
isnlabs-local-ingest/
├── pyproject.toml
├── src/
│   └── isnlabs_ingest/
│       ├── main.py
│       ├── config.py
│       ├── crypto.py
│       ├── journal.py
│       ├── processor.py
│       ├── mailbox/
│       │   ├── graph.py
│       │   └── imap.py
│       ├── espocrm/
│       │   ├── client.py
│       │   ├── mapping.py
│       │   └── metadata.py
│       ├── quote/
│       │   ├── adapter.py
│       │   └── schemas.py
│       └── notifications/
│           └── sender.py
├── pbcg-engine/
│   ├── src/
│   ├── tests/
│   └── bin/
│       └── calculate.mjs
├── migrations/
├── tests/
├── deploy/
│   ├── docker/
│   ├── systemd/
│   └── windows/
└── docs/
```

## 4.4 Acción sobre `gateway/`

El directorio actual:

```text
gateway/
```

no se elimina.

Se transforma así:

```text
gateway/src/domain/pbcg/
→
isnlabs-local-ingest/pbcg-engine/src/domain/pbcg/
```

Se conservan:

- configuración;
- motor;
- tipos;
- redondeo;
- 59 tests;
- caso de oro;
- versión del modelo.

No se implementan:

- Fastify público;
- Nginx público;
- firma de proxy hacia gateway;
- outbox cloud;
- red privada desde VPS;
- acceso entrante.

---

# 5 · Decisión sobre pnpm 11.5.0

## 5.1 Inconsistencia actual

La implementación reporta:

```text
pnpm 11.5.0
```

El plan anterior fijaba:

```text
pnpm 10.34.5
```

La documentación actual de GitHub indica soporte de Dependabot para lockfiles pnpm 7–10, no pnpm 11.

## 5.2 Decisión recomendada

Como el requisito de Dirección es usar Dependabot:

> **Volver a pnpm 10.34.5 antes de activar Dependabot.**

Crear un commit aislado:

```text
chore: align pnpm with Dependabot supported version
```

No mezclarlo con el mailer.

## 5.3 Alternativa

Mantener pnpm 11.5.0 solo si:

- se renuncia a Dependabot para dependencias pnpm;
- se adopta Renovate;
- o GitHub publica soporte oficial para pnpm 11.

Mientras no ocurra, no debe afirmarse que Dependabot actualizará correctamente un lockfile pnpm 11.

---

# 6 · Contrato del frontend

## 6.1 Única ruta

El navegador llama:

```text
POST /api/ingest
```

Netlify la proxifica al proyecto mailer.

## 6.2 Tipos de mensaje

```text
contact
quote_request
proposal_request
newsletter
```

`newsletter` permanecerá deshabilitado hasta resolver blog, proveedor y base jurídica.

## 6.3 Petición común

```json
{
  "schemaVersion": "1.0",
  "submissionId": "uuid",
  "type": "contact",
  "locale": "es",
  "createdAt": "2026-07-28T10:00:00.000Z",
  "privacy": {
    "acknowledged": true,
    "noticeVersion": "2026-07-28"
  },
  "marketing": {
    "optIn": false,
    "textVersion": "2026-07-28"
  },
  "contact": {},
  "data": {},
  "antispam": {
    "honeypot": "",
    "renderedAt": 1785230000000
  }
}
```

## 6.4 Contacto

```json
{
  "contact": {
    "firstName": "María José",
    "lastName": "García Pérez",
    "company": "Empresa",
    "email": "maria@example.com",
    "phone": "+34 600 000 000",
    "title": "CISO"
  },
  "data": {
    "need": "mssp_ot",
    "message": "Texto"
  }
}
```

## 6.5 Solicitud de cotización

```json
{
  "type": "quote_request",
  "contact": {
    "firstName": "María",
    "lastName": "García",
    "company": "Empresa",
    "email": "maria@example.com",
    "phone": ""
  },
  "data": {
    "sites": 1,
    "users": 25,
    "cpd": "external",
    "physicalServersOwn": 0,
    "virtualServersOwn": 0,
    "physicalServersExternal": 1,
    "virtualServersExternal": 3,
    "otInstallations": 0,
    "edr": "edr",
    "licensesIncluded": true,
    "backup": true,
    "firewalls": 1,
    "siem": false,
    "patching": false,
    "consultingHours": 2,
    "module": "ensMedium"
  }
}
```

## 6.6 Datos que no acepta

La función rechaza:

```text
total
quote
range
price
hours
tariff
margin
cost
EspoCRM ID
recipient
from
subject
template
callback URL
webhook URL
arbitrary headers
attachments from client
```

---

# 7 · Proxy firmado entre sitio y mailer

## 7.1 Motivo

Los dos repositorios y proyectos permanecen separados.

El navegador ve:

```text
https://www.secnorthlabs.eu/api/ingest
```

Netlify reescribe hacia:

```text
https://isnlabs-web-mailer.netlify.app/v1/ingest
```

## 7.2 Configuración en el sitio

```toml
[[redirects]]
  from = "/api/ingest"
  to = "https://isnlabs-web-mailer.netlify.app/v1/ingest"
  status = 200
  force = true
  signed = "NETLIFY_MAILER_PROXY_SECRET"

  [redirects.rate_limit]
    window_limit = 20
    window_size = 60
    aggregate_by = ["ip", "domain"]
```

El límite exacto se ajusta al plan contratado y al tráfico.

## 7.3 Verificación en el mailer

La función valida:

- cabecera `x-nf-sign`;
- algoritmo HS256;
- firma;
- `iss`;
- `exp`;
- ID del sitio de origen;
- URL de origen;
- contexto de deploy;
- entorno.

Producción solo acepta:

```text
site ID de producción
site_url de producción
deploy_context production
```

Staging usa:

- otro proyecto;
- otro secreto;
- otro destinatario;
- otra API key;
- otra clave de firma;
- otra clave pública de cifrado.

## 7.4 Defensa adicional

También se valida:

```text
Origin
Sec-Fetch-Site
Content-Type
Content-Length
método
ruta
schema
```

Ningún control aislado se considera suficiente.

---

# 8 · Netlify Function de ingestión

## 8.1 Responsabilidad única

La función hace exactamente:

```text
validar → normalizar → firmar → cifrar → enviar → responder
```

No hace:

```text
calcular PBCG
consultar EspoCRM
guardar en base
leer correo
enviar al destinatario introducido por el visitante
```

## 8.2 Configuración

```ts
export const config = {
  path: '/v1/ingest',
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: ['ip', 'domain'],
    windowSize: 60,
    windowLimit: 20,
  },
}
```

## 8.3 Variables

Configurar en Netlify UI con scope Functions:

```text
RESEND_API_KEY
RESEND_FROM
LEAD_MAILBOX_TO
ALLOWED_SOURCE_SITE_ID
ALLOWED_SOURCE_SITE_URL
MAIL_ENVIRONMENT
LEAD_ENCRYPTION_PUBLIC_KEY
LEAD_ENCRYPTION_KEY_ID
LEAD_SIGNING_PRIVATE_KEY
LEAD_SIGNING_KEY_ID
PRIVACY_NOTICE_VERSION
MARKETING_TEXT_VERSION
```

No declararlas con valor real en `netlify.toml`.

## 8.4 Resend API key

Crear una clave:

```text
nombre: ISN Labs Web Mailer Production
permiso: sending_access
dominio: notify.secnorthlabs.eu
```

No usar `full_access`.

Staging usa otra clave.

## 8.5 Dominio de envío

Recomendado:

```text
notify.secnorthlabs.eu
```

Remitente:

```text
ISN Labs Web <webforms@notify.secnorthlabs.eu>
```

Destinatario fijo:

```text
leads-ingest@secnorthlabs.eu
```

No usar el dominio raíz para aislar reputación.

Configurar:

- SPF;
- DKIM;
- DMARC;
- TLS;
- monitorización de rebotes.

## 8.6 Idempotencia

La función usa:

```text
isnlabs/<environment>/<type>/<submissionId>
```

como `Idempotency-Key` de Resend.

Resend conserva la idempotencia durante 24 horas.

El importador vuelve a deduplicar; nunca se depende solo de Resend.

## 8.7 Respuesta

Éxito:

```http
202 Accepted
Cache-Control: no-store
```

```json
{
  "ok": true,
  "status": "accepted",
  "reference": "submissionId"
}
```

Error de validación:

```http
400
```

Rate limit:

```http
429
Retry-After: ...
```

Fallo Resend:

```http
503
```

No responder éxito si Resend no ha aceptado el envío.

## 8.8 Logs

Permitido:

```text
requestId
submissionId
type
locale
status
duration
Resend response code
Resend email ID
```

Prohibido:

```text
nombre
email
teléfono
empresa
mensaje
parámetros
attachment
JWE
clave
headers completos
body
```

---

# 9 · Payload cifrado y firmado

## 9.1 Objetivo

Aunque Resend y el proveedor de buzón transporten el correo:

- no deben ver los datos del formulario en claro;
- una extracción de la base de correo no debe revelar el lead;
- un atacante que conozca el buzón no debe poder fabricar un lead válido;
- una modificación debe ser detectada;
- un mensaje repetido no debe crear otro Lead.

## 9.2 Diseño estándar

Usar JOSE:

1. Crear un JWS firmado.
2. Cifrar el JWS dentro de un JWE.

Algoritmos:

```text
Firma: EdDSA / Ed25519
Cifrado de clave: RSA-OAEP-256
Cifrado de contenido: A256GCM
```

No inventar un formato criptográfico propio.

## 9.3 Distribución de claves

Mailer:

```text
clave privada de firma
clave pública de cifrado local
```

Agente local:

```text
clave pública de verificación
clave privada de descifrado
```

La clave privada de descifrado nunca abandona la infraestructura local.

## 9.4 Claims firmadas

```json
{
  "iss": "isnlabs-web-mailer",
  "aud": "isnlabs-local-ingest",
  "environment": "production",
  "schemaVersion": "1.0",
  "submissionId": "uuid",
  "type": "quote_request",
  "iat": 1785230000,
  "exp": 1785834800,
  "origin": "https://www.secnorthlabs.eu",
  "payloadSha256": "hex",
  "payload": {}
}
```

## 9.5 Rotación

Cada clave tiene `kid`.

Mantener:

- clave activa;
- clave anterior durante la ventana de tránsito;
- fecha de activación;
- fecha de retirada;
- procedimiento de emergencia.

Rotación normal:

```text
cada 90 días
```

Rotación inmediata ante sospecha.

## 9.6 Caducidad

El mensaje puede tener:

```text
exp = iat + 7 días
```

El agente rechaza mensajes vencidos y los mueve a Quarantine.

La caducidad no sustituye la deduplicación.

---

# 10 · Formato del correo

## 10.1 Asunto

```text
[ISNLABS-INGEST-V1] quote_request 550e8400-e29b-41d4-a716-446655440000
```

No incluir:

- persona;
- empresa;
- email;
- teléfono;
- precio;
- necesidad.

## 10.2 Cuerpo

```text
Mensaje de integración automatizada de ISN Labs.
No responder.
El contenido de negocio está cifrado en el adjunto.
Schema: 1.0
Submission: <uuid>
Environment: production
```

## 10.3 Adjunto

```text
isnlabs-ingest-v1-<submissionId>.json
```

Contenido:

```json
{
  "format": "JWE",
  "schemaVersion": "1.0",
  "keyId": "enc-2026-q3",
  "signingKeyId": "sig-2026-q3",
  "content": "<compact JWE>"
}
```

## 10.4 Cabeceras

```text
X-ISNLabs-Schema: 1.0
X-ISNLabs-Submission: <uuid>
X-ISNLabs-Type: quote_request
X-ISNLabs-Environment: production
X-Entity-Ref-ID: <uuid>
```

Solo contienen datos no personales.

## 10.5 Tags de Resend

```text
type=quote_request
environment=production
schema=1_0
```

No usar PII en tags.

## 10.6 Envío individual

No usar batch para el mensaje de ingestión porque lleva adjunto.

---

# 11 · Buzón dedicado

## 11.1 Dirección

```text
leads-ingest@secnorthlabs.eu
```

No reutilizar:

```text
info@
ventas@
soporte@
correo personal
shared mailbox usado por humanos
```

## 11.2 Restricciones

- sin auto-forward externo;
- sin acceso móvil;
- sin POP;
- sin reglas personales;
- sin respuestas automáticas;
- sin acceso de usuarios normales;
- bloqueo de inicio interactivo si el proveedor lo permite;
- MFA para administradores;
- auditoría habilitada;
- retención definida;
- no usarlo para conversaciones.

## 11.3 Carpetas

```text
Inbox/
└── ISNLabs Ingest/
    ├── Pending
    ├── Processing
    ├── Processed
    ├── Retry
    ├── Rejected
    └── Quarantine
```

## 11.4 Regla de correo

Mover a `Pending` si:

- remitente coincide;
- asunto comienza por `[ISNLABS-INGEST-V1]`;
- destinatario es el buzón dedicado.

La regla no es control de autenticidad.

La autenticidad la determina la firma criptográfica.

## 11.5 Retención

Propuesta inicial:

| Carpeta | Retención |
|---|---:|
| Pending | hasta procesar |
| Processing | máximo 30 minutos antes de recuperación |
| Retry | 7 días |
| Processed | 7 días |
| Rejected | 14 días |
| Quarantine | 30 días, acceso restringido |

Cumplimiento debe validar los plazos.

## 11.6 Resend y privacidad

Resend:

- procesa contenido;
- tiene DPA;
- usa subencargados;
- declara operaciones principales en Estados Unidos;
- mantiene backups;
- registra actividad de envío.

Por eso:

- el adjunto va cifrado;
- el cuerpo no lleva PII;
- los datos identificativos no van en asunto;
- la política de privacidad debe reflejar el proveedor;
- se documentan SCC/DPF según corresponda.

---

# 12 · Método de lectura del buzón

## 12.1 Microsoft 365 — recomendado

Usar Microsoft Graph.

Ventajas:

- OAuth 2.0;
- credenciales de aplicación;
- certificado en lugar de contraseña;
- auditoría;
- control de permisos;
- consulta incremental;
- carpetas y adjuntos;
- sin sesión humana.

## 12.2 Registro de aplicación

Crear:

```text
ISN Labs Local Lead Ingest
```

Autenticación:

```text
certificate credential
```

No usar client secret si puede evitarse.

## 12.3 Permisos

El agente necesita:

```text
leer mensajes
leer adjuntos
mover mensajes
marcar estado
```

Usar el permiso mínimo que permita esas operaciones.

Restringir la aplicación al buzón dedicado mediante **Exchange Online Application RBAC**.

No dejar `Mail.ReadWrite` sin ámbito sobre todos los buzones.

## 12.4 Consulta delta

El agente usa delta query sobre `Pending`.

Ventajas:

- no relee todo el buzón;
- persiste `deltaLink`;
- detecta nuevos mensajes;
- soporta reinicios;
- reduce llamadas.

Guardar el `deltaLink` en la base local.

Si queda inválido:

1. registrar incidencia;
2. realizar nueva sincronización base;
3. deduplicar por IDs;
4. no recrear Leads.

## 12.5 IMAP — fallback

Si el buzón no es Microsoft 365:

```text
IMAPS, puerto 993
TLS
OAuth2
```

El agente:

- selecciona `Pending`;
- busca mensajes no procesados;
- usa `UID`;
- descarga;
- procesa;
- mueve con `UID MOVE`;
- persiste `UIDVALIDITY` y UID.

Si cambia `UIDVALIDITY`, realizar reconciliación.

## 12.6 SMTP

SMTP solo se usa para:

- Resend enviando al buzón;
- agente local enviando estimaciones si se elige SMTP.

No se usa para leer.

---

# 13 · Servicio Python local

## 13.1 Stack

```text
Python 3.13.x
uv o pip-tools
httpx
pydantic
cryptography
msal
tenacity
structlog
sqlite3 / SQLAlchemy
prometheus-client opcional
```

Fijar versiones exactas.

No instalar dependencias sin lockfile.

## 13.2 Modos

```text
python -m isnlabs_ingest worker
python -m isnlabs_ingest once
python -m isnlabs_ingest health
python -m isnlabs_ingest reconcile
python -m isnlabs_ingest retry
```

## 13.3 Configuración

```env
ENVIRONMENT=production
MAIL_PROVIDER=microsoft_graph
MAILBOX_ADDRESS=leads-ingest@secnorthlabs.eu
MAIL_FOLDER_PENDING_ID=
MAIL_FOLDER_PROCESSED_ID=
MAIL_FOLDER_RETRY_ID=
MAIL_FOLDER_REJECTED_ID=
MAIL_FOLDER_QUARANTINE_ID=

ENTRA_TENANT_ID=
ENTRA_CLIENT_ID=
ENTRA_CERTIFICATE_PATH=
ENTRA_CERTIFICATE_THUMBPRINT=

INGEST_DECRYPTION_PRIVATE_KEY_PATH=
MAILER_VERIFY_PUBLIC_KEY_PATH=
ALLOWED_SIGNING_KEY_IDS=
ALLOWED_ENCRYPTION_KEY_IDS=

ESPOCRM_URL=http://espocrm.local
ESPOCRM_API_KEY=
ESPOCRM_TEAM_ID=
ESPOCRM_ASSIGNED_USER_ID=

LOCAL_DB_PATH=/var/lib/isnlabs-ingest/state.db
PBCG_NODE_BIN=/usr/bin/node
PBCG_CLI_PATH=/opt/isnlabs-ingest/pbcg-engine/dist/calculate.mjs

RESEND_API_KEY=
RESEND_FROM=
QUOTE_REPLY_TO=
```

## 13.4 Permisos de ficheros

```text
/etc/isnlabs-ingest/            0750
/etc/isnlabs-ingest/*.pem       0600
/var/lib/isnlabs-ingest/        0750
state.db                        0600
logs                            sin payload
```

Ejecutar con usuario:

```text
isnlabs-ingest
```

Sin login.

## 13.5 Sin listener

El servicio no hace:

```text
bind 0.0.0.0
listen
FastAPI público
Flask público
Fastify
Express
webhook entrante
```

Opcionalmente puede exponer salud solo en:

```text
127.0.0.1
```

o mediante comando CLI.

---

# 14 · Diario local e idempotencia

## 14.1 Base

SQLite WAL es suficiente.

```sql
CREATE TABLE ingest_message (
  id TEXT PRIMARY KEY,
  provider_message_id TEXT NOT NULL UNIQUE,
  internet_message_id TEXT,
  submission_id TEXT NOT NULL UNIQUE,
  message_type TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  lease_until TEXT,
  last_error_code TEXT,
  espo_lead_id TEXT,
  quote_model_version TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 14.2 Estados

```text
discovered
leased
verified
decrypted
validated
calculated
crm_synced
notification_sent
completed
retry
rejected
quarantine
```

## 14.3 Claves de idempotencia

Se comprueban:

1. provider message ID;
2. Internet Message-ID;
3. submissionId;
4. payload hash;
5. `cWebSubmissionId` en EspoCRM.

## 14.4 Lease

Antes de procesar:

```text
status = leased
lease_until = now + 5 min
```

Si el proceso muere, otro ciclo recupera leases vencidos.

## 14.5 Confirmación

Mover a `Processed` solo después de:

- Lead creado o localizado;
- diario confirmado;
- estimación enviada, si aplica.

---

# 15 · Verificación, descifrado y validación

## 15.1 Orden obligatorio

```text
1. comprobar remitente y prefijo
2. comprobar adjunto único
3. comprobar tamaño
4. parsear envelope exterior
5. comprobar key IDs
6. descifrar JWE
7. verificar JWS
8. validar issuer y audience
9. comprobar iat y exp
10. comprobar environment
11. comprobar submissionId
12. comprobar hash
13. validar payload con Pydantic
14. comprobar duplicado
15. procesar
```

No deserializar objetos arbitrarios.

## 15.2 Límites

```text
mensaje total: según proveedor, pero aceptar máximo 256 KB
adjunto: máximo 64 KB
cadenas: límites equivalentes al formulario
arrays: tamaño cerrado
campos desconocidos: rechazo
```

## 15.3 Errores

| Error | Destino |
|---|---|
| Firma no válida | Quarantine |
| Cifrado no válido | Quarantine |
| Schema desconocido | Rejected |
| Mensaje vencido | Rejected |
| Duplicado idéntico | Processed sin recrear |
| Mismo ID, payload distinto | Quarantine |
| EspoCRM caído | Retry |
| Resend de respuesta caído | Retry |
| Error permanente de datos | Rejected |

---

# 16 · Motor PBCG local

## 16.1 No reescribir sin necesidad

El motor TypeScript tiene:

- 59 tests;
- test de oro;
- redondeo validado;
- comportamiento contrastado con Excel.

Portarlo directamente a Python introduce riesgo.

## 16.2 Integración recomendada

Python actúa como orquestador.

El motor TypeScript se compila como CLI local.

Entrada por stdin:

```json
{
  "schemaVersion": "1.0",
  "input": {}
}
```

Salida por stdout:

```json
{
  "ok": true,
  "modelVersion": "2026-07-v2",
  "quote": {}
}
```

## 16.3 Ejecución segura

Python usa:

```python
subprocess.run(
    [node_path, cli_path],
    input=json_payload,
    text=True,
    capture_output=True,
    timeout=5,
    check=False,
    shell=False,
)
```

Reglas:

- `shell=False`;
- rutas fijas;
- ningún argumento del usuario se convierte en comando;
- timeout;
- límite de salida;
- validar JSON de salida;
- registrar solo submissionId;
- no exponer stderr con datos;
- usuario sin privilegios.

## 16.4 Tests compartidos

Generar:

```text
pbcg-golden-vectors.json
```

Incluye:

- caso de oro;
- fronteras;
- módulos;
- extremos;
- incoherencias;
- redondeo.

Python prueba el adapter con los mismos vectores.

## 16.5 Opción futura

Solo portar a Python si:

- existe necesidad operativa;
- se mantienen tests cruzados;
- ambos motores producen resultado idéntico;
- se retira el motor antiguo para evitar dos fuentes.

---

# 17 · Flujo de cotización asíncrona

## 17.1 Cambios de UX

Antes:

```text
enviar puerta → mostrar precio instantáneo
```

Ahora:

```text
enviar solicitud → mostrar referencia → recibir estimación por email
```

## 17.2 Pantalla de éxito

```text
Solicitud recibida

Referencia: XXXXXXXX

Estamos preparando tu estimación con los datos facilitados.
La recibirás en el correo indicado.
```

No prometer tiempo exacto hasta medir operación real.

## 17.3 Agente local

1. calcula;
2. crea Lead;
3. genera email de estimación;
4. envía;
5. guarda estado.

## 17.4 Correo al interesado

Puede enviarse con Resend desde el agente local.

Usar otra API key:

```text
ISN Labs Quote Sender Production
sending_access
domain scoped
```

No reutilizar la clave del mailer.

Contenido:

- rango visible;
- tamaño;
- licencias;
- auditoría;
- disclaimer;
- exclusiones;
- referencia;
- enlace a contacto.

No incluir:

- horas internas;
- tarifas;
- margen;
- coste;
- coeficientes.

## 17.5 Fallo de notificación

Si el Lead está creado pero el email falla:

```text
status = retry
etapa = notification
```

No crear otro Lead.

---

# 18 · Integración local con EspoCRM

## 18.1 EspoCRM sigue privado

URL ejemplo:

```text
http://espocrm.local/api/v1
```

o nombre Docker:

```text
http://espocrm/api/v1
```

No exponer públicamente.

## 18.2 Usuario API

Crear usuario dedicado:

```text
Web Lead Importer
```

Permisos:

- crear Leads;
- leer Leads del equipo Web Leads;
- editar Leads del equipo;
- no borrar;
- no exportar;
- no acceder a otras entidades;
- sin administración.

## 18.3 Equipo

```text
Web Leads
```

Incluye:

- usuario API;
- comerciales necesarios.

## 18.4 Campos

Crear y verificar nombres API reales:

```text
need
origin
privacyNoticeAcknowledged
privacyNoticeAt
privacyNoticeVersion
marketingOptIn
marketingConsentAt
marketingConsentVersion
utm
quoteParams
quoteRange
quoteModelVersion
webSubmissionId
sourceMessageId
ingestedAt
```

Probablemente llevarán prefijo `c`.

No deducir los nombres.

Consultar Metadata local y documentar:

```text
docs/espocrm-contract.md
```

## 18.5 Duplicados

Estrategia recomendada:

1. buscar `cWebSubmissionId`;
2. si existe, no crear;
3. si no existe, crear;
4. registrar ID;
5. si la creación devuelve resultado incierto, volver a buscar antes de reintentar.

El email no se usa como única deduplicación.

## 18.6 Mapeo

| Payload | EspoCRM |
|---|---|
| firstName | `firstName` |
| lastName | `lastName` |
| company | `accountName` |
| email | `emailAddress` |
| phone | `phoneNumber` |
| title | `title` |
| message | `description` |
| need | campo personalizado |
| privacy | campos personalizados |
| marketing | campos personalizados |
| quote input | campo JSON |
| quote range | varchar |
| model version | varchar |
| submissionId | varchar |
| source message ID | varchar |

## 18.7 Autenticación

Preferir HMAC si está disponible y correctamente gestionado.

Las credenciales viven:

```text
solo en el host local
```

Nunca en Netlify ni Resend.

---

# 19 · Power Automate como alternativa

## 19.1 Flujo posible

```text
When a new email arrives (V3)
→ filtrar carpeta y asunto
→ obtener adjunto
→ validar
→ on-premises data gateway
→ custom connector
→ EspoCRM
```

## 19.2 Problemas

- requiere gateway local;
- requiere licencia compatible;
- requiere conector;
- la lógica de cifrado necesita código auxiliar;
- cálculo PBCG complejo;
- reintentos menos transparentes;
- idempotencia más difícil;
- pruebas unitarias limitadas;
- control de versiones peor;
- más plataformas implicadas.

## 19.3 Uso permitido

Power Automate puede usarse para:

- alertar de mensajes en Quarantine;
- alertar si no se procesan leads;
- notificar a comercial;
- crear tareas no críticas.

No se recomienda como motor principal.

---

# 20 · Seguridad del mailer

## 20.1 Threat model

Amenazas:

- spam;
- abuso de Resend;
- robo de API key;
- envío duplicado;
- payload manipulado;
- remitente falsificado;
- replay;
- deploy preview contra producción;
- filtración en logs;
- email malicioso;
- dependencia comprometida;
- clave de cifrado rotada;
- mailbox comprometido.

## 20.2 Controles

- proxy firmado;
- rate limiting;
- origin;
- schema estricto;
- tamaño;
- honeypot;
- tiempo;
- idempotencia Resend;
- JWS;
- JWE;
- key IDs;
- entorno;
- expiración;
- diario local;
- deduplicación;
- permisos mínimos;
- claves por entorno;
- no PII en logs;
- dependencias fijadas;
- age gate;
- alertas.

## 20.3 Deploy previews

Deploy preview:

- no recibe secretos de producción;
- no puede enviar a buzón productivo;
- usa mailer staging;
- destinatario staging;
- asunto con `STAGING`;
- clave pública staging;
- signing key staging.

## 20.4 Rotación de API key Resend

1. crear nueva;
2. cargar en Netlify;
3. desplegar;
4. probar;
5. eliminar anterior;
6. registrar cambio.

No expira automáticamente.

---

# 21 · Disponibilidad y reintentos

## 21.1 Mailer

Reintentar Resend solo con el mismo idempotency key.

Política:

```text
2 intentos dentro de la misma ejecución
backoff corto
timeout total limitado
```

No convertir una función en worker de larga duración.

## 21.2 Agente

Backoff:

```text
1 min
5 min
15 min
1 h
6 h
```

Máximo antes de intervención:

```text
10 intentos
```

## 21.3 EspoCRM caído

El mensaje permanece en Retry.

No se pierde.

## 21.4 Agente caído

Los mensajes permanecen en Pending.

Al arrancar:

- recupera delta;
- recupera leases;
- procesa.

## 21.5 Resend caído

El visitante ve error.

No se afirma que la solicitud fue guardada.

## 21.6 Mailbox caído

Resend aplicará sus mecanismos de entrega, pero la aceptación de la API no garantiza procesamiento final.

Crear alerta si:

- Resend reporta rebote;
- el buzón no recibe pruebas sintéticas;
- el agente no procesa en un umbral.

---

# 22 · Prueba sintética

Cada 15 minutos o una vez por hora:

1. un job controlado envía un mensaje `health_probe`;
2. el mailer lo manda al buzón;
3. el agente lo procesa sin crear Lead;
4. registra latencia;
5. alerta si no llega.

No incluir PII.

Esto comprueba:

- función;
- Resend;
- DNS;
- buzón;
- Graph/IMAP;
- agente;
- criptografía.

---

# 23 · Monitorización

## 23.1 Mailer

Métricas:

```text
requests
accepted
validation_failed
rate_limited
resend_failed
encryption_failed
duration
```

## 23.2 Agente

```text
mailbox_poll_ok
messages_discovered
messages_verified
messages_rejected
messages_quarantined
leads_created
leads_deduplicated
quotes_calculated
notifications_sent
retry_count
oldest_pending_age
last_success_at
```

## 23.3 Alertas

- oldest pending > 15 min;
- mensaje Quarantine;
- 5 fallos consecutivos;
- EspoCRM caído;
- Graph token error;
- certificado próximo a caducar;
- clave no reconocida;
- disco;
- backup;
- prueba sintética fallida.

---

# 24 · Backup y restauración

## 24.1 Qué respaldar

- diario SQLite;
- configuración;
- claves;
- contrato EspoCRM;
- certificados Entra;
- tests;
- PBCG;
- procedimientos.

## 24.2 Claves

La clave privada de descifrado:

- backup cifrado;
- dos custodios;
- acceso auditado;
- fuera del servidor principal;
- procedimiento de recuperación probado.

## 24.3 Restauración

Prueba trimestral:

1. restaurar agente;
2. restaurar DB;
3. cargar claves;
4. procesar mensaje de prueba;
5. verificar Lead;
6. verificar cotización.

---

# 25 · Cambios en el sitio

## 25.1 API client

```ts
await fetch('/api/ingest', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(payload),
  signal,
})
```

## 25.2 Idempotencia de cliente

Usar:

```ts
crypto.randomUUID()
```

Mantener `submissionId` para reintentos del mismo envío.

## 25.3 ContactForm

Conservar:

- campos;
- accesibilidad;
- privacy acknowledgement;
- marketing opt-in;
- errores;
- honeypot;
- tiempo.

Cambiar endpoint.

## 25.4 Calculadora

La interfaz aún no está implementada, por lo que el cambio se realiza antes de crearla.

Nuevo flujo:

```text
parámetros
→ contacto
→ envío
→ referencia
→ resultado por correo
```

Eliminar de la interfaz planificada:

- recálculo continuo contra servidor;
- token de recotización;
- precio instantáneo;
- propuesta tras resultado.

## 25.5 CTA

`Recibir propuesta detallada` puede convertirse en:

```text
Solicitar estimación
```

Una única solicitud contiene contacto y parámetros.

---

# 26 · Cambios en pruebas E2E

## 26.1 Mantener

- 32 páginas;
- rutas;
- responsive;
- a11y;
- 155 KB;
- i18n;
- SEO.

## 26.2 Sustituir

Eliminar tests de:

```text
quote/initial
quote/recalculate
quote/proposal
submissionToken
gateway público
firma gateway → EspoCRM
```

Añadir:

```text
POST /api/ingest
202
400
429
503
doble clic
reintento
no precio instantáneo
pantalla de referencia
```

## 26.3 Mailer tests

- proxy signature válida;
- firma inválida;
- origin;
- payload estricto;
- tamaño;
- honeypot;
- tiempo;
- idempotencia;
- Resend 200/400/409/429/500;
- attachment;
- no PII logs;
- keys staging/prod;
- JWS/JWE roundtrip.

## 26.4 Agente tests

- Graph delta;
- IMAP UID;
- adjunto inexistente;
- varios adjuntos;
- firma inválida;
- clave antigua;
- mensaje vencido;
- replay;
- duplicado;
- lease;
- crash recovery;
- EspoCRM timeout;
- quote;
- notification retry;
- folders.

---

# 27 · GitHub Actions

## 27.1 Sitio

Sigue verificando:

- estático;
- sin funciones;
- sin PBCG;
- sin Resend;
- sin secretos.

## 27.2 Mailer

Pipeline:

```text
install
age gate
lint
typecheck
unit tests
crypto tests
Resend mock tests
secret scan
bundle inspection
deploy preview sin secretos productivos
```

## 27.3 Local agent

```text
ruff
mypy
pytest
bandit
pip-audit
dependency lock
integration mocks
PBCG vectors
container scan
```

## 27.4 Dependabot

Con pnpm 10:

- sitio;
- mailer;
- GitHub Actions.

Para Python:

```yaml
package-ecosystem: "pip"
directory: "/"
```

No auto-merge de:

- criptografía;
- MSAL;
- httpx major;
- pydantic major;
- Python major;
- Node major;
- Resend SDK major.

---

# 28 · Despliegue

## 28.1 Site

Netlify estático.

## 28.2 Mailer

Segundo proyecto Netlify:

```text
isnlabs-web-mailer-prod
isnlabs-web-mailer-staging
```

Custom domain opcional:

```text
forms-api.secnorthlabs.eu
```

No es necesario exponerlo en navegación.

## 28.3 Agent con systemd

```ini
[Unit]
Description=ISN Labs Lead Ingest
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=isnlabs-ingest
Group=isnlabs-ingest
WorkingDirectory=/opt/isnlabs-ingest
EnvironmentFile=/etc/isnlabs-ingest/env
ExecStart=/opt/isnlabs-ingest/.venv/bin/python -m isnlabs_ingest worker
Restart=on-failure
RestartSec=10
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/isnlabs-ingest /var/log/isnlabs-ingest

[Install]
WantedBy=multi-user.target
```

## 28.4 Agent Docker

Si se usa Docker:

- red local con EspoCRM;
- sin `ports`;
- filesystem read-only;
- volumen state;
- secretos montados;
- usuario no root;
- healthcheck;
- restart unless-stopped.

---

# 29 · Power Automate detallado — solo alternativa

## 29.1 Requisitos

- Microsoft 365;
- Power Automate;
- on-premises data gateway;
- custom connector;
- permisos;
- licencia;
- host local;
- mantenimiento mensual.

## 29.2 Pasos

1. Trigger `When a new email arrives (V3)`.
2. Carpeta Pending.
3. From exacto.
4. Subject filter.
5. Obtener adjunto.
6. Llamar a servicio local de descifrado.
7. Parsear.
8. Llamar a custom connector EspoCRM vía gateway.
9. Mover correo.
10. Gestión de errores.

## 29.3 Por qué no se adopta

El paso 6 requiere código de todos modos.

En ese momento Python ya resuelve el flujo entero con menos piezas.

---

# 30 · Privacidad y cumplimiento

## 30.1 Encargados

Documentar:

- Netlify;
- Resend;
- proveedor de buzón;
- cualquier proveedor de monitorización.

## 30.2 Finalidades

Separar:

```text
atención de contacto
elaboración de presupuesto
marketing
```

## 30.3 Evidencia

Guardar localmente:

- submissionId;
- timestamp;
- locale;
- privacy version;
- marketing version;
- resultado;
- message ID;
- model version.

## 30.4 Minimización

No guardar:

- IP completa salvo justificación;
- body en logs;
- email visible en asunto;
- payload en Resend tags;
- payload descifrado en disco temporal;
- contenido tras retención.

## 30.5 Borrado

Tras Lead creado:

- correo Processed se elimina según retención;
- diario conserva metadatos mínimos;
- payload no se conserva fuera de EspoCRM salvo necesidad.

---

# 31 · Incidentes

## 31.1 Resend API key comprometida

1. revocar;
2. crear nueva;
3. desplegar;
4. revisar logs;
5. comprobar abuso;
6. alertar;
7. no afecta a EspoCRM.

## 31.2 Signing key comprometida

1. revocar `kid`;
2. rotar;
3. poner mensajes afectados en Quarantine;
4. revisar;
5. no aceptar mensajes firmados con clave retirada.

## 31.3 Decryption key comprometida

Severidad alta:

1. detener agente;
2. rotar par;
3. actualizar mailer;
4. revisar buzón y backups;
5. activar respuesta a incidente;
6. valorar brecha.

## 31.4 Mailbox comprometido

El atacante puede:

- borrar;
- retrasar;
- copiar ciphertext.

No puede:

- descifrar sin clave local;
- crear mensaje válido sin clave de firma.

## 31.5 Agente comprometido

Puede acceder a:

- payload descifrado;
- EspoCRM;
- clave privada.

Debe estar:

- parcheado;
- aislado;
- con EDR;
- sin navegación;
- con mínimo privilegio;
- monitorizado.

---

# 32 · Nueva secuencia de implementación

Los pasos ya terminados no se repiten.

| Paso | Estado | Trabajo |
|---|---|---|
| M0–M7 | ✅ | Ya realizados mediante los siete commits indicados |
| **M7.1** | Nuevo | Registrar esta migración y congelar la arquitectura gateway |
| **M7.2** | Nuevo | Resolver pnpm 11.5.0 vs Dependabot; recomendado downgrade a 10.34.5 |
| **M8** | Nuevo | Separar `isnlabs-site`, `isnlabs-web-mailer`, `isnlabs-local-ingest` |
| **M9** | Nuevo | Definir schemas de ingestión y contrato versionado |
| **M10** | Nuevo | Generar claves staging/prod y documentar rotación |
| **M11** | Nuevo | Implementar mailer Netlify + Resend |
| **M12** | Nuevo | Configurar dominio Resend, SPF, DKIM, DMARC y buzón |
| **M13** | Nuevo | Implementar agente Python y diario SQLite |
| **M14** | Nuevo | Integrar Microsoft Graph o IMAP |
| **M15** | Nuevo | Integrar motor PBCG existente vía CLI local |
| **M16** | Nuevo | Configurar EspoCRM local y mapping |
| **M17** | Nuevo | Implementar ContactForm y calculadora asíncrona |
| **M18** | Nuevo | Proxy firmado y rate limiting |
| **M19** | Nuevo | E2E, pruebas de seguridad y prueba sintética |
| **M20** | Nuevo | SEO, robots, JSON-LD, Netlify headers y caché |
| **M21** | Nuevo | Dependabot, CI y auto-merge conforme a versiones soportadas |
| **M22** | Nuevo | Piloto interno, recuperación y publicación |

---

# 33 · Cambios exactos que Claude Code debe aplicar al plan principal

## 33.1 Historial

Añadir revisión:

```text
01-e · Migración a correo cifrado con Resend e importador local.
```

## 33.2 Tabla de decisiones

Sustituir:

```text
Web Gateway público
proxy firmado hacia gateway
gateway llama a EspoCRM
outbox en gateway
```

por:

```text
mailer serverless aislado
Resend
buzón dedicado
agente local
EspoCRM local
```

## 33.3 Arquitectura objetivo

Reemplazar completamente el diagrama de sección 2.1.

## 33.4 Readiness

Marcar:

```text
Fase 5 motor: completada
Gateway Fastify: cancelado
Proxy gateway: cancelado
EspoCRM cloud: cancelado
Mailer: pendiente
Agente local: pendiente
```

## 33.5 Fase 5

Mantener cálculo y tests.

Reescribir arquitectura para ejecución local.

Reescribir interfaz como asíncrona.

Eliminar tres endpoints de recotización.

## 33.6 Fase 6

Reescribir por completo:

1. formulario;
2. proxy;
3. mailer;
4. envelope;
5. Resend;
6. mailbox;
7. agent;
8. PBCG;
9. EspoCRM;
10. retry;
11. compliance.

## 33.7 Fase 10

Separar:

- headers del sitio;
- seguridad del mailer;
- seguridad local.

Eliminar Nginx gateway público.

## 33.8 Fase 11

Tres despliegues:

- site;
- mailer;
- local agent.

## 33.9 Fase 12

Añadir matrices de tests de este documento.

## 33.10 Pendientes

Cerrar:

```text
P28 plan Netlify para gateway
P29 subdominio gateway
P30 secreto gateway
P31 VPS gateway
P32 red privada gateway
```

Añadir:

```text
P34 proveedor del buzón
P35 dirección del buzón
P36 Graph o IMAP
P37 retención
P38 SLA de cotización
P39 dominio Resend
P40 host del agente
P41 sistema operativo
P42 destinatario de alertas
P43 validación legal de Resend
P44 decisión pnpm 10/11
```

---

# 34 · Criterios de aceptación

## Sitio

- [ ] Sigue siendo `output: export`.
- [ ] No contiene Functions.
- [ ] No contiene PBCG.
- [ ] No contiene Resend.
- [ ] Llama solo a `/api/ingest`.
- [ ] No muestra precio instantáneo.
- [ ] Mantiene ES/EN y SEO.
- [ ] Mantiene 155 KB.

## Mailer

- [ ] Repositorio separado.
- [ ] Una única función.
- [ ] API key `sending_access`.
- [ ] Dominio limitado.
- [ ] Proxy firmado.
- [ ] Rate limiting.
- [ ] JWS + JWE.
- [ ] Idempotency-Key.
- [ ] Sin PII en logs.
- [ ] Sin PBCG.
- [ ] Sin EspoCRM.

## Mailbox

- [ ] Dedicado.
- [ ] Sin forwarding.
- [ ] Carpetas.
- [ ] Retención.
- [ ] Auditoría.
- [ ] Reglas.
- [ ] Acceso de aplicación limitado.

## Agent

- [ ] Solo saliente.
- [ ] Sin listener.
- [ ] Verifica firma.
- [ ] Descifra local.
- [ ] Diario WAL.
- [ ] Idempotencia.
- [ ] Retry.
- [ ] Quarantine.
- [ ] Motor PBCG local.
- [ ] API Espo local.
- [ ] Alertas.
- [ ] Backup.

## EspoCRM

- [ ] Privado.
- [ ] Equipo.
- [ ] Usuario API.
- [ ] Campos.
- [ ] Metadata verificada.
- [ ] submissionId.
- [ ] Duplicados.
- [ ] Pruebas de permisos.

## Operación

- [ ] Prueba sintética.
- [ ] Restore.
- [ ] Rotación.
- [ ] Runbook.
- [ ] DPA.
- [ ] RAT.
- [ ] Política de privacidad.
- [ ] SLA medido.

---

# 35 · Decisiones pendientes para Dirección

## Necesarias antes de M12

1. Proveedor del buzón:
   - Microsoft 365;
   - otro.

2. Dirección:

```text
leads-ingest@...
```

3. Dominio Resend:

```text
notify....
```

4. Retención.

5. Tiempo que se comunica al usuario.

6. Sistema operativo del agente.

7. Host local.

8. Destinatario de alertas.

9. Envío de estimaciones:
   - Resend;
   - Microsoft Graph;
   - SMTP corporativo.

10. pnpm:
    - volver a 10;
    - o sustituir Dependabot.

---

# 36 · Referencias oficiales

- Resend · Send Email API:
  `https://resend.com/docs/api-reference/emails/send-email`
- Resend · Idempotency Keys:
  `https://resend.com/docs/dashboard/emails/idempotency-keys`
- Resend · API Key permissions:
  `https://resend.com/docs/dashboard/api-keys/introduction`
- Resend · Custom Headers:
  `https://resend.com/docs/dashboard/emails/custom-headers`
- Resend · Attachments:
  `https://resend.com/docs/dashboard/emails/attachments`
- Resend · Security:
  `https://resend.com/docs/security`
- Resend · DPA:
  `https://resend.com/legal/dpa`
- Netlify · Functions:
  `https://docs.netlify.com/build/functions/get-started/`
- Netlify · Function environment variables:
  `https://docs.netlify.com/build/functions/environment-variables/`
- Netlify · Rate limiting:
  `https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/`
- Microsoft Graph · Mail API:
  `https://learn.microsoft.com/graph/api/resources/mail-api-overview`
- Microsoft Graph · Delta query messages:
  `https://learn.microsoft.com/graph/delta-query-messages`
- Exchange Online · Application RBAC:
  `https://learn.microsoft.com/exchange/permissions-exo/application-rbac`
- Power Automate · Email triggers:
  `https://learn.microsoft.com/power-automate/email-triggers`
- Power Automate · On-premises data gateway:
  `https://learn.microsoft.com/power-automate/gateway-reference`
- GitHub · Dependabot supported ecosystems:
  `https://docs.github.com/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories`

---

# 37 · Instrucción final para Claude Code

Claude Code debe:

1. leer este documento entero;
2. no implementar el Fastify público previsto;
3. conservar los siete commits existentes;
4. mantener todos los tests PBCG;
5. trasladar el motor a ejecución local;
6. crear tres límites claros:
   - sitio;
   - mailer;
   - agente;
7. no introducir acceso entrante a la red;
8. no llamar a Resend desde el navegador;
9. no usar SMTP para leer;
10. no implementar Power Automate como vía principal;
11. no portar PBCG a Python sin tests cruzados;
12. no registrar PII;
13. no mostrar cotización instantánea;
14. aplicar un commit por etapa;
15. detenerse si una decisión de negocio pendiente altera el contrato.

---

*Fin del documento.*
