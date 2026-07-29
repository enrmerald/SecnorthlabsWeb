# Estado de las traducciones inglesas

Los 23 artículos de `content/blog/es/` tienen aquí su versión inglesa, con el
mismo nombre de fichero, el mismo `slug` y la misma fecha.

## ⚠️ Pendiente de revisión humana

**Estas traducciones las ha producido Claude (modelo de lenguaje), no un
traductor profesional.** Se decidió así el 29/07/2026 para no dejar la versión
inglesa del sitio vacía, con el acuerdo explícito de que se revisen antes de
darlas por definitivas.

El plan del proyecto (ISNLA-DOC-0008-01, sección 2.5) es tajante en un punto
relacionado: *«el inglés no se genera automáticamente en producción»* para el
copy legal y de consentimiento. Eso **no** se ha tocado aquí: los textos legales
del sitio siguen siendo los portados y validados, y esta carpeta solo contiene
artículos de blog.

### Qué conviene revisar, por orden de importancia

1. **`titleSeo` y `descriptionSeo`.** Son lo que se ve en Google. Una traducción
   correcta no siempre es la que mejor posiciona: conviene comprobar que usan los
   términos que de verdad busca el público anglosajón (por ejemplo, *managed
   detection and response* frente a una traducción literal).
2. **Los nombres propios de normativa.** El ENS es un marco español y su nombre
   no tiene traducción oficial: aquí se usa «National Security Framework (ENS)»
   la primera vez y «ENS» después. Si Marketing prefiere otra forma, hay que
   cambiarla en los siete artículos de cumplimiento a la vez.
3. **Registro y tono.** El español original alterna tuteo y usted; en inglés se
   ha unificado a un registro profesional directo. Merece una lectura de
   coherencia de marca.
4. **Variante de inglés.** Se ha usado **inglés británico** (*organisation*,
   *prioritise*, *analyse*), coherente con `en_GB` de los metadatos y con un
   público europeo. Si el objetivo comercial fuese Estados Unidos, hay que
   cambiar variante y también el `og:locale`.

### Lo que ya está comprobado automáticamente

- Cabecera válida y completa (`content:build`).
- Los enlaces internos apuntan a `/en/blog/…` y todos sus destinos existen.
- `hreflang` recíproco entre las dos versiones de cada artículo.
- Ningún enlace al blog anterior ni al dominio de Ewala en el cuerpo, salvo en
  `livet-digitalizacion-ganaderia-extensiva.md`, donde es correcto: la plataforma
  LIVET y el programa GUARDIANS son de Ewala.

Lo comprueban `pnpm content:build` y `e2e/blog.spec.ts`.
