import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CheckList } from '@/components/ui/CheckList'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tag } from '@/components/ui/Tag'

/**
 * Provisional. La ruta real es `app/[locale]/[[...slug]]/page.tsx`, que se crea
 * en la Fase 2 y resuelve todas las paginas por manifiesto; esta desaparece
 * entonces y `/` pasa a ser una redireccion 301 fija a `/es/` en netlify.toml.
 *
 * Mientras tanto sirve para ver renderizados los tokens y los componentes del
 * sistema de diseno contra el mockup image2.png.
 */
export default function PaginaProvisional() {
  return (
    <main className="site-container seccion flex flex-col gap-10">
      <SectionHeading
        nivel="h1"
        kicker="Sistema de diseño"
        kickerPrefijo="/01"
        titulo="ISN Labs"
        descripcion="Tokens y componentes de la Fase 1. Esta página es provisional: la sustituye el enrutado por manifiesto de la Fase 2."
      />

      <div className="flex flex-wrap gap-3">
        <Button variante="primario">Primario (CTA)</Button>
        <Button variante="secundario">Secundario</Button>
        <Button variante="ghost">Ghost / borde</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Tag acento="cian">NIS2</Tag>
        <Tag acento="verde">OK</Tag>
        <Tag acento="neutro">OT/ICS</Tag>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card acento="left" acentoColor="cian" className="p-6">
          <p className="etiqueta text-cyan mb-2">C1</p>
          <h2 className="subtitle mb-2">Monitorización continua</h2>
          <p className="texto-cuerpo text-sm">PBCG, SOC 24/7, NDR y gestión de incidentes.</p>
        </Card>

        <Card acento="top" acentoColor="verde" destacada className="p-6">
          <h2 className="subtitle mb-4">Detección</h2>
          <CheckList
            items={['Detección de anomalías', 'Alertas contextualizadas', 'Integración SIEM/XDR']}
          />
        </Card>
      </div>
    </main>
  )
}
