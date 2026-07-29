import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Kicker } from '@/components/ui/Kicker'
import { LogoMarca } from '@/components/ui/LogoMarca'
import { Tag } from '@/components/ui/Tag'
import { LogoSentryNet } from '@/components/ui/LogoSentryNet'
import { LOGO_EWALA } from '@/config/logos'

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
            {/* Obligatoria: SentryN3t es marca de Ewala, no producto propio.
                Tras la division de Ewala, SentryN3t se queda con ellos y el
                resto de servicios pasan a ISN Labs, asi que la atribucion
                importa mas, no menos.

                El logo va SIN capsula: se pinta sobre la tarjeta oscura con la
                version clara de Ewala. Es un partner tecnologico, no una
                licencia de la rejilla, y darle la misma placa que a las cuatro
                de Software lo degradaria a "una marca mas de la lista". */}
            {/* Bloque de atribucion: los dos logotipos juntos y la nota de marca.
                El de SentryN3t NO va sobre el titular, porque el H2 ya dice
                «SentryN3t» y la palabra apareceria dos veces seguidas. Aqui, al
                lado del de Ewala, se lee como lo que es: de quien es el producto.

                El H2 sigue siendo texto, no imagen: es lo que leen los
                rastreadores y lo que sostiene la jerarquia de encabezados. */}
            <div className="border-border flex flex-col gap-3 border-t pt-4 lg:items-end lg:border-t-0 lg:pt-0">
              <LogoSentryNet alto={20} />
              <p className="text-text-dim text-xs lg:text-right">{note}</p>
              <LogoMarca logo={LOGO_EWALA} alto={16} ancho={90} />
            </div>
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
