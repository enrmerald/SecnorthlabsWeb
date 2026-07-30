import { Button } from '@/components/ui/Button'

/**
 * Banda de llamada a la accion final, centrada y sobre `--color-panel`
 * (mockups image3.png y image4.png). Aparece en casi todas las paginas.
 *
 * Regla del brief que se respeta al componer cada pagina: **un solo boton
 * primario por vista**. Aqui el primario es el primero y el secundario va en
 * `ghost`.
 */
interface PropsCtaBand {
  title: string
  /** Segundo tramo del titular, en verde. */
  titleHighlight?: string
  subtitle?: string
  primario: { label: string; href: string }
  secundario?: { label: string; href: string }
}

export function CtaBand({ title, titleHighlight, subtitle, primario, secundario }: PropsCtaBand) {
  return (
    <section className="bg-panel border-border border-y">
      <div className="site-container seccion flex flex-col items-center gap-5 text-center">
        <h2 className="section-title">
          {title}
          {titleHighlight && (
            <>
              {/* Salto blando: en escritorio el titular va en dos lineas, como
                  en el mockup, y en movil el navegador ya lo parte solo. */}
              <br className="hidden md:inline" />{' '}
              <span className="text-green">{titleHighlight}</span>
            </>
          )}
        </h2>

        {subtitle && <p className="texto-cuerpo mx-auto text-center">{subtitle}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href={primario.href} variante="primario" tamano="lg">
            {primario.label}
          </Button>
          {secundario && (
            <Button href={secundario.href} variante="ghost" tamano="lg">
              {secundario.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
