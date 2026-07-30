import { HeroInterior } from '@/components/blocks/HeroInterior'
import { CalculadoraCliente } from '@/components/calculadora/CalculadoraCliente'
import { getLocalizedPath, type Locale } from '@/config/routes'
import { cargarMensajes } from '@/i18n/mensajes'
import { MARKETING_TEXT_VERSION, PRIVACY_VERSION } from '@/lib/empresa'

/**
 * Calculadora del PBCG - `/es/calculadora/` (Fase 5).
 *
 * Componente de build: lee los mensajes aqui y se los pasa al componente de
 * cliente como props. No monta ningun provider de traduccion ni envia el arbol
 * de mensajes al navegador (seccion 1.4.1).
 *
 * **Una sola columna, no dos.** El mockup dibuja un panel lateral fijo, pero eso
 * es de escritorio; el orden que pide la seccion 1.6 es vertical -parametros,
 * contacto, resultado- y mantenerlo en todas las anchuras evita tener dos
 * maquetaciones que divergen. El resultado sustituye al formulario cuando llega,
 * en lugar de convivir con el.
 */
export function Calculadora({ locale }: { locale: Locale }) {
  const { calculator, contact, common } = cargarMensajes(locale)

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={calculator.hero.breadcrumb}
        title={calculator.hero.title}
        titleHighlight={calculator.hero.titleHighlight}
        subtitle={calculator.hero.subtitle}
        acento="verde"
      />

      <div className="site-container max-w-4xl pb-16">
        <CalculadoraCliente
          textos={calculator}
          locale={locale}
          privacyHref={getLocalizedPath('privacy', locale)}
          privacyVersion={PRIVACY_VERSION}
          marketingVersion={MARKETING_TEXT_VERSION}
          // La casilla obligatoria es la misma que en contacto: acredita que se
          // facilito la informacion, no es un consentimiento generico.
          consentLabel={contact.form.consent}
          privacyLinkLabel={contact.form.privacyLinkLabel}
          a11yRequerido={common.a11y.required}
        />
      </div>
    </main>
  )
}
