/**
 * Banda «Nuestro modelo de servicio» de la pagina MSSP (mockup image4.png):
 * etiqueta, titular y tres columnas con titulo en cian y descripcion.
 *
 * Se reutiliza en GRC para el bloque «Por que ISN Labs en GRC», que tiene la
 * misma forma con distinto contenido.
 */
interface PropsModelBand {
  label: string
  title?: string
  items: readonly { title: string; description: string }[]
}

export function ModelBand({ label, title, items }: PropsModelBand) {
  return (
    <section className="bg-panel border-border border-y">
      <div className="site-container seccion flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="etiqueta text-green">{label}</p>
          {title && <h2 className="section-title">{title}</h2>}
        </div>

        <ul className="grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <li key={item.title} className="flex flex-col gap-2">
              <h3 className="font-display text-cyan text-base font-bold">{item.title}</h3>
              <p className="texto-cuerpo text-sm">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
