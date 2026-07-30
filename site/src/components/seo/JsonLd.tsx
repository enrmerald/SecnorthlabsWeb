/**
 * Datos estructurados en la pagina.
 *
 * `dangerouslySetInnerHTML` es la forma habitual de emitir JSON-LD, y aqui es
 * segura porque el objeto lo construye el propio sitio en build a partir de
 * `EMPRESA`, del manifiesto de rutas y del front matter: nada de esto viene de
 * fuera. Aun asi se escapa `<`, porque un `</script>` dentro de una cadena
 * cerraria la etiqueta antes de tiempo y partiria el HTML.
 *
 * No es un componente de cliente: el script sale en el HTML exportado, que es
 * exactamente donde lo buscan los rastreadores.
 */
export function JsonLd({ datos }: { datos: object }) {
  const serializado = JSON.stringify(datos).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializado }}
    />
  )
}
