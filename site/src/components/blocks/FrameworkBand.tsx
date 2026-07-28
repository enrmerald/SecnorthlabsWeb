/**
 * Banda de confianza con los marcos normativos (mockup image3.png).
 *
 * Etiqueta pequena y centrada, y debajo los siete marcos en Space Mono grande y
 * espaciado. En movil se envuelven en varias lineas en lugar de encogerse hasta
 * ser ilegibles.
 */
interface PropsFrameworkBand {
  label: string
  frameworks: readonly string[]
}

export function FrameworkBand({ label, frameworks }: PropsFrameworkBand) {
  return (
    <section aria-label={label} className="bg-panel border-border border-y">
      <div className="site-container flex flex-col items-center gap-5 py-10">
        <p className="etiqueta text-text-dim text-center">{label}</p>

        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
          {frameworks.map((marco) => (
            <li
              key={marco}
              className="font-display text-text text-base font-bold tracking-wide sm:text-lg"
            >
              {marco}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
