import type { ReactNode } from 'react'

/**
 * Layout raiz.
 *
 * Deliberadamente **no renderiza `<html>` ni `<body>`**: los renderiza
 * `app/[locale]/layout.tsx`, que es el unico que sabe que valor va en `lang`.
 * Un `<html lang>` fijo aqui obligaria a que el layout de idioma lo sobreescriba
 * desde dentro, que no se puede.
 *
 * Todo el contenido del sitio vive bajo `/es/` o `/en/`; en `/` no hay nada,
 * porque Netlify lo redirige con un 301 fijo (seccion 2.1). Lo unico que pasa
 * por aqui sin idioma es `app/not-found.tsx`, la 404 de ultimo recurso, que
 * monta su propio documento.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
