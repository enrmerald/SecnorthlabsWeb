import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { HeroInterior } from "@/components/blocks/HeroInterior";
import { FormularioContacto } from "@/components/forms/FormularioContacto";
import { StepList } from "@/components/blocks/Tarjetas";
import { Card } from "@/components/ui/Card";
import { TextoEnlazado } from "@/components/ui/TextoEnlazado";
import type { Locale } from "@/config/routes";
import { cargarMensajes } from "@/i18n/mensajes";
import { EMPRESA, INCIDENT_PHONE, PRIVACY_VERSION, MARKETING_TEXT_VERSION } from "@/lib/empresa";
import { getLocalizedPath } from "@/config/routes";

/**
 * Contacto - `/es/contacto/` (seccion 4.11, mockup image10.png). Pagina clave.
 *
 * Dos columnas: formulario a la izquierda y rail derecho con tres tarjetas.
 */
export function Contacto({ locale }: { locale: Locale }) {
  const { contact, common } = cargarMensajes(locale);
  const { rail } = contact;

  return (
    <main id="contenido">
      <HeroInterior
        locale={locale}
        breadcrumb={contact.hero.breadcrumb}
        title={contact.hero.title}
        titleHighlight={contact.hero.titleHighlight}
        subtitle={contact.hero.subtitle}
      />

      <div className="site-container grid gap-8 pb-16 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <Card className="p-6 sm:p-8">
          <h2 className="subtitle mb-6">{contact.form.title}</h2>
          {/* Los textos se leen aqui, en build, y llegan al componente de cliente
              como props: no se monta ningun provider ni viaja el arbol de
              mensajes al navegador (seccion 1.4.1). */}
          <FormularioContacto
            textos={contact.form}
            locale={locale}
            privacyHref={getLocalizedPath("privacy", locale)}
            privacyVersion={PRIVACY_VERSION}
            marketingVersion={MARKETING_TEXT_VERSION}
            a11yRequerido={common.a11y.required}
            infoPrivacidad={
              /* Informacion basica en capas, visible sin desplegar nada. La
                 AEPD pide que este junto al formulario, no escondida tras un
                 enlace. Se monta aqui, en build, y no dentro del componente de
                 cliente: es texto que no reacciona a nada, asi que no tiene por
                 que viajar como JavaScript. */
              <details className="border-border bg-panel/50 rounded-[10px] border p-4">
                <summary className="font-display cursor-pointer text-xs font-bold">
                  {contact.form.privacyBasicInfo.title}
                </summary>
                <dl className="mt-3 flex flex-col gap-2">
                  {contact.form.privacyBasicInfo.rows.map((fila) => (
                    <div key={fila.label} className="text-xs">
                      <dt className="font-display text-cyan inline font-bold">
                        {fila.label}:{" "}
                      </dt>
                      <dd className="text-text-dim inline">
                        <TextoEnlazado texto={fila.value} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <a
                  href={getLocalizedPath("privacy", locale)}
                  className="text-cyan mt-3 inline-block text-xs underline"
                >
                  {contact.form.privacyBasicInfo.moreLabel}
                </a>
              </details>
            }
          />
        </Card>

        <div className="flex flex-col gap-6">
          {/* ── Contacto directo ── */}
          <Card className="p-6">
            <h2 className="etiqueta text-cyan mb-5">
              {rail.contactDirect.title}
            </h2>
            <dl className="flex flex-col gap-4">
              {rail.contactDirect.items.map((item) => {
                const Icono = ICONOS[item.icon] ?? Clock;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    {/* Decorativo: la etiqueta de al lado ya dice «Teléfono» o
                        «Horario», asi que leerlo dos veces solo estorba. */}
                    <Icono
                      aria-hidden="true"
                      className="text-cyan mt-0.5 size-4 shrink-0"
                      strokeWidth={2}
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <dt className="text-text-dim text-xs">{item.label}</dt>
                      <dd className="font-display text-sm font-bold">
                        <ValorContacto valor={item.value} />
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </Card>

          {/* ── Que pasa despues ── */}
          <Card className="p-6">
            <h2 className="etiqueta text-green mb-5">{rail.whatNext.title}</h2>
            {/* Tres pasos en columna: la rejilla de cuatro de StepList no encaja
                en un rail estrecho. */}
            <div className="[&>ol]:grid-cols-1 [&>ol]:xl:grid-cols-1">
              <StepList steps={rail.whatNext.steps} color="verde" />
            </div>
          </Card>

          {/* ── Incidente en curso ──
              Solo se renderiza si existe INCIDENT_PHONE. No hay linea 24/7 real
              (pendiente P3), y publicar un telefono de emergencia que nadie
              atiende es peor que no publicarlo. */}
          {INCIDENT_PHONE && (
            <Card className="border-alert/50 p-6" destacada={false}>
              <h2 className="etiqueta text-alert mb-3">
                {rail.incident.title}
              </h2>
              <p className="texto-cuerpo text-sm">{rail.incident.text}</p>
              <p className="font-display mt-4 text-sm font-bold">
                {/* En movil tiene que ser pulsable: es el caso en el que mas
                    falta hace. */}
                <a
                  href={`tel:${INCIDENT_PHONE.replace(/\s/g, "")}`}
                  className="hover:text-alert"
                >
                  {INCIDENT_PHONE}
                </a>
                <span className="text-text-dim">
                  {" "}
                  · {rail.incident.phoneSuffix}
                </span>
              </p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * El icono de cada dato de contacto.
 *
 * La clave viaja en `messages/*.json` junto al dato, y no se deduce del orden
 * del array: reordenar las filas dejaria el reloj en el telefono sin que fallara
 * nada. Son iconos de `lucide-react` importados en un componente de build, asi
 * que salen como SVG en el HTML y no envian ni un byte de JavaScript.
 */
const ICONOS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  mail: Mail,
  phone: Phone,
  map: MapPin,
  clock: Clock,
};

/**
 * Convierte el correo en `mailto:`, el telefono en `tel:` y la direccion en un
 * enlace a la ficha de Google Maps (seccion 1.6). El horario se queda en texto.
 */
function ValorContacto({ valor }: { valor: string }) {
  if (valor === EMPRESA.email) {
    return (
      <a
        href={`mailto:${valor}`}
        className="hover:text-cyan inline-flex min-h-6 items-center"
      >
        {valor}
      </a>
    );
  }
  if (valor === EMPRESA.telefono) {
    return (
      <a
        href={`tel:${EMPRESA.telefonoTel}`}
        className="hover:text-cyan inline-flex min-h-6 items-center"
      >
        {valor}
      </a>
    );
  }
  // La direccion. Se reconoce por la calle y no por la posicion en la lista,
  // igual que las dos de arriba, para que reordenar el rail no la desactive.
  if (valor.includes("Peña Brava")) {
    return (
      <a
        href={EMPRESA.mapaUrl}
        target="_blank"
        // `noopener` no es opcional con `target="_blank"`: sin el, la pagina
        // destino puede manipular la nuestra por `window.opener`.
        rel="noopener noreferrer"
        className="hover:text-cyan inline-flex min-h-6 items-center"
      >
        {valor}
      </a>
    );
  }
  return <>{valor}</>;
}
