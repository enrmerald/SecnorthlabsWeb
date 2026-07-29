import { HeroInterior } from "@/components/blocks/HeroInterior";
import { FormularioContacto } from "@/components/forms/FormularioContacto";
import { StepList } from "@/components/blocks/Tarjetas";
import { Card } from "@/components/ui/Card";
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
          />
        </Card>

        <div className="flex flex-col gap-6">
          {/* ── Contacto directo ── */}
          <Card className="p-6">
            <h2 className="etiqueta text-cyan mb-5">
              {rail.contactDirect.title}
            </h2>
            <dl className="flex flex-col gap-4">
              {rail.contactDirect.items.map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <dt className="text-text-dim text-xs">{item.label}</dt>
                  <dd className="font-display text-sm font-bold">
                    <ValorContacto valor={item.value} />
                  </dd>
                </div>
              ))}
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
 * Convierte el correo en `mailto:` y el telefono en `tel:` (seccion 1.6). La
 * direccion y el horario se quedan como texto.
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
  return <>{valor}</>;
}
