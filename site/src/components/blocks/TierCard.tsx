import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CheckList } from '@/components/ui/CheckList'

/**
 * Tarjeta de nivel de SentryN3t (mockups image2.png e image6.png).
 *
 * > **Restriccion del brief, textual: «los precios NO se muestran. No publicar
 * > tarifas sin aprobacion».** Por eso el hueco del precio lo ocupa
 * > `priceLabel` («Según alcance») y no hay ninguna cifra en esta pagina.
 *
 * La tarjeta recomendada lleva borde verde y una insignia arriba a la derecha.
 */
interface PropsTierCard {
  name: string
  description: string
  features: readonly string[]
  priceLabel: string
  cta: string
  ctaHref: string
  recommended: boolean
  recommendedLabel: string
}

export function TierCard({
  name,
  description,
  features,
  priceLabel,
  cta,
  ctaHref,
  recommended,
  recommendedLabel,
}: PropsTierCard) {
  return (
    <Card
      as="li"
      destacada={recommended}
      acentoColor="verde"
      className="relative flex flex-col p-6 pt-8"
    >
      {recommended && (
        <span className="bg-green text-bg etiqueta absolute -top-3 right-5 rounded-full px-3 py-1">
          {recommendedLabel}
        </span>
      )}

      <h3 className="font-display text-lg font-bold">{name}</h3>
      <p className="texto-cuerpo mt-2 text-sm">{description}</p>

      {/* Sin cifra, por decision de negocio: no es un dato pendiente de
          rellenar, es lo que el brief exige publicar. */}
      <p className="border-border mt-6 border-t pt-5">
        <span className="font-display text-green text-xl font-bold">{priceLabel}</span>
      </p>

      <CheckList items={features} className="mt-5 mb-7" />

      <Button
        href={ctaHref}
        variante={recommended ? 'primario' : 'ghost'}
        ancho
        className="mt-auto"
      >
        {cta}
      </Button>
    </Card>
  )
}
