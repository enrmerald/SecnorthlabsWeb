import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // Obligatorio: genera out/ sin ningun runtime Next en produccion.
  // Es lo que elimina la superficie de ataque de un servidor (seccion 2.1).
  output: 'export',

  // /es/contacto/ -> index.html. Encaja con un hosting puramente estatico.
  trailingSlash: true,

  poweredByHeader: false,

  // No hay optimizador de imagenes en runtime: el pipeline se ejecuta en build
  // con Sharp (Fase 11.3).
  images: { unoptimized: true },

  // La clave `eslint` ya no existe en Next 16: `next lint` se elimino y
  // `next build` no ejecuta el linter. El lint se invoca aparte, en CI.
  typescript: { ignoreBuildErrors: false },
}

// redirects(), rewrites() y headers() NO funcionan con output: 'export'.
// Todo eso vive en netlify.toml (Fase 10).
export default withNextIntl(nextConfig)
