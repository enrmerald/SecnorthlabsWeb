import type { Metadata } from 'next'
import { DEFAULT_LOCALE, getRoute } from '@/config/routes'
import { construirMetadatos } from '@/lib/metadatos'
import { NoEncontrada } from '@/paginas/NoEncontrada'

/**
 * 404 unica: sin segmento `[locale]` no hace falta distinguir entre la 404 de
 * ultimo recurso y la traducida (antes eran dos ficheros, seccion 4.13 del plan
 * de un solo idioma). El layout raiz ya monta `<html>`/`<body>`, asi que esta
 * pagina solo pinta el contenido.
 *
 * **Los metadatos tienen que estar aqui, y no en `[[...slug]]/page.tsx`.** Es
 * contraintuitivo y la documentacion de Next no lo dice: al exportar, el worker
 * fuerza `res.statusCode = 404` para el path `/404/`, y con estado 404 el
 * renderizador conmuta la fuente de metadatos al modulo `not-found`, asi que
 * `generateMetadata` de la ruta atrapatodo **nunca llega a ejecutarse** para esa
 * pagina. Sin este export, `out/404.html`, `out/404/index.html` y
 * `out/_not-found/index.html` salen sin `<title>` ni descripcion, y son
 * exactamente lo que ve todo visitante perdido (`/*` -> `/404/` en netlify.toml).
 * Con el ingles activo no hay colision -`/en/404/` no es un path reservado- y esa
 * version si toma sus metadatos por la via normal.
 *
 * Efecto lateral aceptado: `/404/` acaba con dos `<meta name="robots"
 * content="noindex">`, el que Next anade por el estado y el de
 * `construirMetadatos`. Son la misma directiva. El segundo no sobra: es el unico
 * que cubre `/en/404/`, que se renderiza con estado 200.
 */
export const metadata: Metadata = construirMetadatos(DEFAULT_LOCALE, getRoute('notFound'))

export default function NotFoundRaiz() {
  return <NoEncontrada locale={DEFAULT_LOCALE} />
}
