import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { displayFont, sansFont } from '@/app/fuentes'
import './globals.css'

/**
 * Layout raiz.
 *
 * Existe para que Next tenga un `<html>` bajo el que colgar la 404 de ultimo
 * recurso (la de las URLs sin idioma reconocible, seccion 4.13). El layout con
 * contenido real es `app/[locale]/layout.tsx`, que se crea en la Fase 3.
 */
export const metadata: Metadata = {
  title: 'ISN Labs',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${displayFont.variable} ${sansFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
