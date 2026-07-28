import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Kicker } from '@/components/ui/Kicker'
import { Tag } from '@/components/ui/Tag'

/**
 * Banda de SentryN3t (mockup image3.png). Sale en la Home y en Software.
 *
 * > **Nota critica del brief:** «SentryN3t NO aparece en el hero (es tecnologia
 * > de partner): se destaca en su banda inferior y en la pagina Software».
 * > La web actual hace justo lo contrario, vendiendolo como producto propio.
 *
 * El enlace «Saber mas» va a ewala.es, en pestana nueva y con
 * `rel="noopener noreferrer"`, y debajo la nota de marca, que es obligatoria.
 */
interface PropsSentryBand {
  kicker: string
  title: string
  description: string
  chips: readonly string[]
  cta: string
  ctaUrl: string
  note: string
  a11yExternal: string
}

export function SentryBand({
  kicker,
  title,
  description,
  chips,
  cta,
  ctaUrl,
  note,
  a11yExternal,
}: PropsSentryBand) {
  return (
    <section className="site-container pb-12 md:pb-20">
      <Card className="p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-4">
            <Kicker color="verde">{kicker}</Kicker>
            <h2 className="section-title">{title}</h2>
            <p className="texto-cuerpo">{description}</p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
            <Button href={ctaUrl} externo variante="primario">
              {cta}
              <span className="sr-only"> ({a11yExternal})</span>
            </Button>
            {/* Obligatoria: SentryN3t es marca de Ewala, no producto propio. */}
            <p className="text-text-dim text-xs lg:text-right">{note}</p>
          </div>
        </div>

        <ul className="mt-8 flex flex-wrap gap-2.5">
          {chips.map((chip) => (
            <li key={chip}>
              <Tag acento="verde">{chip}</Tag>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
