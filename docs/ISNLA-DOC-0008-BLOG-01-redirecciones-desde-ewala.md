# ISNLA-DOC-0008-BLOG-01 · Redirecciones del blog de ewala.es a ISN Labs

| Campo | Valor |
|---|---|
| Documento | ISNLA-DOC-0008-BLOG-01 |
| Fecha | 29/07/2026 |
| Estado | **Pendiente de aplicar en el repositorio `enrmerald/EwalaWeb`** |
| Para quién | Quien mantenga el sitio de Ewala |
| Decisión de origen | Dirección, 29/07/2026: los artículos se retiran de ewala.es con 301 hacia ISN Labs |

## Qué hay que hacer y por qué

Los 26 artículos del blog de Ewala se han migrado al sitio de ISN Labs. Según la
decisión de Dirección, **la indexabilidad pasa al dominio nuevo**: las URLs de
`ewala.es/blog/posts/…` deben devolver un **301 permanente** hacia su artículo en
`secnorthlabs.eu`.

Sin esas redirecciones pasan dos cosas, y las dos son malas:

1. **Contenido duplicado.** El mismo texto en dos dominios obliga al buscador a
   elegir uno, y no necesariamente elige el que interesa.
2. **Se pierde el posicionamiento acumulado.** La autoridad de esas URLs no se
   traslada sola: el 301 es exactamente lo que la traslada.

## Cómo aplicarlas

El blog de Ewala se publica con Hugo y su sitio ya tiene `netlify.toml`. Se añaden
estas reglas y se despliega. **No hace falta borrar los ficheros de los
artículos**: con `force = true` la redirección tiene prioridad sobre el fichero
publicado.

```toml
# ── Blog migrado a ISN Labs (ISNLA-DOC-0008-BLOG-01) ────────────────────────
# El contenido vive ahora en secnorthlabs.eu. 301 permanente para trasladar el
# posicionamiento y no competir con nosotros mismos por el mismo texto.

[[redirects]]
  from = "/blog/posts/ataques-cadena-suministro-riesgo-invisible/"
  to = "https://www.secnorthlabs.eu/es/blog/ataques-cadena-suministro-riesgo-invisible/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/categorias-del-ens/"
  to = "https://www.secnorthlabs.eu/es/blog/categorias-del-ens/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/ciberseguridad-en-la-nube/"
  to = "https://www.secnorthlabs.eu/es/blog/ciberseguridad-en-la-nube/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/como-adaptarse-al-ens-paso-a-paso/"
  to = "https://www.secnorthlabs.eu/es/blog/como-adaptarse-al-ens-paso-a-paso/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/como-subir-tu-secure-score-en-azure-y-acelerar-el-cumplimiento/"
  to = "https://www.secnorthlabs.eu/es/blog/como-subir-tu-secure-score-en-azure-y-acelerar-el-cumplimiento/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/cpg-2-convergencia-it-ot/"
  to = "https://www.secnorthlabs.eu/es/blog/cpg-2-convergencia-it-ot/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/dispositivos-iot-y-las-capas-de-la-ciberseguridad/"
  to = "https://www.secnorthlabs.eu/es/blog/dispositivos-iot-y-las-capas-de-la-ciberseguridad/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/ens-cuando-es-obligatorio-y-como-adaptarse/"
  to = "https://www.secnorthlabs.eu/es/blog/ens-cuando-es-obligatorio-y-como-adaptarse/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/ens-vs-iso-27001-diferencias/"
  to = "https://www.secnorthlabs.eu/es/blog/ens-vs-iso-27001-diferencias/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/l4s-mejorando-la-conexion-y-la-seguridad-en-redes-de-baja-latencia/"
  to = "https://www.secnorthlabs.eu/es/blog/l4s-mejorando-la-conexion-y-la-seguridad-en-redes-de-baja-latencia/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/las-10-principales-amenazas-de-ciberseguridad-tu-guia-esencial-para-la-proteccion-empresarial-24-7/"
  to = "https://www.secnorthlabs.eu/es/blog/las-10-principales-amenazas-de-ciberseguridad-tu-guia-esencial-para-la-proteccion-empresarial-24-7/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/livet-digitalizacion-ganaderia-extensiva/"
  to = "https://www.secnorthlabs.eu/es/blog/livet-digitalizacion-ganaderia-extensiva/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/mas-alla-del-escudo-digital-la-nueva-era-de-la-ciberseguridad-empresarial/"
  to = "https://www.secnorthlabs.eu/es/blog/mas-alla-del-escudo-digital-la-nueva-era-de-la-ciberseguridad-empresarial/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/ndr-en-ot/"
  to = "https://www.secnorthlabs.eu/es/blog/ndr-en-ot/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/por-que-es-importante-la-ciberseguridad/"
  to = "https://www.secnorthlabs.eu/es/blog/por-que-es-importante-la-ciberseguridad/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/que-es-el-ens/"
  to = "https://www.secnorthlabs.eu/es/blog/que-es-el-ens/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/que-es-la-ciberseguridad-y-para-que-sirve/"
  to = "https://www.secnorthlabs.eu/es/blog/que-es-la-ciberseguridad-y-para-que-sirve/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/que-es-un-siem-y-para-que-sirve-y-un-soar/"
  to = "https://www.secnorthlabs.eu/es/blog/que-es-un-siem-y-para-que-sirve-y-un-soar/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/que-es-un-soc-en-ciberseguridad/"
  to = "https://www.secnorthlabs.eu/es/blog/que-es-un-soc-en-ciberseguridad/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/que-es-un-xdr-y-como-puede-proteger-tu-empresa/"
  to = "https://www.secnorthlabs.eu/es/blog/que-es-un-xdr-y-como-puede-proteger-tu-empresa/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/sistemas-y-redes-industriales-ot/"
  to = "https://www.secnorthlabs.eu/es/blog/sistemas-y-redes-industriales-ot/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/tendencias-ciberseguridad-2025/"
  to = "https://www.secnorthlabs.eu/es/blog/tendencias-ciberseguridad-2025/"
  status = 301
  force = true

[[redirects]]
  from = "/blog/posts/xdr-vs-siem-la-solucion-para-tu-negocio/"
  to = "https://www.secnorthlabs.eu/es/blog/xdr-vs-siem-la-solucion-para-tu-negocio/"
  status = 301
  force = true
```

Son **23 reglas**. Los slugs no cambian, así que la correspondencia es uno a uno:
lo único que varía es el dominio y el prefijo de idioma `/es/`.

## Los tres artículos que no se redirigen todavía

| Artículo | Motivo |
|---|---|
| `de-tiktok-a-tu-empresa-proteccion-integral-con-soc-mdr-24-7` | 7 menciones a Kit Digital |
| `la-ciberseguridad-en-la-era-de-los-ataques-digitales-protege-tu-empresa-24-7` | 4 menciones a Kit Digital |
| `la-importancia-de-una-solucion-integral-de-seguridad` | 4 menciones a Kit Digital, y «En Ewala, hemos comprobado…» |

En los tres, **el programa Kit Digital es el argumento central del artículo**: el
cuerpo ofrece «un año completo de protección sin coste» para empresas de 50 a 250
empleados. Ese programa lo tramita Ewala como agente digitalizador, no ISN Labs.
Publicarlos con la marca nueva sería ofrecer algo que ISN Labs no da, así que en el
repositorio del sitio están con `draft: true` y no se generan.

Tres salidas, a decidir por Dirección:

| Opción | Consecuencia |
|---|---|
| **Se quedan en ewala.es** *(recomendada)* | Describen la oferta de Ewala y ahí encajan. No se redirigen, y se retiran del repositorio de ISN Labs |
| Se reescriben sin Kit Digital | Pasan a `draft: false` y se añaden sus tres redirecciones a la lista de arriba |
| Se retiran de los dos sitios | En ewala.es, 301 hacia `/blog/` o 410 |

## Comprobación posterior

```bash
curl -sI https://ewala.es/blog/posts/que-es-el-ens/ | head -3
# HTTP/2 301
# location: https://www.secnorthlabs.eu/es/blog/que-es-el-ens/
```

Y en Search Console:

- En el dominio nuevo, enviar `https://www.secnorthlabs.eu/sitemap.xml`.
- En el de Ewala, vigilar unas semanas que esas URLs pasan al estado «Página con
  redirección» y no a error. Es la señal de que el traslado se ha entendido.

> **Una advertencia sobre el orden.** No se aplican las redirecciones **antes** de
> que el blog de ISN Labs esté publicado: durante ese hueco las URLs antiguas
> apuntarían a un 404 y se perdería tráfico real.
