import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { displayFont, sansFont } from "@/app/fuentes";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Analitica, AnaliticaSinJs } from "@/components/seo/Analitica";
import { LOCALES, isLocale } from "@/config/routes";
import { cargarMensajes } from "@/i18n/mensajes";
import "@/app/globals.css";

/**
 * Layout de idioma: es el que renderiza `<html lang>`, la cabecera y el pie.
 *
 * **No se monta `NextIntlClientProvider`.** Es deliberado y esta medido: el
 * provider arrastra el runtime de cliente de next-intl a todas las paginas, y
 * ninguna lo necesita, porque los componentes de cliente reciben las cadenas que
 * usan como props desde los de build (seccion 1.4.1). Enviar el arbol de
 * mensajes entero al navegador para que un componente use veinte cadenas es
 * exactamente lo que prohibe el presupuesto de JavaScript de la seccion 12.6.
 *
 * Si algun dia un componente de cliente necesitara formateo con configuracion
 * regional, se monta el provider **alrededor de ese componente**, no aqui.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** `output: 'export'` no admite parametros fuera de `generateStaticParams`. */
export const dynamicParams = false;

interface PropsLayout {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LayoutIdioma({ children, params }: PropsLayout) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Sin esto, cualquier lectura de traducciones fuerza renderizado dinamico y
  // la pagina deja de ser estatica, que con output: 'export' es un fallo de
  // build y no una degradacion silenciosa.
  setRequestLocale(locale);

  const { common } = cargarMensajes(locale);

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${sansFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Lo mas arriba posible, que es lo que pide Google para no perder
            visitas de quien cierra la pestana enseguida. No estorba al enlace de
            salto: un script no es enfocable, asi que el primer destino del
            tabulador sigue siendo el de abajo. */}
        <Analitica />
        <AnaliticaSinJs />

        {/* Primer elemento enfocable de la pagina. Sin el, quien navega por
              teclado recorre la navegacion entera en cada una (Fase 9). */}
        <a
          href="#contenido"
          className="salto-contenido font-display bg-green text-bg rounded-[10px] px-4 py-2 text-sm font-bold"
        >
          {common.a11y.skipToContent}
        </a>

        <Navbar locale={locale} />
        {children}
        <Footer locale={locale} />
      </body>
    </html>
  );
}
