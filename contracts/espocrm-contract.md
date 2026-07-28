# Contrato de integración con EspoCRM

**Estado: ⛔ SIN VERIFICAR.** No programar el mapeo del servicio local contra
este fichero hasta rellenar la columna «Nombre real de API».

## Por qué existe este fichero

EspoCRM **añade el prefijo `c`** a los campos creados desde Entity Manager, para
evitar conflictos con versiones futuras. El campo que se ve como `need` en la
interfaz probablemente se llame `cNeed` en la API.

Y aquí está el problema: **si se envía un atributo que no existe, EspoCRM lo
ignora y devuelve `200`.** El Lead se crea, sin ese dato, y no hay ningún error.
Es la forma más fácil de perder medio formulario sin enterarse, y no se descubre
hasta que un comercial abre una ficha vacía semanas después.

**No se deducen los nombres. Se comprueban.**

## Cómo obtener los nombres reales

El volcado que se intentó el 28/07/2026 llegó **filtrado por permisos**: devolvió
15 entidades y `Lead` con un único campo (`source`). El usuario de API no tiene
visibilidad de metadatos suficiente, así que hay que usar una de estas dos vías:

**Opción 1 — con clave de administrador:**

```bash
curl -s -H "X-Api-Key: <CLAVE_DE_ADMIN>" \
  http://<espocrm>/api/v1/Metadata \
  | jq '.entityDefs.Lead.fields | keys'
```

**Opción 2 — desde la interfaz:** Administración → Entity Manager → Lead →
Fields. Cada campo muestra su nombre de API en la ficha de detalle.

## Campos estándar

Verificados contra la definición de la entidad `Lead`.

| Payload | Campo de EspoCRM | Nota |
|---|---|---|
| `contact.firstName` | `firstName` | Campo propio, sin partir cadenas |
| `contact.lastName` | `lastName` | Ídem |
| `contact.company` | `accountName` | Texto, **no** un enlace a `Account` |
| `contact.email` | `emailAddress` | |
| `contact.phone` | `phoneNumber` | |
| `contact.title` | `title` | Es campo **estándar**. No hace falta uno personalizado |
| `data.message` | `description` | |
| — | `status` | Fijar `"New"` |
| — | `source` | Fijar `"Web Site"` |

### Valores de enum confirmados

`source` — verificado el 28/07/2026 contra la instancia real:

```
"" · Call · Email · Existing Customer · Partner · Public Relations · Web Site · Campaign · Other
```

> ⚠️ `source` es un **enum cerrado**, no texto libre. Enviar
> `"calculadora-web"` hará que el campo falle o se descarte. El origen fino va
> en el campo personalizado `origin`.

`status` — **no verificado**: el volcado filtrado no devolvió sus opciones. Los
valores por defecto de EspoCRM son `New`, `Assigned`, `In Process`, `Converted`,
`Recycled`, `Dead`, pero **pueden haberse modificado desde Entity Manager**.

## Campos personalizados

Los nombres separan **información de privacidad** de **consentimiento de
marketing**, que son dos cosas distintas. Llamar `cConsent` a la casilla
obligatoria dejaría escrito en el CRM que el interesado «consintió» algo de lo
que solo se le informó — precisamente la confusión que la AEPD señala.

| Campo a crear | Tipo | Contenido | Nombre real de API |
|---|---|---|---|
| `need` | Enum | Las seis opciones de `contact.form.needOptions` | ⬜ |
| `origin` | Enum | `contacto-web`, `calculadora` | ⬜ |
| `privacyNoticeAcknowledged` | Bool | Se marcó la casilla de información | ⬜ |
| `privacyNoticeAt` | DateTime | Momento en que se marcó | ⬜ |
| `privacyNoticeVersion` | Varchar | Versión del texto mostrado | ⬜ |
| `marketingOptIn` | Bool | Consentimiento de marketing, **separado** | ⬜ |
| `marketingConsentAt` | DateTime | Momento del consentimiento | ⬜ |
| `marketingConsentVersion` | Varchar | Versión del texto aceptado | ⬜ |
| `utm` | Text | JSON con `source`/`medium`/`campaign` | ⬜ |
| `quoteParams` | Text | Parámetros de la calculadora (JSON) | ⬜ |
| `quoteRange` | Varchar | Horquilla cotizada, p. ej. `"815 – 900 €/mes"` | ⬜ |
| `quoteModelVersion` | Varchar | `PBCG_MODEL_VERSION` con el que se calculó | ⬜ |
| `webSubmissionId` | Varchar | **Clave de deduplicación.** UUID del envío | ⬜ |
| `sourceMessageId` | Varchar | ID del mensaje de ingestión | ⬜ |
| `ingestedAt` | DateTime | Momento en que el servicio local lo procesó | ⬜ |

## Lo que NUNCA se envía al CRM

Coste interno, margen y tarifa efectiva. **Solo lo que el cliente ha visto en
pantalla.** Es la regla de la sección 5 del plan aplicada a la salida.

## Deduplicación

Por **`webSubmissionId`**, no por email: dos solicitudes del mismo correo pueden
ser dos oportunidades legítimas —una consulta en marzo y un presupuesto en
julio— y consolidarlas perdería información comercial.

Procedimiento: buscar por `webSubmissionId` → si existe, no crear → si no,
crear y registrar el ID → si la creación devuelve un resultado incierto (timeout,
`409`), **volver a buscar antes de reintentar**.

## Permisos del usuario de API

| Permiso | Nivel |
|---|---|
| Crear Lead | Sí |
| Leer Lead | **Equipo** |
| Editar Lead | **Equipo** |
| Eliminar | No |
| Exportar | **No** |
| Resto de entidades | Sin acceso |

**El Lead se asigna al equipo `Web Leads`, no a una persona.** Si se asigna a un
comercial, el Lead deja de ser «propio» del usuario de API y este pierde el
permiso de edición: la actualización posterior fallaría, y solo se descubriría
cuando un cliente real pidiera algo.

**Hay que probarlo contra la instancia real, no suponerlo:** que el usuario de
API puede actualizar un Lead ya asignado al equipo.
