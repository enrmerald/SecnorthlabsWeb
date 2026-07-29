# ISNLA-DOC-0008-IMP-01 · Plan de implementación: formularios, calculadora y marca

| Campo | Valor |
|---|---|
| Documento | ISNLA-DOC-0008-IMP-01 |
| Fecha | 28/07/2026 |
| Estado | En ejecución |
| Entradas | ISNLA-DOC-0008-01 · MIG-02 · REQ-01 · Decisiones de Dirección de 28/07/2026 |
| Alcance | Retirar la newsletter, terminar `ContactForm`, terminar la calculadora con precio en pantalla, y añadir los logotipos de ISN Labs y SentryN3t |

---

## 1 · El problema que hay que resolver primero

Dirección pide **ver la calculadora funcionando y con el precio en pantalla**, aunque el Lead no se envíe todavía. Hay una tensión real que condiciona todo el diseño:

> El motor de cálculo **no puede estar en el navegador** (bloqueante B01), y ahora mismo **no hay ningún backend desplegado**.

Tres formas de resolverlo, y solo una es aceptable:

| Opción | Veredicto |
|---|---|
| Meter el motor en el cliente «solo para probar» | ❌ Publica las tarifas y el algoritmo. Y el guardián de `verify:architecture` lo rompería, con razón. Lo temporal se queda |
| Simular el precio con números inventados | ❌ Lo que se enseñe no sería el precio real, así que la prueba no prueba nada |
| **Netlify Function que calcula, con el correo desactivado si no hay claves** | ✅ El precio es el real, el motor sigue en servidor, y no hace falta Resend ni buzón para probar |

**Se implementa la tercera.** La función detecta que no hay `RESEND_API_KEY` y entra en **modo prueba**: calcula, devuelve el precio y **dice explícitamente en la respuesta que no ha enviado nada**. La interfaz lo muestra como un aviso visible, para que nadie confunda una demo con un lead capturado.

Se prueba en local con `netlify dev`, que sirve `out/` y las funciones a la vez.

---

## 2 · Orden de ejecución

Hay dependencias reales: los mensajes son la base de los formularios, y el contrato de la función es la base de la interfaz.

| # | Paso | Depende de | Commit |
|---|---|---|---|
| 1 | Retirar la newsletter | - | `chore(site): retirar la newsletter` |
| 2 | Reescribir el namespace `calculator` al flujo con precio en pantalla | - | `feat(site): textos de la calculadora` |
| 3 | Logotipos de ISN Labs y SentryN3t | - | `feat(site): logotipos de marca` |
| 4 | Netlify Function `quote` + `netlify.toml` | 2 | `feat(site): funcion de cotizacion` |
| 5 | Cliente de API a `/api/quote` | 4 | incluido en 4 |
| 6 | `ContactForm` completo | 2, 4 | `feat(site): formulario de contacto` |
| 7 | Interfaz de la calculadora | 2, 4 | `feat(site): interfaz de la calculadora` |
| 8 | E2E de los dos formularios | 6, 7 | incluido en 6 y 7 |

---

## 3 · Paso 1 · Retirar la newsletter

Decisión D5 de REQ-01. Está viva en seis sitios:

```text
site/src/components/forms/FormularioNewsletter.tsx   borrar
site/src/paginas/Blog.tsx                            quitar el bloque
site/src/lib/api/cliente.ts                          quitar la ruta
site/messages/{es,en}.json                           quitar blog.newsletter.*
site/src/config/routes.ts                            sin cambios
```

**Consecuencia que hay que aceptar:** la justificación de que `/blog` fuese indexable era que «el bloque de newsletter sí es real y funcional». Al retirarlo, `/blog` queda como una página que dice «próximamente» y nada más - hasta que se migren los 26 artículos, que es el paso siguiente. Se mantiene indexable porque el contenido va a llegar; si la migración se retrasase, habría que replantearlo.

---

## 4 · Paso 2 · Textos de la calculadora

El namespace actual promete lo contrario de lo que se va a construir. Hay que quitar:

| Clave | Problema |
|---|---|
| `leadGate.subtitle` | «Te mostramos la cuota orientativa al momento» - ahora sí es cierto, pero la redacción cambia |
| `result.recalculating`, `result.updated` | No hay recotización continua |
| `errors.tokenCaducado` | No hay `submissionToken` |
| `result.cta` «Recibir propuesta detallada» | Ya no hay un segundo paso: una sola solicitud |

Y hay que añadir el aviso de modo prueba y el texto de referencia. Redacción, más formal que la propuesta inicial:

> ### Tu estimación
> **815 – 900 €/mes** · Impuestos no incluidos
>
> Tamaño estimado de la organización: **S**
>
> | Licencias | 75 €/mes |
> | Auditorías NIS2 / ENS | 335,83 €/mes |
> | **Total** | **815 – 900 €/mes** |
>
> Te hemos enviado esta estimación a `ana@empresa.com` junto con el desglose y las exclusiones.
>
> Referencia: `A7F3-2B91`
>
> Estimación orientativa y no vinculante. La cuota definitiva depende del alcance validado en una sesión técnica gratuita de 30 minutos.

**Sin plazos.** No se dice «te llamamos en 24 h» hasta que se mida la operación real.

---

## 5 · Paso 3 · Logotipos de marca

Los ficheros están y son válidos, todos con alfa y todos claros, para fondo oscuro:

| Fichero | Medidas | Ratio | Dónde va |
|---|---|---|---|
| `isn_labs_name_white_reference.png` | 4560×760 | 6.000 | Navegación y pie, sustituye al wordmark de texto |
| `sentrynet-horizontal-dark-md.png` | 960×160 | 6.000 | Banda de SentryN3t en Home y Software |
| `sentrynet-stacked-dark-md.png` | 618×320 | 1.931 | Reserva, si hace falta en vertical |

Van **sin cápsula**: son logotipos claros sobre fondo oscuro, que es su uso previsto.

### El wordmark de texto no se borra

`Logotipo.tsx` seguirá existiendo como respaldo. Motivo: la imagen tarda en cargar y el logotipo está en la primera pantalla, así que un `<img>` sin más produce un salto visible. Se resuelve con `width`/`height` y el hueco reservado, pero **el wordmark de texto sigue siendo lo que se usa en el correo** -donde las fuentes web no cargan pero tampoco se puede depender de imágenes bloqueadas- y en la 404 de último recurso.

---

## 6 · Paso 4 · La Netlify Function

```text
site/netlify/functions/quote.ts     POST /api/quote
site/netlify/functions/contact.ts   POST /api/contact
site/netlify.toml                   redirects, cabeceras, caché
```

### Qué hace, en este orden

1. Método `POST` y `Content-Type: application/json`, o `405` / `415`.
2. Tamaño ≤ 32 KB, o `413`.
3. Mismo origen: `Origin` y `Sec-Fetch-Site`. **No hay proxy firmado**, porque el sitio y la función están en el mismo proyecto de Netlify y la firma JWS de Netlify solo funciona proxificando a sitios externos.
4. Esquema `zod` con `.strict()`: cualquier clave desconocida es `400`.
5. Antispam: honeypot y tiempo mínimo. Éxito silencioso, para no darle pistas al bot.
6. **Calcula** con el motor de `pbcg/`.
7. Si hay claves de Resend: firma, cifra y envía. Si no: **modo prueba**.
8. Responde con el `PublicQuoteDto` y una referencia corta.

### El modo prueba

```jsonc
{
  "ok": true,
  "reference": "A7F32B91",
  "quote": { /* PublicQuoteDto */ },
  "delivery": "skipped",           // "sent" cuando haya claves
  "warning": "testMode"            // la interfaz lo pinta como aviso visible
}
```

> ⚠️ **`delivery: "skipped"` no se puede ocultar en la interfaz.** Si se enseña un precio sin decir que no se ha registrado nada, alguien va a dar por hecho que hay un lead esperando en el CRM. El aviso es parte del contrato, no un detalle de depuración.

### Lo que la función NO hace

No consulta EspoCRM, no guarda en base de datos, no lee correo, y no acepta destinatario, plantilla ni URL de retorno del cliente.

### La lista de campos prohibidos de MIG-02 §6.6

Se implementa como **allowlist estricto**, no como filtro de subcadenas. La lista incluye `hours`, que casaría con el campo legítimo `consultingHours`: implementarla literalmente rompería la calculadora el primer día.

---

## 7 · Paso 6 · ContactForm

Los diez campos de la sección 6.1 del plan, con nombre y apellidos **separados**.

- Validación **al perder el foco**, con el mensaje bajo el campo.
- `aria-invalid` y `aria-describedby` en cada campo con error.
- Tras un envío fallido, **resumen de errores al principio que recibe el foco**, con enlaces a cada campo. Es la diferencia entre poder corregir el formulario y abandonarlo.
- Aviso **suave**, no bloqueo, si el dominio del correo es genérico.
- Casilla obligatoria que **acredita que se facilitó la información**, no un consentimiento genérico, con la información en capas visible al lado sin desplegar nada.
- Casilla de marketing **separada y sin premarcar**.
- Honeypot y marca de tiempo, fijados **después del montaje**: con exportación estática, un `Date.now()` en el cuerpo del componente se congela con la fecha del build y el antispam queda decorativo.

---

## 8 · Paso 7 · Interfaz de la calculadora

### Orden en móvil

Parámetros → resumen → puerta de datos → resultado. **Sin panel fijo y sin dos columnas por debajo de 1024 px.**

### Los toggles Sí/No son radios nativos

No `<button>` con `role="radiogroup"`. Reimplementar a mano lo que el HTML ya resuelve obliga a gestionar flechas, `aria-checked`, `tabindex` y foco, y casi siempre sale peor. El estilo se aplica con `appearance: none` y `:checked`.

### Coherencia CPD ↔ servidores

**Error bloqueante, no aviso.** El botón queda desactivado mientras exista la incoherencia y se explica cuál es. No se pone nada a cero en silencio: quien marque «CPD propio» con servidores externos rellenos vería un precio más barato que el real.

Los campos de servidores se muestran u ocultan según el CPD, **pero los valores ocultos siguen en el estado**, que es justo el caso que dispara el error.

### `aria-live`

El resultado se anuncia con `aria-live="polite"` **solo cuando llega**, no mientras se escribe. Los errores de validación van con `role="alert"`.

---

## 9 · Verificación

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm check:i18n && pnpm check:routes
pnpm verify:architecture      # que nada de src/ importe pbcg/ ni netlify/
pnpm build                    # incluye verify:export
pnpm check:js                 # el chunk de la calculadora no dispara el total
pnpm test:e2e
```

E2E nuevas:

- La calculadora devuelve precio y lo pinta.
- El aviso de modo prueba **se ve** cuando `delivery: "skipped"`.
- La incoherencia de CPD desactiva el botón.
- Doble clic no genera dos envíos.
- El formulario de contacto valida al perder el foco y enfoca el resumen de errores.
- Ninguna tarifa aparece en `out/`.

## 10 · Lo que queda fuera

| Fuera de este plan | Por qué |
|---|---|
| Envío real a Resend | Faltan buzón y verificación del dominio |
| Cifrado JWE y firma JWS | Se añade cuando el envío sea real |
| Escritura en EspoCRM | La hace el servicio local, y los 15 campos siguen sin verificar |
| Migración de los 26 artículos | Paso siguiente |
| CMP y analítica | Bloqueado por P12 |
