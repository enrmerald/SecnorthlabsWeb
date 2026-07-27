import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'
import { displayFont, sansFont } from '@/app/fuentes'
import { LOCALES, isLocale, type Locale } from '@/config/routes'
import '@/app/globals.css'

/**
 * Layout de idioma. Es el que renderiza `<html lang>`, asi que la 404 de ultimo
 * recurso vive fuera, bajo el layout raiz.
 *
 * `NextIntlClientProvider` se monta **sin `messages`** a proposito: los
 * componentes de cliente reciben las cadenas que necesitan como props desde los
 * componentes de build (seccion 1.4.1). Enviar `es.json` entero al navegador
 * para que un componente use veinte cadenas es exactamente lo que el
 * presupuesto de JavaScript de la seccion 12.6 prohibe. El provider esta
 * unicamente para que el formateo de numeros y fechas comparta configuracion
 * regional con el servidor.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/** `output: 'export'` no admite parametros fuera de `generateStaticParams`. */
export const dynamicParams = false

interface PropsLayout {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LayoutIdioma({ children, params }: PropsLayout) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  // Sin esto, cualquier lectura de traducciones fuerza renderizado dinamico y
  // la pagina deja de ser estatica — que con output: 'export' es un fallo de
  // build, no una degradacion silenciosa.
  setRequestLocale(locale as Locale)

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${sansFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={{}}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
