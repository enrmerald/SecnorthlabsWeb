# isnlabs-web-gateway

Todo el codigo de servidor de ISN Labs: el **motor PBCG**, el adaptador de
EspoCRM, la bandeja de salida y el SMTP.

Implementa la Fase 5 y siguientes de `ISNLA-DOC-0008-01`.

## Por que existe este repositorio

**Netlify no tiene acceso a nada de lo que hay aqui, y esa es toda la razon.**

El sitio (`site/`) se exporta por completo y lo publica un CDN. Si el modelo
economico viviera alli, Netlify lo compilaria y acabaria en el JavaScript que
descarga cualquier visitante:

- Las tarifas y **todos** los coeficientes, publicados.
- El algoritmo economico completo, legible y reproducible.
- **La puerta de captacion de leads, evitable**: abrir las herramientas de
  desarrollo, llamar a la funcion y obtener el precio sin dejar ni el nombre.
- Y si el servidor aceptara la horquilla calculada por el navegador, se podria
  manipular el importe que llega al CRM.

Es el bloqueante **B01** del plan. La separacion lo resuelve de forma mas fuerte
que un `import 'server-only'`: no hay nada que borrar por descuido, porque el
fichero no esta en el otro repositorio.

> ⚠️ **Ahora mismo `site/` y `gateway/` conviven en el mismo repositorio git.**
> El plan lo permite como paso intermedio, pero deja abierto un pendiente
> tecnico: **hay que dividirlos antes de produccion**, porque en esta forma
> Netlify tiene acceso al codigo del gateway durante el build y se pierde justo
> la compartimentacion que motiva la migracion.

## Estado

| Pieza | Estado |
|---|---|
| Motor PBCG (`src/domain/pbcg/`) | ✅ Implementado, con el caso de oro y 59 pruebas en verde |
| Bandeja de salida `submission` + `delivery_job` | ⬜ Pendiente (M8) |
| Servidor Fastify y verificacion de la firma de Netlify | ⬜ Pendiente (M9) |
| Adaptador de EspoCRM | ⛔ Bloqueado por P14 (rol y equipo), P15 (campos) y P25 (duplicados) |

## Comandos

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test        # el caso de oro del Excel y la bateria completa
```

## El caso de oro

Sale de la columna B de la hoja `CALCULADORA` del dimensionador y **debe estar
en verde antes de tocar la interfaz**. Si no cuadra, el error esta en
`calculate.ts`, no en la pantalla.

| Magnitud | Valor |
|---|---|
| Horas tecnicas/mes | `7.5` |
| Total redondeado | **`840 €`** |
| Horquilla total | **`815 – 900 €/mes`** |

## Reglas que no se negocian

1. **El repositorio del sitio no contiene ninguna tarifa ni coeficiente.** Ni en
   codigo, ni en JSON, ni en comentarios, ni en tests. Lo comprueba
   `pnpm verify:export` del sitio en cada build.
2. **El gateway recalcula siempre.** No acepta como fiable ningun `total`,
   horquilla, tamano ni numero de horas que llegue del navegador: si viene en el
   cuerpo de la peticion, se ignora.
3. **La respuesta contiene solo el `PublicQuoteDto`**, con lo que la persona ve
   en pantalla. Nada de coeficientes, desglose de horas internas, tarifa
   efectiva ni margen. La conversion vive en una sola funcion, `toPublicDto()`.
4. **De la hoja `PARAMETROS` no se porta el coste interno** (`B7`, `B8`), y de
   `CALCULADORA` no se portan `E29` ni `E30`. Lo que no esta no se filtra.
5. **Ningun dato personal en los logs.** Solo `requestId` y `submission.id`.
