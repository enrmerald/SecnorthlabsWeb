'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Locale } from '@/config/routes'
import { RUTAS_API, enviar, nuevaClaveIdempotencia } from '@/lib/api/cliente'

/**
 * Alta en la newsletter (formulario 4 del inventario de la seccion 6.0).
 *
 * **Es un tratamiento distinto del de los leads comerciales** y no comparte
 * tuberia con ellos: su base juridica es el consentimiento de marketing, va a
 * la lista de distribucion y **no crea ningun Lead en el CRM**. Mezclarlos es
 * exactamente lo que la AEPD revisa.
 *
 * Antispam sin terceros (seccion 6.12): honeypot y comprobacion de tiempo. **No
 * hay reCAPTCHA**: envia la IP del visitante y senales de comportamiento a un
 * responsable estadounidense, lo que contradice el argumento de soberania que
 * vende la casa, y ademas obligaria a bloquearlo tras el banner de cookies, con
 * lo que el formulario dejaria de funcionar para quien rechace.
 */
interface PropsFormularioNewsletter {
  textos: {
    placeholder: string
    cta: string
    privacyNote: string
    success: string
    error: string
  }
  locale: Locale
}

type Estado = 'inicial' | 'enviando' | 'exito' | 'error'

export function FormularioNewsletter({ textos, locale }: PropsFormularioNewsletter) {
  const idEmail = useId()
  const idEstado = useId()
  const [estado, setEstado] = useState<Estado>('inicial')

  // Marca de tiempo de cuando la persona vio el formulario. El gateway descarta
  // lo que llegue en menos de ~3 segundos: cuesta cinco lineas y filtra la
  // mayoria del spam automatizado.
  //
  // Se fija **despues del montaje**, no durante el render. Con
  // `output: 'export'` el componente tambien se renderiza en el build, asi que
  // un `Date.now()` en el cuerpo quedaria congelado con la fecha de la
  // compilacion: la comprobacion de tiempo daria siempre por bueno el envio y
  // el antispam seria decorativo. Lo mismo con la clave de idempotencia, que
  // ademas seria la misma para todos los visitantes.
  const renderizadoEn = useRef(0)
  const clave = useRef('')

  useEffect(() => {
    renderizadoEn.current = Date.now()
    clave.current = nuevaClaveIdempotencia()
  }, [])

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (estado === 'enviando') return

    const datos = new FormData(evento.currentTarget)
    setEstado('enviando')

    const respuesta = await enviar(
      RUTAS_API.newsletter,
      {
        email: datos.get('email'),
        locale,
        _hp: datos.get('empresa_web'),
        _t: renderizadoEn.current,
      },
      { claveIdempotencia: clave.current },
    )

    setEstado(respuesta.ok ? 'exito' : 'error')
  }

  if (estado === 'exito') {
    return (
      <p role="status" className="text-green mt-6 text-sm">
        {textos.success}
      </p>
    )
  }

  return (
    <form onSubmit={alEnviar} className="mt-6 flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={idEmail} className="sr-only">
          {textos.placeholder}
        </label>
        <input
          id={idEmail}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={textos.placeholder}
          aria-describedby={estado === 'error' ? idEstado : undefined}
          aria-invalid={estado === 'error' || undefined}
          className="bg-bg border-border text-text placeholder:text-text-dim focus-visible:border-cyan min-h-11 flex-1 rounded-[10px] border px-4 py-2.5 outline-none"
        />

        <Button type="submit" variante="primario" disabled={estado === 'enviando'}>
          {textos.cta}
        </Button>
      </div>

      {/* Honeypot: campo real, invisible para las personas y visible para los
          bots que rellenan todo. No se usa `display: none` porque algunos bots
          lo detectan; `aria-hidden` y `tabIndex` lo sacan del flujo accesible. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${idEmail}-hp`}>No rellenar</label>
        <input id={`${idEmail}-hp`} name="empresa_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-text-dim text-xs">{textos.privacyNote}</p>

      {estado === 'error' && (
        <p id={idEstado} role="alert" className="text-alert text-sm">
          {textos.error}
        </p>
      )}
    </form>
  )
}
