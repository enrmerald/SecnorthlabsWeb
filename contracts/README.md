# contracts/ · Contrato de ingestión, versión 1.0

Fuente de verdad compartida por los **tres consumidores** del contrato:

| Consumidor | Dónde vive | Qué hace con esto |
|---|---|---|
| Cliente del sitio | `site/src/lib/api/cliente.ts` | Construye el payload |
| Función de ingestión | `site/netlify/functions/ingest.ts` | Lo valida, calcula y cifra |
| Servicio local | Repositorio externo, Python | Descifra, verifica y escribe en EspoCRM |

**Si esto no está en un solo sitio, los tres se desincronizan y el síntoma es el
peor posible: no hay error.** Un campo que no casa no revienta nada - el dato
llega, no se reconoce y desaparece. Es el mismo fallo que el plan describe con
los nombres de campo de EspoCRM.

## Ficheros

| Fichero | Qué es | Se edita a mano |
|---|---|---|
| `pbcg-golden-vectors.json` | 27 casos resueltos y 7 entradas que deben rechazarse | **No.** Se regenera con `pnpm vectores` |
| `espocrm-contract.md` | Nombres reales de campo de la API de Lead | Sí, cuando Sistemas los confirme |

El mapeo de enums entre el contrato y el motor vive en
`site/pbcg/src/contrato.ts`, no aquí: así el compilador comprueba que es
exhaustivo, cosa que un JSON no puede hacer.

## Los dos idiomas del contrato

El payload va en **inglés**; el motor de cálculo y sus 59 tests están en
**español**. La traducción está centralizada en `site/pbcg/src/contrato.ts` y es
exhaustiva por construcción: los mapas se declaran como
`Record<CpdContrato, Cpd>`, de modo que añadir un valor al enum sin traducirlo
**no compila**.

| Contrato | Motor | | Contrato | Motor |
|---|---|---|---|---|
| `external` | `externo` | | `none` | `ninguno` |
| `own` | `propio` | | `nis2` | `nis2` |
| `hybrid` | `hibrido` | | `ensMedium` | `ensMedia` |
| | | | `ensHigh` | `ensAlta` |

`contrato.test.ts` comprueba las 36 combinaciones de ida y vuelta y que el caso
de oro escrito en inglés sigue dando 840 €.

## Forma del sobre

```jsonc
{
  "schemaVersion": "1.0",
  "submissionId": "550e8400-e29b-41d4-a716-446655440000",  // uuid del cliente
  "type": "contact | quote_request",
  "locale": "es | en",
  "createdAt": "2026-07-28T10:00:00.000Z",
  "privacy":   { "acknowledged": true,  "noticeVersion": "2026-07-28" },
  "marketing": { "optIn": false, "textVersion": "2026-07-28" },
  "contact": { "firstName": "…", "lastName": "…", "company": "…",
               "email": "…", "phone": "…", "title": "…" },
  "data": { /* segun `type` */ },
  "antispam": { "honeypot": "", "renderedAt": 1785230000000 }
}
```

`newsletter` **no existe**: se retiró por decisión de Dirección del 28/07/2026.

### `data` de un `quote_request`

Los dieciséis campos de `DatosCotizacionContrato`. Ver `site/pbcg/src/contrato.ts`.

### Lo que la función rechaza

Todo lo que no esté en el esquema, porque valida con `.strict()`.

> ⚠️ **Ojo con la lista de MIG-02 §6.6.** Enumera `hours`, `tariff`, `cost` entre
> los campos prohibidos, pero `consultingHours` es un campo **legítimo** del
> payload de cotización. Implementar esa lista como filtro de subcadenas rompería
> la calculadora el primer día. La protección correcta es el allowlist estricto,
> que ya rechaza cualquier clave desconocida: un `total` inventado por el
> navegador no llega al motor porque no está en el esquema, no porque su nombre
> aparezca en una lista negra.

**El servidor recalcula siempre.** Ningún total, horquilla, tamaño ni número de
horas que llegue del navegador se tiene por fiable.

## El motor como CLI

El servicio local no reimplementa el cálculo: invoca **este** motor.

```bash
echo '{"schemaVersion":"1.0","input":{ … }}' | node site/pbcg/bin/calculate.mjs
```

| Salida | Código |
|---|---:|
| `{ "ok": true, "modelVersion": "…", "quote": { … } }` | 0 |
| `{ "ok": false, "error": "validation", "issues": […] }` | 1 |
| `{ "ok": false, "error": "engineFailure", … }` | 2 |

Los códigos 1 y 2 se distinguen a propósito: «el dato del cliente es malo» y «el
motor está roto» son dos incidencias distintas y se atienden de forma distinta.

Portar el cálculo a Python crearía dos fuentes de verdad para el mismo precio, y
la única forma de saber que coinciden sería mantener pruebas cruzadas para
siempre. Sale más barato invocar el proceso.

## Regenerar los vectores

```bash
cd site && pnpm vectores
```

Hay que hacerlo **cada vez que cambie una tarifa, un coeficiente o una
periodicidad**, subiendo también `PBCG_MODEL_VERSION`. El diff del JSON muestra
exactamente qué precios se han movido, que es la razón de que el fichero se
versione en lugar de generarse al vuelo.

El generador falla si un caso marcado como válido no pasa la validación, o si uno
marcado como inválido sí la pasa. No puede producir un fichero incoherente.
